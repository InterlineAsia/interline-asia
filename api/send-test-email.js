// API endpoint to send test email using Brevo
const { sendTestEmail, sendWelcomeEmail } = require('../lib/brevo');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { toEmail, toName, emailType = 'test' } = req.body;

    // Validate required fields
    if (!toEmail || !toName) {
      return res.status(400).json({ 
        error: 'Missing required fields: toEmail and toName are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    console.log(`📧 Sending ${emailType} email to ${toEmail} (${toName})`);

    let result;
    
    // Send different types of emails based on emailType
    switch (emailType) {
      case 'welcome':
        result = await sendWelcomeEmail(toEmail, toName);
        break;
      case 'test':
      default:
        result = await sendTestEmail(toEmail, toName);
        break;
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: `${emailType} email sent successfully`,
      messageId: result.messageId,
      to: toEmail
    });

  } catch (error) {
    console.error('❌ Test email API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
}