// Vercel Serverless Function for Verification Email Notifications
// File: /api/send-verification-emails.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      applicantEmail, 
      applicantName, 
      employer, 
      verificationId 
    } = req.body;

    if (!applicantEmail || !applicantName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get Brevo API key from environment variables
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const results = {
      adminEmail: { success: false, error: null },
      applicantEmail: { success: false, error: null }
    };

    // 1. Send notification to admin
    try {
      const adminEmailResult = await sendAdminNotification({
        applicantEmail,
        applicantName,
        employer,
        verificationId,
        brevoApiKey: BREVO_API_KEY
      });
      results.adminEmail = { success: true, messageId: adminEmailResult.messageId };
    } catch (error) {
      console.error('Admin email failed:', error);
      results.adminEmail = { success: false, error: error.message };
    }

    // 2. Send confirmation to applicant
    try {
      const applicantEmailResult = await sendApplicantConfirmation({
        applicantEmail,
        applicantName,
        brevoApiKey: BREVO_API_KEY
      });
      results.applicantEmail = { success: true, messageId: applicantEmailResult.messageId };
    } catch (error) {
      console.error('Applicant email failed:', error);
      results.applicantEmail = { success: false, error: error.message };
    }

    // Log results
    console.log('Verification email results:', results);

    const allSuccessful = results.adminEmail.success && results.applicantEmail.success;
    
    return res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      message: allSuccessful ? 'All emails sent successfully' : 'Some emails failed to send',
      results
    });

  } catch (error) {
    console.error('Verification email error:', error);
    return res.status(500).json({ 
      error: 'Failed to send verification emails',
      details: error.message 
    });
  }
}

// Send notification email to admin
async function sendAdminNotification({ applicantEmail, applicantName, employer, verificationId, brevoApiKey }) {
  const adminEmail = 'admin@interlineasia.com';
  
  const emailData = {
    sender: {
      name: 'Interline Asia System',
      email: 'noreply@interlineasia.com'
    },
    to: [{
      email: adminEmail,
      name: 'Admin Team'
    }],
    subject: `New Verification Application - ${applicantName}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Verification Application</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">🔔 New Verification Application</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A new travel industry professional has applied for access</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Applicant Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 30%;">Name:</td>
              <td style="padding: 8px 0;">${applicantName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${applicantEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Employer:</td>
              <td style="padding: 8px 0;">${employer}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Application ID:</td>
              <td style="padding: 8px 0; font-family: monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${verificationId}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://interlineasia.com/admin-verifications.html" 
             style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Review Application →
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⏰ Action Required:</strong> Please review this application within 72 hours. The applicant is expecting a response.
          </p>
        </div>
        
        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #6c757d; text-align: center;">
          <p>This is an automated notification from Interline Asia</p>
          <p>© 2025 Interline Asia. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Admin email failed: ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
}

// Send confirmation email to applicant
async function sendApplicantConfirmation({ applicantEmail, applicantName, brevoApiKey }) {
  const emailData = {
    sender: {
      name: 'Interline Asia',
      email: 'noreply@interlineasia.com'
    },
    to: [{
      email: applicantEmail,
      name: applicantName
    }],
    subject: 'Application Received - Interline Asia Verification',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">✅ Application Received!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for applying to Interline Asia</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for submitting your verification application to <strong>Interline Asia</strong>. We've successfully received your documents and information.</p>
          
          <div style="background: #e8f5e8; border-left: 4px solid #27ae60; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #27ae60; margin-top: 0;">What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Our team will review your application within <strong>72 business hours</strong></li>
              <li>We'll verify your industry credentials and documentation</li>
              <li>You'll receive an email confirmation once approved</li>
              <li>If approved, you'll gain immediate access to exclusive cruise deals</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Important Reminders</h3>
            <p style="margin-bottom: 10px;">📧 <strong>Check your email</strong> (including spam folder) for our response</p>
            <p style="margin-bottom: 10px;">⏰ <strong>Response time:</strong> Within 72 business hours</p>
            <p style="margin-bottom: 0;">🔒 <strong>Privacy:</strong> Your information is secure and confidential</p>
          </div>
          
          <p>If you have any questions or don't hear from us within 72 hours, please contact our support team.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@interlineasia.com" 
               style="background: #6c757d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p>Welcome to the Interline Asia community!</p>
          
          <p>Best regards,<br>
          <strong>The Interline Asia Team</strong></p>
        </div>
        
        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #6c757d; text-align: center;">
          <p>This is an automated confirmation from Interline Asia</p>
          <p>© 2025 Interline Asia. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Applicant email failed: ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
}