// Direct Quote Request API - Sends quote requests to reservations team
// Handles direct quote form submissions without authentication

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      cruiseDetails,
      clientName,
      clientEmail,
      clientPhone,
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
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.nights ? cruiseDetails.nights + ' nights' : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Region:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.region || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Departure Port:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.departurePort || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Arrival Port:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cruiseDetails.arrivalPort || 'N/A'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Cabin Requirements</h2>
              <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${cabinSummary.join('<br>')}
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
                <strong>Total cabins requested:</strong> ${totalCabins}
              </p>
            </div>

            ${specialRequests ? `
            <div style="background: #fefce8; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #eab308;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Special Requests & Notes</h2>
              <div style="color: #1f2937; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${specialRequests}</div>
            </div>
            ` : ''}

            <div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                This quote request was generated by Interline Asia's direct quote form.<br>
                Submitted on ${new Date(timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney time)<br>
                Source: ${source || 'direct_quote_form'}
              </p>
            </div>
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
          name: 'Interline Asia Quote System',
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
        subject: `Quote Request Confirmation - ${cruiseDetails.shipName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Quote Request Received</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937;">Dear ${clientName},</p>
              
              <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
                Thank you for your quote request for <strong>${cruiseDetails.shipName}</strong> with ${cruiseDetails.cruiseLine}.
              </p>
              
              <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
                Our reservations team will review your requirements and provide you with personalized pricing within 24-48 hours.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
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