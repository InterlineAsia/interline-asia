// Consolidated Quotes API - Handles all quote types
// Combines: request-quote.js + send-quote.js + generate-pdf-quote.js
// Routes: /api/quotes?action=request | /api/quotes?action=send | /api/quotes?action=pdf

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.query.action || 'send';

  try {
    switch (action) {
      case 'request':
        return await handleQuoteRequest(req, res);
      case 'send':
        return await handleDirectQuote(req, res);
      case 'pdf':
        return await handlePDFGeneration(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action. Use: request, send, or pdf' });
    }
  } catch (error) {
    console.error('Quote processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process quote request'
    });
  }
}

// Handle authenticated quote requests (from request-quote.js)
async function handleQuoteRequest(req, res) {
  const { generateQuoteId, isValidQuoteId } = require('../lib/quote-id-generator');
  const { formatEmailDate } = require('../lib/date-formatter');
  const { rateLimitMiddleware } = require('../lib/rate-limiter-enhanced');
  const { logQuoteSubmission, logApiError } = require('../lib/audit-logger');
  const { withFallback } = require('../lib/fallback-handler');
  const { validateQuoteRequest, sanitizeObject } = require('../lib/server-validation');

  // Apply rate limiting and validation
  const rateLimiter = rateLimitMiddleware('quote');
  
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

    // Generate secure quote response link (TODO: Update when quote-response page is implemented)
    const quoteResponseUrl = `https://interlineasia.com/quote-confirmation?quote=${encodeURIComponent(quoteId)}`;

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

// Handle direct quote form submissions (from send-quote.js)
async function handleDirectQuote(req, res) {
  try {
    const {
      cruiseDetails,
      clientName,
      clientEmail,
      clientPhone,
      preferredCabinType,
      cabinRequirements,
      specialRequests,
      timestamp,
      source
    } = req.body;

    // Validate required fields
    if (!cruiseDetails || !clientName || !clientEmail || !cabinRequirements) {
      return res.status(400).json({ 
        error: 'Missing required fields: cruiseDetails, clientName, clientEmail, cabinRequirements' 
      });
    }

    // Validate at least one cabin is selected
    const totalCabins = Object.values(cabinRequirements).reduce((sum, count) => sum + (count || 0), 0);
    if (totalCabins === 0) {
      return res.status(400).json({ error: 'At least one cabin must be selected' });
    }

    // Format cabin requirements for email
    const cabinSummary = [];
    if (cabinRequirements.interior > 0) cabinSummary.push(`${cabinRequirements.interior} Interior cabin(s)`);
    if (cabinRequirements.oceanview > 0) cabinSummary.push(`${cabinRequirements.oceanview} Oceanview cabin(s)`);
    if (cabinRequirements.balcony > 0) cabinSummary.push(`${cabinRequirements.balcony} Balcony cabin(s)`);
    if (cabinRequirements.suite > 0) cabinSummary.push(`${cabinRequirements.suite} Suite cabin(s)`);

    // Generate unique quote ID for tracking
    const { generateQuoteId } = require('../lib/quote-id-generator');
    const quoteId = generateQuoteId();

    // Prepare email to reservations team
    const emailData = {
      to: ['reservations@interlinetravel.com.au'],
      cc: ['admin@interlineasia.com'],
      subject: `New Quote Request - ${cruiseDetails.shipName} (${cruiseDetails.cruiseLine})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">New Quote Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Quote ID: ${quoteId}</p>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #0f172a;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Client Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientEmail}</td>
                </tr>
                ${clientPhone ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientPhone}</td>
                </tr>
                ` : ''}
                ${preferredCabinType ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Preferred Cabin:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${preferredCabinType}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #0ea5e9;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Cruise Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Cruise Line:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.cruiseLine || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ship:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.shipName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Departure Date:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.departureDate || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Duration:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.duration || 'N/A'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Cabin Requirements</h2>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
                ${cabinSummary.map(cabin => `<li style="margin-bottom: 8px;">${cabin}</li>`).join('')}
              </ul>
            </div>

            ${specialRequests ? `
            <div style="background: #fef3c7; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Special Requests</h2>
              <p style="margin: 0; color: #1f2937; line-height: 1.6;">${specialRequests}</p>
            </div>
            ` : ''}
          </div>
        </div>
      `
    };

    // Send email using Brevo API
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
        to: emailData.to.map(email => ({ email })),
        cc: emailData.cc.map(email => ({ email })),
        subject: emailData.subject,
        htmlContent: emailData.html
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email send failed:', errorText);
      return res.status(500).json({ 
        error: 'Failed to send quote request email',
        details: errorText 
      });
    }

    // Send confirmation email to client
    const confirmationEmailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
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
        to: [{ email: clientEmail }],
        subject: `Quote Request Received - ${quoteId}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Quote Request Received</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your interest!</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
                Dear ${clientName},
              </p>
              
              <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
                We have received your quote request for <strong>${cruiseDetails.shipName}</strong> and our team is working on preparing a personalized quote for you.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f172a;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  <strong>Quote Reference:</strong> ${quoteId}<br>
                  <strong>Submitted:</strong> ${new Date(timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney time)
                </p>
              </div>
              
              <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
                If you have any questions, please don't hesitate to contact us at reservations@interlinetravel.com.au
              </p>
              
              <p style="font-size: 16px; color: #1f2937;">
                Best regards,<br>
                <strong>Interline Asia Team</strong>
              </p>
            </div>
          </div>
        `
      })
    });

    // Don't fail the request if confirmation email fails
    if (!confirmationEmailResponse.ok) {
      console.warn('Confirmation email failed to send, but quote request was successful');
    }

    res.status(200).json({
      success: true,
      message: 'Quote request sent successfully',
      quoteId: quoteId
    });

  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process quote request'
    });
  }
}

// Handle PDF generation (from generate-pdf-quote.js)
async function handlePDFGeneration(req, res) {
  try {
    const { 
      quoteId, 
      token, 
      generatePDF = false 
    } = req.body;

    // Validate required fields
    if (!quoteId || !token) {
      return res.status(400).json({ error: 'Missing quote ID or token' });
    }

    // Verify quote request exists and token is valid
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        users!inner(email, first_name, last_name),
        cruises!inner(*)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found or invalid token' });
    }

    const cruise = quoteRequest.cruises;
    const user = quoteRequest.users;

    if (!generatePDF) {
      // Return quote data for preview
      return res.status(200).json({
        success: true,
        quote: quoteRequest,
        cruise: cruise,
        user: user
      });
    }

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set PDF content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quote ${quoteId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cruise Quote</h1>
          <p>Quote ID: ${quoteId}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Client Information</h2>
            <p><span class="label">Name:</span> <span class="value">${user.first_name} ${user.last_name}</span></p>
            <p><span class="label">Email:</span> <span class="value">${user.email}</span></p>
          </div>
          
          <div class="section">
            <h2>Cruise Details</h2>
            <p><span class="label">Cruise Line:</span> <span class="value">${cruise.cruise_line}</span></p>
            <p><span class="label">Ship:</span> <span class="value">${cruise.ship_name}</span></p>
            <p><span class="label">Departure Date:</span> <span class="value">${new Date(cruise.departure_date).toLocaleDateString()}</span></p>
            <p><span class="label">Duration:</span> <span class="value">${cruise.nights} nights</span></p>
          </div>
          
          <div class="section">
            <h2>Quote Details</h2>
            <p><span class="label">Generated:</span> <span class="value">${new Date().toLocaleDateString()}</span></p>
            <p><span class="label">Valid Until:</span> <span class="value">${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</span></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${quoteId}.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to generate PDF'
    });
  }
}