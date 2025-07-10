// Interline Asia - Booking Email Notification System
// Sends confirmation emails using Brevo API when rate requests are submitted

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingData, referenceNumber } = req.body;

    if (!bookingData || !referenceNumber) {
      return res.status(400).json({ error: 'Missing booking data or reference number' });
    }

    // Send all three emails
    const results = await Promise.allSettled([
      sendMemberConfirmationEmail(bookingData, referenceNumber),
      sendAdminNotificationEmail(bookingData, referenceNumber),
      sendSupplierRequestEmail(bookingData, referenceNumber)
    ]);

    // Check results
    const memberResult = results[0];
    const adminResult = results[1];
    const supplierResult = results[2];

    const response = {
      success: true,
      results: {
        member: memberResult.status === 'fulfilled' ? 'sent' : 'failed',
        admin: adminResult.status === 'fulfilled' ? 'sent' : 'failed',
        supplier: supplierResult.status === 'fulfilled' ? 'sent' : 'failed'
      }
    };

    // Log any failures
    if (memberResult.status === 'rejected') {
      console.error('Member email failed:', memberResult.reason);
    }
    if (adminResult.status === 'rejected') {
      console.error('Admin email failed:', adminResult.reason);
    }
    if (supplierResult.status === 'rejected') {
      console.error('Supplier email failed:', supplierResult.reason);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Email service error:', error);
    return res.status(500).json({ error: 'Failed to send emails' });
  }
}

