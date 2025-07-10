// Interline Asia - Automated Follow-up Email System
// Sends Bon Voyage (3 days before) and Welcome Home (3 days after) emails

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailType, bookingData } = req.body;

    if (!emailType || !bookingData) {
      return res.status(400).json({ error: 'Missing email type or booking data' });
    }

    let result;
    if (emailType === 'bon-voyage') {
      result = await sendBonVoyageEmail(bookingData);
    } else if (emailType === 'welcome-home') {
      result = await sendWelcomeHomeEmail(bookingData);
    } else {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    return res.status(200).json({ success: true, result });

  } catch (error) {
    console.error('Follow-up email service error:', error);
    return res.status(500).json({ error: 'Failed to send follow-up email' });
  }
}

// Send Bon Voyage email (3 days before departure)
async function sendBonVoyageEmail(bookingData) {
  const passengers = bookingData.passengers || [];
  const passenger1 = passengers.find(p => p.passenger_number === 1) || {};
  const firstName = passenger1.full_name ? passenger1.full_name.split(' ')[0] : 'Valued Guest';

  const emailData = {
    sender: {
      name: "Interline Asia",
      email: "noreply@interlineasia.com"
    },
    to: [{
      email: passenger1.email,
      name: passenger1.full_name
    }],
    subject: `🛳️ Bon Voyage ${firstName}! Your cruise adventure begins soon`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon Voyage!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .cruise-details { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
          .tips-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .emoji { font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🛳️⚓🌊</div>
            <h1 style="margin: 10px 0; font-size: 28px;">Bon Voyage!</h1>
            <p style="margin: 0; opacity: 0.9;">Your cruise adventure begins in just 3 days</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Dear ${firstName},</h2>
            
            <p>How exciting! Your cruise departure is just around the corner. We hope you're as thrilled as we are about your upcoming adventure!</p>
            
            <div class="cruise-details">
              <h3 style="margin: 0 0 15px 0; color: #0284c7;">🛳️ Your Cruise Details</h3>
              <p><strong>Cruise:</strong> ${bookingData.cruise_line} - ${bookingData.ship_name}</p>
              <p><strong>Departure:</strong> ${bookingData.departure_date}</p>
              <p><strong>Duration:</strong> ${bookingData.nights} nights</p>
              <p><strong>Region:</strong> ${bookingData.region}</p>
              <p><strong>Cabin:</strong> ${bookingData.cabin_number || 'TBA'}</p>
              <p><strong>Booking Reference:</strong> ${bookingData.reference_number}</p>
            </div>
            
            <div class="tips-section">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">🎒 Last-Minute Reminders</h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Check-in online if available (usually 24-48 hours before)</li>
                <li>Verify passport validity (6+ months remaining)</li>
                <li>Pack essentials in carry-on (medications, documents)</li>
                <li>Arrive at port 2-3 hours before departure</li>
                <li>Download the cruise line's mobile app</li>
              </ul>
            </div>
            
            <p>We're so grateful you chose Interline Asia for your cruise booking. As a valued member of the travel industry, you deserve these exclusive experiences.</p>
            
            <p><strong>Have an absolutely wonderful time!</strong> 🌟</p>
            
            <p>We can't wait to hear about your adventures when you return.</p>
            
            <p style="margin-top: 30px;">Smooth sailing,<br><strong>The Interline Asia Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Interline Asia. Wishing you incredible cruise memories!</p>
            <p>Safe travels from all of us at Interline Asia 🌊⚓</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendBrevoEmail(emailData);
}

// Send Welcome Home email (3 days after return)
async function sendWelcomeHomeEmail(bookingData) {
  const passengers = bookingData.passengers || [];
  const passenger1 = passengers.find(p => p.passenger_number === 1) || {};
  const firstName = passenger1.full_name ? passenger1.full_name.split(' ')[0] : 'Valued Guest';

  const emailData = {
    sender: {
      name: "Interline Asia",
      email: "noreply@interlineasia.com"
    },
    to: [{
      email: passenger1.email,
      name: passenger1.full_name
    }],
    subject: `🏠 Welcome Home ${firstName}! How was your cruise adventure?`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome Home!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .cruise-recap { background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .next-steps { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .emoji { font-size: 24px; }
          .btn { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🏠🌟✨</div>
            <h1 style="margin: 10px 0; font-size: 28px;">Welcome Home!</h1>
            <p style="margin: 0; opacity: 0.9;">We hope you had an amazing cruise adventure</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Dear ${firstName},</h2>
            
            <p>Welcome back! We hope you've returned with incredible memories, amazing photos, and perhaps a few souvenirs from your cruise adventure.</p>
            
            <div class="cruise-recap">
              <h3 style="margin: 0 0 15px 0; color: #d97706;">🛳️ Your Recent Adventure</h3>
              <p><strong>Cruise:</strong> ${bookingData.cruise_line} - ${bookingData.ship_name}</p>
              <p><strong>Departed:</strong> ${bookingData.departure_date}</p>
              <p><strong>Duration:</strong> ${bookingData.nights} nights in ${bookingData.region}</p>
              <p><strong>Booking Reference:</strong> ${bookingData.reference_number}</p>
            </div>
            
            <p>As a valued member of the travel industry, your experience and feedback are incredibly important to us. We'd love to hear about your cruise!</p>
            
            <div class="next-steps">
              <h4 style="margin: 0 0 15px 0; color: #0284c7;">🌟 Share Your Experience</h4>
              <p style="margin: 0 0 15px 0;">Help fellow travel professionals by sharing your thoughts:</p>
              <div style="text-align: center;">
                <a href="mailto:feedback@interlineasia.com?subject=Cruise Review - ${bookingData.reference_number}" class="btn">
                  📝 Share Your Review
                </a>
                <a href="https://www.interlineasia.com/deals" class="btn">
                  🛳️ Browse More Deals
                </a>
              </div>
            </div>
            
            <p>We're already excited to help you plan your next cruise adventure! Keep an eye out for new exclusive deals and industry rates.</p>
            
            <p><strong>Thank you for choosing Interline Asia</strong> - it's our privilege to serve the travel industry community.</p>
            
            <p style="margin-top: 30px;">Until your next adventure,<br><strong>The Interline Asia Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Interline Asia. Your trusted partner for exclusive travel industry experiences.</p>
            <p>Ready for your next cruise? We're here to help! 🌊</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendBrevoEmail(emailData);
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