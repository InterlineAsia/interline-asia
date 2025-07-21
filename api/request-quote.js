// Fixed Quote Request API - Sends quote request emails
// Handles quote requests and forwards them to reservations team

const { generateQuoteId, isValidQuoteId } = require('../lib/quote-id-generator');
const { formatEmailDate } = require('../lib/date-formatter');
const { rateLimitMiddleware } = require('../lib/rate-limiter-enhanced');
const { logQuoteSubmission, logApiError } = require('../lib/audit-logger');
const { withFallback } = require('../lib/fallback-handler');
const { validateQuoteRequest, sanitizeObject } = require('../lib/server-validation');

// Apply rate limiting and validation
const rateLimiter = rateLimitMiddleware('quote');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    rateLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const startTime = Date.now();

  try {
    console.log('QUOTE API: Request received from IP:', req.headers['x-forwarded-for'] || req.connection?.remoteAddress);
    
    // Sanitize input data
    req.body = sanitizeObject(req.body);
    const { cruiseId, clientName, userId, userEmail, dealId, cruiseData } = req.body;

    // Server-side validation
    const validation = validateQuoteRequest(req.body);
    if (!validation.isValid) {
      await logApiError(req, new Error('Validation failed'), { 
        statusCode: 400, 
        validationErrors: validation.errors 
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input and try again',
        details: validation.errors
      });
    }

    // Generate clean quote ID
    const quoteId = generateQuoteId();
    console.log('QUOTE API: Generated quote ID:', quoteId);

    // Skip user authentication check - we'll use service role for database operations
    console.log('QUOTE API: Processing quote request for user:', userId);

    // Create a simple email-only quote request (no database storage needed)
    console.log('QUOTE API: Preparing email notification');

    // Format cruise data for display
    const departureDate = cruiseData?.departure_date ? formatEmailDate(cruiseData.departure_date) : 'Date TBD';
    const cruiseLine = cruiseData?.cruise_line || 'Not specified';
    const shipName = cruiseData?.ship_name || 'Not specified';
    const duration = cruiseData?.nights ? `${cruiseData.nights} nights` : 'Duration TBD';

    // Generate secure quote response link
    const quoteResponseUrl = `https://interlineasia.com/quote-response?id=${encodeURIComponent(quoteId)}`;

    // Prepare email content with client information
    const emailSubject = `New Quote Request - ${quoteId}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">New Quote Request - ${quoteId}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Request Details</h3>
          <p><strong>Quote ID:</strong> ${quoteId}</p>
          <p><strong>Client Name:</strong> ${clientName}</p>
          <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>User ID:</strong> ${userId}</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Cruise Details</h3>
          <p><strong>Cruise Line:</strong> ${cruiseLine}</p>
          <p><strong>Ship:</strong> ${shipName}</p>
          <p><strong>Departure Date:</strong> ${departureDate}</p>
          <p><strong>Duration:</strong> ${duration}</p>
          <p><strong>Cruise ID:</strong> ${cruiseId}</p>
          ${dealId && dealId !== cruiseId ? `<p><strong>Deal ID:</strong> ${dealId}</p>` : ''}
        </div>

        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">Quote Response</h3>
          <p style="color: #15803d;">Please use this secure link to respond with pricing:</p>
          <p style="margin: 15px 0;">
            <a href="${quoteResponseUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Respond to Quote ${quoteId}
            </a>
          </p>
          <p style="color: #15803d; font-size: 14px;">
            Link: ${quoteResponseUrl}
          </p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Next Steps</h3>
          <p>Please review the request and prepare a quote for the client. The contact email is included above. Thank you!</p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #64748b; font-size: 12px;">
            This quote request was generated by Interline Asia's booking system.
          </p>
        </div>
      </div>
    `;

    console.log('QUOTE API: Sending email notification');

    // Send email using Brevo API to both addresses
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: 'noreply@interlineasia.com'
        },
        to: [
          { email: 'reservations@interlinetravel.com.au' }
        ],
        cc: [
          { email: 'admin@interlineasia.com' }
        ],
        subject: emailSubject,
        htmlContent: emailHtml
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('QUOTE ERROR: Email send failed:', errorText);
      return res.status(500).json({ 
        error: 'Failed to send quote request email',
        details: errorText 
      });
    }

    console.log('QUOTE API: Email sent successfully');

    const result = {
      status: 'success',
      success: true,
      message: 'Quote request sent successfully',
      quoteId: quoteId,
      processingTime: Date.now() - startTime
    };

    // Log successful submission
    await logQuoteSubmission(req, req.body, result);

    res.status(200).json(result);

  } catch (err) {
    console.error('QUOTE ERROR:', err);
    
    // Log the error
    await logApiError(req, err, { statusCode: 500 });
    
    // Use fallback handler for user-friendly error
    const { generateFallbackResponse } = require('../lib/fallback-handler');
    const fallbackResponse = generateFallbackResponse(err, { 
      operation: 'quote',
      endpoint: req.url 
    });
    
    return res.status(500).json(fallbackResponse);
  }
}