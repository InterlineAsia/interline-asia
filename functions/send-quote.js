/**
 * Interline Asia - Quote Email Sender
 * Sends cruise quotes via Brevo API
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Validate required environment variables
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('SEND_QUOTE: Missing BREVO_API_KEY environment variable');
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

    // Parse and validate request body
    const {
      cruiseId,
      interior,
      oceanview,
      balcony,
      suite,
      notes,
      sendTo,
      cc,
      cruiseDetails
    } = req.body;

    // Validate required fields
    if (!cruiseId) {
      return res.status(400).json({
        success: false,
        error: 'Cruise ID is required'
      });
    }

    // Check if at least one price is provided
    const hasPrice = interior || oceanview || balcony || suite;
    if (!hasPrice) {
      return res.status(400).json({
        success: false,
        error: 'At least one cabin price must be provided'
      });
    }

    // Determine recipient email
    let recipientEmail = sendTo;
    if (!recipientEmail) {
      // Mock client email lookup by cruise ID
      // In production, this would query your database
      recipientEmail = await lookupClientEmail(cruiseId);
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          error: 'Unable to determine recipient email address'
        });
      }
    }

    // Build email content
    const emailContent = buildQuoteEmail({
      cruiseId,
      interior,
      oceanview,
      balcony,
      suite,
      notes,
      cruiseDetails
    });

    // Prepare Brevo API request
    const brevoPayload = {
      sender: {
        name: 'Interline Asia',
        email: 'noreply@interlineasia.com'
      },
      to: [
        {
          email: recipientEmail,
          name: 'Valued Client'
        }
      ],
      cc: cc ? [
        {
          email: cc,
          name: 'Admin Team'
        }
      ] : [
        {
          email: 'admin@interlineasia.com',
          name: 'Admin Team'
        }
      ],
      subject: 'Your Interline Asia Cruise Quote',
      htmlContent: emailContent.html,
      textContent: emailContent.text
    };

    // Send email via Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(brevoPayload)
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}));
      console.error('SEND_QUOTE: Brevo API error:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        error: errorData
      });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again.'
      });
    }

    const brevoResult = await brevoResponse.json();
    console.log('SEND_QUOTE: Email sent successfully:', {
      messageId: brevoResult.messageId,
      recipient: recipientEmail,
      cruiseId
    });

    // Return success response
    return res.status(200).json({
      success: true,
      messageId: brevoResult.messageId,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('SEND_QUOTE: Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    });
  }
}

/**
 * Mock function to lookup client email by cruise ID
 * In production, this would query your Supabase database
 */
async function lookupClientEmail(cruiseId) {
  // Mock implementation - replace with actual database lookup
  const mockClients = {
    'ocean_cruise_18125': 'client.demo@example.com',
    'river_cruise_12345': 'river.client@example.com',
    'expedition_cruise_67890': 'expedition.client@example.com'
  };

  // Simulate database lookup delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return mockClients[cruiseId] || 'demo.client@interlineasia.com';
}

/**
 * Build formatted email content for the cruise quote
 */
function buildQuoteEmail({ cruiseId, interior, oceanview, balcony, suite, notes, cruiseDetails }) {
  const shipName = cruiseDetails?.shipName || 'Cruise Ship';
  const cruiseLine = cruiseDetails?.cruiseLine || 'Cruise Line';
  const departureDate = cruiseDetails?.departureDate || 'TBA';

  // Format prices for display
  const formatPrice = (price) => {
    if (!price || price === '0') return 'Not Available';
    return `$${parseFloat(price).toLocaleString()}`;
  };

  // Build pricing table
  const pricingRows = [
    { cabin: 'Interior Cabin', price: formatPrice(interior) },
    { cabin: 'Oceanview Cabin', price: formatPrice(oceanview) },
    { cabin: 'Balcony Cabin', price: formatPrice(balcony) },
    { cabin: 'Suite', price: formatPrice(suite) }
  ].filter(row => row.price !== 'Not Available');

  // HTML Email Content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Cruise Quote</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 2rem; text-align: center; }
    .header h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
    .header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
    .content { padding: 2rem; }
    .cruise-summary { background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid #3b82f6; }
    .cruise-summary h2 { margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.25rem; }
    .cruise-summary p { margin: 0; color: #64748b; }
    .pricing-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    .pricing-table th, .pricing-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .pricing-table th { background: #f8fafc; font-weight: 600; color: #374151; }
    .pricing-table .price { font-weight: 700; color: #059669; }
    .notes-section { background: #fff7ed; border-radius: 12px; padding: 1.5rem; margin: 2rem 0; border-left: 4px solid #f59e0b; }
    .notes-section h3 { margin: 0 0 1rem 0; color: #92400e; font-size: 1.125rem; }
    .notes-section p { margin: 0; color: #78350f; }
    .footer { background: #f8fafc; padding: 2rem; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; color: #64748b; font-size: 0.875rem; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 0.875rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚢 Your Cruise Quote</h1>
      <p>Exclusive rates for travel industry professionals</p>
    </div>
    
    <div class="content">
      <div class="cruise-summary">
        <h2>${shipName}</h2>
        <p><strong>${cruiseLine}</strong> • Departure: ${departureDate}</p>
      </div>
      
      <h3>Pricing Information</h3>
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Cabin Type</th>
            <th>Price per Person</th>
          </tr>
        </thead>
        <tbody>
          ${pricingRows.map(row => `
            <tr>
              <td>${row.cabin}</td>
              <td class="price">${row.price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${notes ? `
      <div class="notes-section">
        <h3>Additional Notes & Suggestions</h3>
        <p>${notes.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
      
      <p>This quote is valid for a limited time and subject to availability. To proceed with booking or if you have any questions, please contact us directly.</p>
      
      <div style="text-align: center; margin: 2rem 0;">
        <a href="mailto:admin@interlineasia.com" class="cta-button">Contact Us to Book</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Interline Asia</strong><br>
      Exclusive cruise deals for travel industry professionals<br>
      Email: admin@interlineasia.com | Web: interlineasia.com</p>
    </div>
  </div>
</body>
</html>`;

  // Plain Text Content
  const textContent = `
INTERLINE ASIA - YOUR CRUISE QUOTE

Cruise Details:
${shipName} - ${cruiseLine}
Departure: ${departureDate}

PRICING:
${pricingRows.map(row => `${row.cabin}: ${row.price}`).join('\n')}

${notes ? `ADDITIONAL NOTES:
${notes}

` : ''}This quote is valid for a limited time and subject to availability.

To proceed with booking or for questions, contact:
Email: admin@interlineasia.com
Web: interlineasia.com

---
Interline Asia
Exclusive cruise deals for travel industry professionals
`;

  return {
    html: htmlContent,
    text: textContent
  };
}