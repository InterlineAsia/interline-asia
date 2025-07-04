// Interline Asia - Email Utility Functions
// Reusable email sending with Brevo API

require('dotenv').config({ path: '.env.interlineasia.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL = 'admin@interlineasia.com';
const FROM_EMAIL = 'admin@interlineasia.com';

/**
 * Send email using Brevo API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 * @param {string} textContent - Plain text fallback (optional)
 */
async function sendEmail(to, subject, htmlContent, textContent = '') {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: FROM_EMAIL
        },
        to: [{
          email: to,
          name: to.split('@')[0]
        }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent || stripHtml(htmlContent)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    return result;

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate styled email template
 */
function createEmailTemplate(title, content, ctaButton = null) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #ffffff;
      padding: 2rem;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
    }
    .content {
      padding: 2rem;
    }
    .content h2 {
      color: #1e40af;
      font-size: 1.4rem;
      margin-bottom: 1rem;
    }
    .content p {
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .cta-button {
      display: inline-block;
      background-color: #ffb347;
      color: #000;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 1rem 0;
      text-align: center;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 1.5rem;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .footer a {
      color: #1e40af;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .header, .content, .footer {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛳️ Interline Asia</h1>
      <p>Exclusive Cruise Deals for Travel Industry Professionals</p>
    </div>
    <div class="content">
      ${content}
      ${ctaButton ? `<div style="text-align: center; margin: 2rem 0;">
        <a href="${ctaButton.url}" class="cta-button">${ctaButton.text}</a>
      </div>` : ''}
    </div>
    <div class="footer">
      <p>© 2025 Interline Asia. All rights reserved.</p>
      <p><a href="https://interlineasia.com">Visit our website</a> | <a href="mailto:admin@interlineasia.com">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send signup confirmation email
 */
async function sendSignupConfirmation(userEmail, userName) {
  const subject = 'Welcome to Interline Asia! 🛳️';
  const content = `
    <h2>Welcome aboard, ${userName}! 🎉</h2>
    <p>Thank you for joining Interline Asia, your exclusive gateway to luxury cruise deals and VIP travel experiences.</p>
    <p><strong>What's next?</strong></p>
    <ul>
      <li>✅ Your account has been created successfully</li>
      <li>📧 Check your email for verification (if required)</li>
      <li>🚢 Browse our exclusive cruise deals</li>
      <li>📄 Upload your industry credentials for verified access</li>
    </ul>
    <p>As a travel industry professional, you now have access to:</p>
    <ul>
      <li>🌟 Exclusive interline rates</li>
      <li>🎯 VIP cruise deals</li>
      <li>📞 Priority customer support</li>
      <li>🔔 Early access to new offers</li>
    </ul>
    <p>Ready to explore amazing cruise deals? Sign in to your dashboard and start discovering your next adventure!</p>
  `;
  
  const ctaButton = {
    url: 'https://interlineasia.com/login.html',
    text: 'Sign In to Your Dashboard'
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  return await sendEmail(userEmail, subject, htmlContent);
}

/**
 * Send password reset email
 */
async function sendPasswordReset(userEmail, resetLink, resetCode) {
  const subject = 'Reset Your Interline Asia Password 🔐';
  const content = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password for your Interline Asia account.</p>
    <p><strong>Reset your password using one of these methods:</strong></p>
    
    <div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>Method 1: Click the Reset Link</h3>
      <p>Click the button below to reset your password securely:</p>
    </div>
    
    <div style="background-color: #fff3cd; padding: 1.5rem; border-radius: 6px; margin: 1rem 0; border-left: 4px solid #ffc107;">
      <h3>Method 2: Manual Reset Code</h3>
      <p>If the button doesn't work, copy this reset code:</p>
      <p style="font-family: monospace; font-size: 1.2rem; font-weight: bold; background-color: #f8f9fa; padding: 0.5rem; border-radius: 4px; text-align: center;">${resetCode}</p>
      <p>Go to <a href="https://interlineasia.com/reset-password.html">interlineasia.com/reset-password.html</a> and enter this code.</p>
    </div>
    
    <p><strong>⚠️ Security Notice:</strong></p>
    <ul>
      <li>This link expires in 1 hour for security</li>
      <li>If you didn't request this reset, please ignore this email</li>
      <li>Contact support if you need assistance</li>
    </ul>
  `;
  
  const ctaButton = {
    url: resetLink,
    text: 'Reset My Password'
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  return await sendEmail(userEmail, subject, htmlContent);
}

/**
 * Send admin notification for new user signup
 */
async function sendAdminNewUserAlert(userEmail, userName, userDetails) {
  const subject = `🆕 New User Registration: ${userName}`;
  const content = `
    <h2>New User Registration Alert</h2>
    <p>A new user has registered for Interline Asia:</p>
    
    <div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
        <li><strong>User ID:</strong> ${userDetails.id || 'N/A'}</li>
      </ul>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>✅ User account created successfully</li>
      <li>📧 Welcome email sent to user</li>
      <li>⏳ Waiting for document verification</li>
      <li>👀 Monitor for document uploads</li>
    </ul>
    
    <p>The user will need to upload industry credentials for full verification.</p>
  `;
  
  const ctaButton = {
    url: 'https://interlineasia.com/admin.html',
    text: 'View Admin Dashboard'
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  return await sendEmail(ADMIN_EMAIL, subject, htmlContent);
}

/**
 * Send admin notification for document upload
 */
async function sendAdminDocumentAlert(userEmail, userName, uploadDetails) {
  const subject = `📄 Document Upload: ${userName}`;
  const content = `
    <h2>Document Upload Notification</h2>
    <p>A user has uploaded verification documents:</p>
    
    <div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Upload Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    </div>
    
    <div style="background-color: #e7f3ff; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>Uploaded Files:</h3>
      <ul>
        ${uploadDetails.files.map(file => `<li><strong>${file.type}:</strong> ${file.name} (${file.size})</li>`).join('')}
      </ul>
    </div>
    
    <p><strong>Action Required:</strong></p>
    <ul>
      <li>🔍 Review uploaded documents</li>
      <li>✅ Approve or reject verification</li>
      <li>📧 Notify user of status update</li>
    </ul>
  `;
  
  const ctaButton = {
    url: 'https://interlineasia.com/admin.html',
    text: 'Review Documents'
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  return await sendEmail(ADMIN_EMAIL, subject, htmlContent);
}

module.exports = {
  sendEmail,
  sendSignupConfirmation,
  sendPasswordReset,
  sendAdminNewUserAlert,
  sendAdminDocumentAlert,
  createEmailTemplate
};