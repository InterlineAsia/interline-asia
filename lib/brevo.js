// Brevo (Sendinblue) Email Utility
// Secure server-side email sending using the official Brevo SDK

const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];

// Set API key from environment variable
apiKey.apiKey = process.env.BREVO_API_KEY;

if (!process.env.BREVO_API_KEY) {
  throw new Error('BREVO_API_KEY environment variable is required');
}

// Create transactional emails API instance
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send an email using Brevo
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @param {string} textContent - Plain text content (optional)
 * @param {Object} templateData - Template variables (optional)
 * @returns {Promise} - Promise resolving to email send result
 */
async function sendEmail({ toEmail, toName, subject, htmlContent, textContent = null, templateData = {} }) {
  try {
    // Validate required parameters
    if (!toEmail || !toName || !subject || !htmlContent) {
      throw new Error('Missing required parameters: toEmail, toName, subject, and htmlContent are required');
    }

    // Prepare email data
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Set sender (Interline Asia)
    sendSmtpEmail.sender = {
      name: "Interline Asia",
      email: "admin@interlineasia.com"
    };
    
    // Set recipient
    sendSmtpEmail.to = [{
      email: toEmail,
      name: toName
    }];
    
    // Set subject and content
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    
    // Add text content if provided
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }
    
    // Add template data if provided
    if (Object.keys(templateData).length > 0) {
      sendSmtpEmail.params = templateData;
    }
    
    // Add headers for tracking
    sendSmtpEmail.headers = {
      'X-Mailin-custom': 'interline-asia-system',
      'charset': 'iso-8859-1'
    };
    
    console.log(`📧 Sending email to ${toEmail} (${toName}): "${subject}"`);
    
    // Send the email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      to: toEmail,
      subject: subject
    });
    
    return {
      success: true,
      messageId: result.messageId,
      to: toEmail,
      subject: subject
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      to: toEmail,
      subject: subject,
      details: error.response?.body || error
    });
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send a welcome email to new users
 * @param {string} toEmail - User email
 * @param {string} toName - User name
 * @returns {Promise} - Promise resolving to email send result
 */
async function sendWelcomeEmail(toEmail, toName) {
  const subject = "Welcome to Interline Asia - Your Exclusive Cruise Deals Await!";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Interline Asia</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0C1E36; margin-bottom: 10px;">Welcome to Interline Asia!</h1>
        <p style="color: #FF7F41; font-size: 18px; font-weight: 500;">Your Gateway to Exclusive Cruise Deals</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #0C1E36; margin-top: 0;">Hello ${toName},</h2>
        
        <p>Thank you for joining Interline Asia! We're excited to welcome you to our exclusive community of travel industry professionals.</p>
        
        <p>As a verified member, you'll have access to:</p>
        <ul style="color: #555;">
          <li>🚢 <strong>Exclusive cruise deals</strong> with insider rates</li>
          <li>💰 <strong>Industry-only pricing</strong> not available to the public</li>
          <li>🎯 <strong>VIP access</strong> to luxury cruise experiences</li>
          <li>📧 <strong>Priority notifications</strong> for new deals and offers</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.interlineasia.com/dashboard" style="background: #FF7F41; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p>To complete your setup and start accessing exclusive deals, please verify your industry status by uploading your business card or employment letter in your dashboard.</p>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:admin@interlineasia.com" style="color: #FF7F41;">admin@interlineasia.com</a></p>
        <p style="margin-top: 20px;">
          <strong>Interline Asia</strong><br>
          Exclusive Cruise Deals for Travel Professionals<br>
          Asia Pacific Region
        </p>
      </div>
      
    </body>
    </html>
  `;
  
  const textContent = `
    Welcome to Interline Asia!
    
    Hello ${toName},
    
    Thank you for joining Interline Asia! We're excited to welcome you to our exclusive community of travel industry professionals.
    
    As a verified member, you'll have access to:
    - Exclusive cruise deals with insider rates
    - Industry-only pricing not available to the public
    - VIP access to luxury cruise experiences
    - Priority notifications for new deals and offers
    
    To complete your setup and start accessing exclusive deals, please verify your industry status by uploading your business card or employment letter in your dashboard.
    
    Access your dashboard: https://www.interlineasia.com/dashboard
    
    Need help? Contact us at admin@interlineasia.com
    
    Best regards,
    Interline Asia Team
  `;
  
  return sendEmail({
    toEmail,
    toName,
    subject,
    htmlContent,
    textContent
  });
}

/**
 * Send a booking confirmation email
 * @param {string} toEmail - User email
 * @param {string} toName - User name
 * @param {Object} bookingDetails - Booking information
 * @returns {Promise} - Promise resolving to email send result
 */
async function sendBookingConfirmation(toEmail, toName, bookingDetails) {
  const subject = `Booking Confirmation - ${bookingDetails.cruiseLine} ${bookingDetails.shipName}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0C1E36; margin-bottom: 10px;">Booking Confirmed!</h1>
        <p style="color: #FF7F41; font-size: 18px; font-weight: 500;">Your cruise adventure awaits</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #0C1E36; margin-top: 0;">Hello ${toName},</h2>
        
        <p>Your cruise booking has been confirmed! Here are your booking details:</p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #0C1E36; margin-top: 0;">Cruise Details</h3>
          <p><strong>Cruise Line:</strong> ${bookingDetails.cruiseLine}</p>
          <p><strong>Ship:</strong> ${bookingDetails.shipName}</p>
          <p><strong>Departure Date:</strong> ${bookingDetails.departureDate}</p>
          <p><strong>Duration:</strong> ${bookingDetails.duration}</p>
          <p><strong>Cabin Type:</strong> ${bookingDetails.cabinType}</p>
          <p><strong>Booking Reference:</strong> ${bookingDetails.bookingRef}</p>
        </div>
        
        <p>We'll be in touch with further details and next steps for your cruise booking.</p>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions about your booking? Contact us at <a href="mailto:admin@interlineasia.com" style="color: #FF7F41;">admin@interlineasia.com</a></p>
        <p style="margin-top: 20px;">
          <strong>Interline Asia</strong><br>
          Your Trusted Cruise Booking Partner
        </p>
      </div>
      
    </body>
    </html>
  `;
  
  return sendEmail({
    toEmail,
    toName,
    subject,
    htmlContent
  });
}

/**
 * Send a test email
 * @param {string} toEmail - Test recipient email
 * @param {string} toName - Test recipient name
 * @returns {Promise} - Promise resolving to email send result
 */
async function sendTestEmail(toEmail, toName) {
  const subject = "Brevo Integration Test - Interline Asia";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0C1E36;">🧪 Brevo Integration Test</h1>
      <p>Hello ${toName},</p>
      <p>This is a test email to verify that the Brevo email integration is working correctly for Interline Asia.</p>
      <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>✅ Email system is operational!</strong></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
      <p>Best regards,<br>Interline Asia Development Team</p>
    </body>
    </html>
  `;
  
  return sendEmail({
    toEmail,
    toName,
    subject,
    htmlContent
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendTestEmail
};