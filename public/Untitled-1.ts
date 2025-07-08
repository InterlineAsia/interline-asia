// supabase/functions/_shared/email.ts
// Deno-compatible email utilities for Supabase Edge Functions.

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const ADMIN_EMAIL = 'admin@interlineasia.com';
const FROM_EMAIL = 'admin@interlineasia.com';

/**
 * Send email using Brevo API (Deno version)
 */
async function sendEmail(to: string, subject: string, htmlContent: string) {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY is not set in environment variables.');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Interline Asia', email: FROM_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API Error: ${response.status} - ${errorText}`);
    }

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
}

/**
 * Generate styled email template
 */
function createEmailTemplate(title: string, content: string, ctaButton?: { url: string; text: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>${title}</title></head>
      <body style="font-family: sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
          <h1 style="color: #1a1a2e;">🛳️ Interline Asia</h1>
          <div style="padding: 20px 0;">${content}</div>
          ${ctaButton ? `<div style="text-align: center; margin: 2rem 0;">
            <a href="${ctaButton.url}" style="background-color: #ffb347; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${ctaButton.text}</a>
          </div>` : ''}
          <div style="text-align: center; font-size: 0.9em; color: #777; margin-top: 20px;">
            <p>© ${new Date().getFullYear()} Interline Asia. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>`;
}

/**
 * Send admin notification for new user signup
 */
export async function sendAdminNewUserAlert(user: { email: string; full_name: string; id: string }) {
  const subject = `🆕 New User Registration: ${user.full_name}`;
  const content = `
    <h2>New User Registration Alert</h2>
    <p>A new user has registered and is awaiting verification.</p>
    <div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${user.full_name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>User ID:</strong> ${user.id}</li>
      </ul>
    </div>
    <p>The user has uploaded their initial verification document and is waiting for review in the admin panel.</p>
  `;

  const ctaButton = {
    url: 'https://www.interlineasia.com/admin.html',
    text: 'Go to Admin Dashboard',
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  await sendEmail(ADMIN_EMAIL, subject, htmlContent);
}

/**
 * Send admin notification for a new document upload
 */
export async function sendAdminDocumentAlert(payload: {
  user_id: string;
  file_name: string;
  file_size: number;
  user_email?: string; // This will be added in the webhook function
  user_full_name?: string; // This will be added in the webhook function
}) {
  const subject = `📄 New Document Uploaded: ${payload.user_full_name}`;
  const content = `
    <h2>Document Upload Notification</h2>
    <p>A user has uploaded a new document for verification.</p>
    <div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
      <h3>User & File Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${payload.user_full_name}</li>
        <li><strong>Email:</strong> ${payload.user_email}</li>
        <li><strong>File Name:</strong> ${payload.file_name}</li>
        <li><strong>File Size:</strong> ${(payload.file_size / 1024).toFixed(2)} KB</li>
      </ul>
    </div>
    <p><strong>Action Required:</strong> Please review the document in the admin panel and update the user's verification status.</p>
  `;

  const ctaButton = {
    url: `https://www.interlineasia.com/admin.html`,
    text: 'Review Document Now',
  };

  const htmlContent = createEmailTemplate(subject, content, ctaButton);
  await sendEmail(ADMIN_EMAIL, subject, htmlContent);
}