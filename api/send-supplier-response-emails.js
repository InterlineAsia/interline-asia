// Interline Asia - Supplier Response Email Notifications
// Sends emails when suppliers confirm or decline bookings

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referenceNumber, action, updateData, bookingData } = req.body;

    if (!referenceNumber || !action || !updateData || !bookingData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Send notification emails
    const results = await Promise.allSettled([
      sendMemberNotificationEmail(referenceNumber, action, updateData, bookingData),
      sendAdminNotificationEmail(referenceNumber, action, updateData, bookingData)
    ]);

    const memberResult = results[0];
    const adminResult = results[1];

    const response = {
      success: true,
      results: {
        member: memberResult.status === 'fulfilled' ? 'sent' : 'failed',
        admin: adminResult.status === 'fulfilled' ? 'sent' : 'failed'
      }
    };

    // Log any failures
    if (memberResult.status === 'rejected') {
      console.error('Member notification failed:', memberResult.reason);
    }
    if (adminResult.status === 'rejected') {
      console.error('Admin notification failed:', adminResult.reason);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Supplier response email service error:', error);
    return res.status(500).json({ error: 'Failed to send notification emails' });
  }
}

// Send notification to member about supplier response
async function sendMemberNotificationEmail(referenceNumber, action, updateData, bookingData) {
  const passengers = bookingData.passengers || [];
  const passenger1 = passengers.find(p => p.passenger_number === 1) || {};
  const firstName = passenger1.full_name ? passenger1.full_name.split(' ')[0] : 'Valued Customer';

  const emailData = {
    sender: {
      name: "Interline Asia",
      email: "noreply@interlineasia.com"
    },
    to: [{
      email: passenger1.email,
      name: passenger1.full_name
    }],
    subject: action === 'confirmed' 
      ? `🎉 Your Cruise Booking is CONFIRMED! – ${referenceNumber}`
      : `📋 Update on Your Cruise Rate Request – ${referenceNumber}`,
    htmlContent: action === 'confirmed' ? getConfirmationEmailHTML(firstName, referenceNumber, updateData, bookingData) : getDeclineEmailHTML(firstName, referenceNumber, updateData, bookingData)
  };

  return await sendBrevoEmail(emailData);
}

// Send notification to admin about supplier response
async function sendAdminNotificationEmail(referenceNumber, action, updateData, bookingData) {
  const emailData = {
    sender: {
      name: "Interline Asia System",
      email: "system@interlineasia.com"
    },
    to: [{
      email: "admin@interlineasia.com",
      name: "Admin Team"
    }],
    subject: `🔔 Supplier Response: ${action.toUpperCase()} – ${referenceNumber}`,
    htmlContent: getAdminNotificationHTML(referenceNumber, action, updateData, bookingData)
  };

  return await sendBrevoEmail(emailData);
}

// Confirmation email HTML
function getConfirmationEmailHTML(firstName, referenceNumber, updateData, bookingData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .confirmation-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: 600; color: #64748b; }
        .detail-value { font-weight: 500; color: #1e293b; }
        .payment-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 BOOKING CONFIRMED!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your cruise is officially booked</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Congratulations ${firstName}!</h2>
          
          <p>Fantastic news! Your cruise booking has been <strong>confirmed</strong> by the cruise line. Here are your official booking details:</p>
          
          <div class="confirmation-box">
            <h3 style="margin: 0 0 15px 0; color: #16a34a;">✅ Confirmed Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Reference Number:</span>
              <span class="detail-value">${referenceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Official Booking Number:</span>
              <span class="detail-value">${updateData.official_booking_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cabin Number:</span>
              <span class="detail-value">${updateData.cabin_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cruise:</span>
              <span class="detail-value">${bookingData.cruise_line} - ${bookingData.ship_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Departure:</span>
              <span class="detail-value">${bookingData.departure_date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${bookingData.nights} nights</span>
            </div>
          </div>
          
          <div class="payment-section">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">💳 Payment Information</h4>
            <p style="margin: 0 0 10px 0;"><strong>Total Amount:</strong> $${updateData.payment_amount}</p>
            <p style="margin: 0; font-size: 14px;">${updateData.payment_instructions}</p>
          </div>
          
          <p>We'll be in touch shortly with detailed payment instructions and next steps. Start getting excited for your amazing cruise adventure!</p>
          
          <p style="margin-top: 30px;">Warm regards,<br><strong>The Interline Asia Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 Interline Asia. Your trusted partner for exclusive travel industry rates.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Decline email HTML
function getDeclineEmailHTML(firstName, referenceNumber, updateData, bookingData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Update</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .decline-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .alternative-section { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">📋 Booking Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Update on your cruise rate request</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${firstName},</h2>
          
          <p>Thank you for your patience while we reviewed your cruise rate request.</p>
          
          <div class="decline-box">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">❌ Request Status: Unable to Confirm</h3>
            <p style="margin: 0;"><strong>Reference:</strong> ${referenceNumber}</p>
            <p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${updateData.supplier_response || 'Availability constraints'}</p>
          </div>
          
          <p>Unfortunately, the cruise line was unable to accommodate this particular request at industry rates. This can happen due to availability constraints or booking restrictions.</p>
          
          <div class="alternative-section">
            <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">🔍 What's Next?</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Browse our other exclusive cruise deals</li>
              <li>Contact us for alternative dates or ships</li>
              <li>Set up alerts for similar cruises</li>
            </ul>
          </div>
          
          <p>Don't worry - we have many other fantastic cruise opportunities available. Our team is here to help you find the perfect alternative.</p>
          
          <p style="margin-top: 30px;">Thank you for choosing Interline Asia,<br><strong>The Interline Asia Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 Interline Asia. Your trusted partner for exclusive travel industry rates.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Admin notification HTML
function getAdminNotificationHTML(referenceNumber, action, updateData, bookingData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Supplier Response</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 25px; text-align: center; }
        .content { padding: 30px; }
        .status-box { border-radius: 8px; padding: 15px; margin: 20px 0; }
        .confirmed { background: #f0fdf4; border-left: 4px solid #22c55e; }
        .declined { background: #fef2f2; border-left: 4px solid #ef4444; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 26px;">🔔 Supplier Response</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking status update</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b;">Admin Team,</h2>
          
          <p>A supplier has responded to booking request <strong>${referenceNumber}</strong>:</p>
          
          <div class="status-box ${action === 'confirmed' ? 'confirmed' : 'declined'}">
            <h3 style="margin: 0 0 10px 0; color: ${action === 'confirmed' ? '#16a34a' : '#dc2626'};">
              ${action === 'confirmed' ? '✅ CONFIRMED' : '❌ DECLINED'}
            </h3>
            <p><strong>Cruise:</strong> ${bookingData.cruise_line} - ${bookingData.ship_name}</p>
            <p><strong>Departure:</strong> ${bookingData.departure_date}</p>
            ${action === 'confirmed' ? `
              <p><strong>Cabin Number:</strong> ${updateData.cabin_number}</p>
              <p><strong>Booking Number:</strong> ${updateData.official_booking_number}</p>
              <p><strong>Payment Amount:</strong> $${updateData.payment_amount}</p>
            ` : `
              <p><strong>Decline Reason:</strong> ${updateData.supplier_response}</p>
            `}
          </div>
          
          <p>The customer has been automatically notified of this update.</p>
          
          <p style="margin-top: 30px; color: #64748b; font-style: italic;">– Interline Asia System Bot 🤖</p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the Interline Asia booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send email via Brevo API
async function sendBrevoEmail(emailData) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
}