// 📧 1. Member Confirmation Email
async function sendMemberConfirmationEmail(bookingData, referenceNumber) {
  const passenger1 = bookingData.passengers[0];
  const cruise = bookingData.cruiseData;
  const firstName = passenger1.fullName.split(' ')[0];

  const emailData = {
    sender: {
      name: "Interline Asia",
      email: "noreply@interlineasia.com"
    },
    to: [{
      email: passenger1.email,
      name: passenger1.fullName
    }],
    subject: `✅ We've Received Your Cruise Rate Request – Reference ${referenceNumber}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cruise Rate Request Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0C1E36 0%, #FF7F41 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .cruise-details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: 600; color: #64748b; }
          .detail-value { font-weight: 500; color: #1e293b; }
          .reference-box { background: #fff7ed; border: 2px solid #FF7F41; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .reference-number { font-size: 24px; font-weight: bold; color: #FF7F41; letter-spacing: 1px; }
          .important-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          @media (max-width: 600px) {
            .detail-row { flex-direction: column; }
            .detail-label, .detail-value { margin: 2px 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🛳️ Request Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your cruise rate request is being processed</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${firstName},</h2>
            
            <p>Thanks for submitting your request for an exclusive travel industry rate on the following cruise:</p>
            
            <div class="cruise-details">
              <div class="detail-row">
                <span class="detail-label">🛳️ Cruise:</span>
                <span class="detail-value">${cruise.cruiseLine} - ${cruise.shipName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Departure Date:</span>
                <span class="detail-value">${cruise.departureDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🚪 Cabin Type:</span>
                <span class="detail-value">${bookingData.selectedCabin.charAt(0).toUpperCase() + bookingData.selectedCabin.slice(1)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🌍 Region:</span>
                <span class="detail-value">${cruise.region}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${cruise.nights} nights</span>
              </div>
            </div>
            
            <div class="reference-box">
              <p style="margin: 0 0 10px 0; color: #64748b;">📄 Your Reference ID:</p>
              <div class="reference-number">${referenceNumber}</div>
            </div>
            
            <p>We've received all your details and have passed your request to the cruise line for review. You'll receive a confirmation email as soon as they confirm availability and pricing.</p>
            
            <div class="important-notice">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">Important:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>This is not yet a confirmed booking.</li>
                <li>No payment has been processed at this stage.</li>
              </ul>
            </div>
            
            <p>You'll be the first to know once your rate is approved.</p>
            
            <p>Thanks again for using Interline Asia — we're proud to support the travel industry with exclusive deals and personal service.</p>
            
            <p style="margin-top: 30px;">Warm regards,<br><strong>The Interline Asia Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Interline Asia. Exclusive rates for verified travel professionals.</p>
            <p>Need help? Contact us at <a href="mailto:support@interlineasia.com" style="color: #FF7F41;">support@interlineasia.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendBrevoEmail(emailData);
}

// 📧 2. Admin Notification Email
async function sendAdminNotificationEmail(bookingData, referenceNumber) {
  const cruise = bookingData.cruiseData;
  const passenger1 = bookingData.passengers[0];
  const passenger2 = bookingData.passengers[1];

  const emailData = {
    sender: {
      name: "Interline Asia System",
      email: "system@interlineasia.com"
    },
    to: [{
      email: "admin@interlineasia.com",
      name: "Admin Team"
    }],
    subject: `📥 New Cruise Rate Request Received – ${referenceNumber}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Rate Request - Admin Notification</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 25px; text-align: center; }
          .content { padding: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-card { background: #f8fafc; border-radius: 8px; padding: 15px; border-left: 4px solid #FF7F41; }
          .passenger-card { background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid #0ea5e9; }
          .reference-highlight { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; border-radius: 6px; text-decoration: none; font-weight: 600; }
          .btn-primary { background: #0ea5e9; color: white; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 26px;">🚨 New Rate Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Admin notification - Action may be required</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e293b;">Admin team,</h2>
            
            <p>A new travel industry rate request has just been submitted:</p>
            
            <div class="reference-highlight">
              <h3 style="margin: 0; color: #92400e;">📄 Request ID: ${referenceNumber}</h3>
            </div>
            
            <div class="info-grid">
              <div class="info-card">
                <h4 style="margin: 0 0 10px 0; color: #FF7F41;">🛳️ Cruise Details</h4>
                <p><strong>Cruise:</strong> ${cruise.cruiseLine} - ${cruise.shipName}</p>
                <p><strong>Departure:</strong> ${cruise.departureDate}</p>
                <p><strong>Duration:</strong> ${cruise.nights} nights</p>
                <p><strong>Region:</strong> ${cruise.region}</p>
              </div>
              
              <div class="info-card">
                <h4 style="margin: 0 0 10px 0; color: #FF7F41;">🚪 Booking Details</h4>
                <p><strong>Cabin Type:</strong> ${bookingData.selectedCabin.charAt(0).toUpperCase() + bookingData.selectedCabin.slice(1)}</p>
                <p><strong>Passengers:</strong> 2 Adults</p>
                <p><strong>Status:</strong> Pending Review</p>
              </div>
            </div>
            
            <div class="passenger-card">
              <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">👤 Passenger 1 (Primary)</h4>
              <p><strong>Name:</strong> ${passenger1.fullName}</p>
              <p><strong>Email:</strong> ${passenger1.email}</p>
              <p><strong>Phone:</strong> ${passenger1.mobile}</p>
              <p><strong>Nationality:</strong> ${passenger1.nationality}</p>
            </div>
            
            <div class="passenger-card">
              <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">👤 Passenger 2</h4>
              <p><strong>Name:</strong> ${passenger2.fullName}</p>
              <p><strong>Email:</strong> ${passenger2.email}</p>
              <p><strong>Phone:</strong> ${passenger2.mobile}</p>
              <p><strong>Nationality:</strong> ${passenger2.nationality}</p>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #166534;">🧾 Uploaded Documents</h4>
              <p style="margin: 0;">✅ Passports: Uploaded for both passengers</p>
              <p style="margin: 0;">✅ Proof of Employment: Uploaded for both passengers</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><em>Files are securely stored in Supabase and ready for supplier review.</em></p>
            </div>
            
            <div class="action-buttons">
              <a href="https://www.interlineasia.com/admin.html" class="btn btn-primary">View in Admin Dashboard</a>
            </div>
            
            <p>Please monitor for supplier response. A full copy of the request is now saved in Supabase.</p>
            
            <p style="margin-top: 30px; color: #64748b; font-style: italic;">– Interline Asia System Bot 🤖</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the Interline Asia booking system.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendBrevoEmail(emailData);
}

// 📧 3. Supplier Request Email
async function sendSupplierRequestEmail(bookingData, referenceNumber) {
  const cruise = bookingData.cruiseData;
  const passenger1 = bookingData.passengers[0];
  const passenger2 = bookingData.passengers[1];

  // Get supplier email based on cruise line (you'd maintain this mapping)
  const supplierEmail = getSupplierEmail(cruise.cruiseLine);

  const emailData = {
    sender: {
      name: "Interline Asia Operations",
      email: "operations@interlineasia.com"
    },
    to: [{
      email: supplierEmail,
      name: `${cruise.cruiseLine} Industry Rates Team`
    }],
    subject: `🚨 Industry Rate Request for Review – ${cruise.cruiseLine} ${cruise.shipName} (${referenceNumber})`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Industry Rate Request</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0C1E36 0%, #FF7F41 100%); color: white; padding: 25px; text-align: center; }
          .content { padding: 30px; }
          .cruise-summary { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF7F41; }
          .passenger-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .passenger-card { background: #f0f9ff; border-radius: 8px; padding: 15px; border-left: 4px solid #0ea5e9; }
          .reference-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 15px 30px; margin: 0 10px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
          .btn-confirm { background: #22c55e; color: white; }
          .btn-decline { background: #ef4444; color: white; }
          .documents-section { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          @media (max-width: 600px) { .passenger-grid { grid-template-columns: 1fr; } .btn { display: block; margin: 10px 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 26px;">🚨 Industry Rate Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Verified travel professional requesting industry rates</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e293b;">Dear Supplier,</h2>
            
            <p>A verified travel industry member has requested an industry rate on the following cruise:</p>
            
            <div class="cruise-summary">
              <h3 style="margin: 0 0 15px 0; color: #FF7F41;">🛳️ Cruise Details</h3>
              <p><strong>Cruise:</strong> ${cruise.cruiseLine} - ${cruise.shipName}</p>
              <p><strong>Departure Date:</strong> ${cruise.departureDate}</p>
              <p><strong>Duration:</strong> ${cruise.nights} nights</p>
              <p><strong>Region:</strong> ${cruise.region}</p>
              <p><strong>Cabin Type:</strong> ${bookingData.selectedCabin.charAt(0).toUpperCase() + bookingData.selectedCabin.slice(1)}</p>
              <p><strong>Route:</strong> ${cruise.from} to ${cruise.to}</p>
            </div>
            
            <div class="reference-box">
              <h3 style="margin: 0; color: #92400e;">📄 Request ID: ${referenceNumber}</h3>
            </div>
            
            <div class="passenger-grid">
              <div class="passenger-card">
                <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">👤 Passenger 1 (Primary)</h4>
                <p><strong>Name:</strong> ${passenger1.fullName}</p>
                <p><strong>Email:</strong> ${passenger1.email}</p>
                <p><strong>Phone:</strong> ${passenger1.mobile}</p>
                <p><strong>Nationality:</strong> ${passenger1.nationality}</p>
                <p><strong>DOB:</strong> ${passenger1.dateOfBirth}</p>
              </div>
              
              <div class="passenger-card">
                <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">👤 Passenger 2</h4>
                <p><strong>Name:</strong> ${passenger2.fullName}</p>
                <p><strong>Email:</strong> ${passenger2.email}</p>
                <p><strong>Phone:</strong> ${passenger2.mobile}</p>
                <p><strong>Nationality:</strong> ${passenger2.nationality}</p>
                <p><strong>DOB:</strong> ${passenger2.dateOfBirth}</p>
              </div>
            </div>
            
            <div class="documents-section">
              <h4 style="margin: 0 0 10px 0; color: #166534;">📄 Documents for Review</h4>
              <p style="margin: 0;">✅ Passport copies for both passengers</p>
              <p style="margin: 0;">✅ Travel industry proof documents</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><em>All documents have been verified and are available for your review in our secure system.</em></p>
            </div>
            
            <p>Please confirm or decline this request using the buttons below:</p>
            
            <div class="action-buttons">
              <a href="https://www.interlineasia.com/supplier/confirm?ref=${referenceNumber}&action=confirm" class="btn btn-confirm">
                ✅ Able to Confirm Booking
              </a>
              <a href="https://www.interlineasia.com/supplier/confirm?ref=${referenceNumber}&action=decline" class="btn btn-decline">
                ❌ Unable to Confirm Booking
              </a>
            </div>
            
            <p>Your response will trigger an automated update to the client and our team.</p>
            
            <p>Thank you for supporting verified travel professionals through Interline Asia.</p>
            
            <p style="margin-top: 30px;">Warm regards,<br><strong>The Interline Asia Operations Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Interline Asia. Connecting verified travel professionals with exclusive industry rates.</p>
            <p>Questions? Contact us at <a href="mailto:operations@interlineasia.com" style="color: #FF7F41;">operations@interlineasia.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendBrevoEmail(emailData);
}

// Get supplier email based on cruise line
function getSupplierEmail(cruiseLine) {
  const supplierEmails = {
    'Royal Caribbean': 'industry@royalcaribbean.com',
    'Norwegian': 'industry@ncl.com',
    'Celebrity': 'industry@celebrity.com',
    'Princess': 'industry@princess.com',
    'Holland America': 'industry@hollandamerica.com',
    'MSC': 'industry@msccruises.com',
    'Carnival': 'industry@carnival.com',
    'Cunard': 'industry@cunard.com',
    'Oceania': 'industry@oceaniacruises.com',
    'Regent': 'industry@rssc.com',
    'Seabourn': 'industry@seabourn.com',
    'Silversea': 'industry@silversea.com',
    'Crystal': 'industry@crystalcruises.com',
    'Azamara': 'industry@azamara.com'
  };
  
  return supplierEmails[cruiseLine] || 'industry@interlineasia.com'; // Fallback to internal
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