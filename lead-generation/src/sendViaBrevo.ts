// Send emails via Brevo (formerly Sendinblue) API
import axios from 'axios';
import { config } from './config.js';
import type { StoredLead, EmailTemplate, BrevoResponse } from './types.js';

export class BrevoEmailSender {
  private readonly baseUrl = config.brevo.baseUrl;
  private readonly apiKey = config.brevo.apiKey;
  private sentCount = 0;
  private errorCount = 0;
  private lastSentTime = 0;

  // Rate limiting for email sending
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastSentTime;
    const minInterval = 3600000 / config.rateLimiting.emailsPerHour; // ms between emails

    if (timeSinceLastEmail < minInterval) {
      const waitTime = minInterval - timeSinceLastEmail;
      console.log(`⏳ Email rate limiting: waiting ${Math.round(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastSentTime = Date.now();
  }

  // Send emails to a list of leads
  async sendEmails(leads: StoredLead[]): Promise<BrevoResponse[]> {
    console.log(`📧 Sending emails to ${leads.length} leads...`);
    const results: BrevoResponse[] = [];

    if (leads.length === 0) {
      console.log('   No leads to email');
      return results;
    }

    // Get email template
    const template = this.getEmailTemplate();

    for (const lead of leads) {
      try {
        await this.rateLimit();
        
        console.log(`   Sending to: ${lead.email} (${lead.company_name || lead.domain})`);
        const result = await this.sendEmail(lead, template);
        results.push(result);

        if (result.success) {
          this.sentCount++;
          console.log(`   ✅ Sent successfully (ID: ${result.messageId})`);
        } else {
          this.errorCount++;
          console.log(`   ❌ Failed: ${result.error}`);
        }

      } catch (error) {
        this.errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Exception: ${errorMessage}`);
        
        results.push({
          messageId: '',
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log(`✅ Email sending complete: ${this.sentCount} sent, ${this.errorCount} failed`);
    return results;
  }

  // Send a single email
  async sendEmail(lead: StoredLead, template: EmailTemplate): Promise<BrevoResponse> {
    try {
      // Personalize the email content
      const personalizedTemplate = this.personalizeTemplate(template, lead);

      const emailData = {
        sender: {
          name: config.brevo.sender.name,
          email: config.brevo.sender.email,
        },
        to: [
          {
            email: lead.email,
            name: lead.contact_name || lead.company_name || '',
          },
        ],
        subject: personalizedTemplate.subject,
        textContent: personalizedTemplate.textContent,
        htmlContent: personalizedTemplate.htmlContent,
        tags: ['lead-generation', 'partnership', 'travel-industry'],
        headers: {
          'X-Mailin-custom': `lead_id:${lead.id},domain:${lead.domain}`,
        },
      };

      const response = await axios.post(`${this.baseUrl}/smtp/email`, emailData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status === 201) {
        return {
          messageId: response.data.messageId || 'unknown',
          success: true,
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const errorCode = error.response?.data?.code || error.response?.status;
        
        return {
          messageId: '',
          success: false,
          error: `${errorCode}: ${errorMessage}`,
        };
      }
      
      return {
        messageId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get the email template for partnership outreach
  private getEmailTemplate(): EmailTemplate {
    const subject = "Travel Partnership Opportunity - Interline Asia";
    
    const textContent = `Hi there,

I hope this email finds you well.

My name is [SENDER_NAME] from Interline Asia, and I'm reaching out because I believe there could be a great partnership opportunity between our companies.

Interline Asia specializes in cruise and travel packages, with a particular focus on providing exceptional value and service to Australian travelers. We've been growing rapidly and are always looking to partner with quality travel agencies and consultants who share our commitment to customer satisfaction.

Here's what we can offer your business:

• Competitive commission rates on all bookings
• Exclusive deals and packages not available elsewhere  
• Dedicated support team for all your inquiries
• Marketing materials and resources to help you sell
• Fast and reliable booking confirmations
• Comprehensive travel insurance options

We work with major cruise lines including Royal Caribbean, Celebrity, Princess, Holland America, and many others, covering destinations worldwide from the Caribbean to Alaska, Mediterranean to Asia.

I'd love to discuss how we can work together to provide your clients with amazing travel experiences while growing your business.

Would you be available for a brief 15-minute call this week to explore potential partnership opportunities? I'm happy to work around your schedule.

You can reach me directly at this email or call me at +61 XXX XXX XXX.

Looking forward to hearing from you!

Best regards,

[SENDER_NAME]
Partnership Development
Interline Asia
partnerships@interlineasia.com
www.interlineasia.com

P.S. If you're not the right person to speak with about partnerships, I'd appreciate it if you could point me in the right direction.

---
If you'd prefer not to receive emails like this, please reply with "UNSUBSCRIBE" and I'll remove you from our list immediately.`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Partnership Opportunity</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #0C1E36; margin-bottom: 10px;">Travel Partnership Opportunity</h2>
        <p style="color: #6b7280; margin: 0;">Interline Asia - Premium Cruise & Travel Packages</p>
    </div>

    <p>Hi there,</p>

    <p>I hope this email finds you well.</p>

    <p>My name is <strong>[SENDER_NAME]</strong> from <strong>Interline Asia</strong>, and I'm reaching out because I believe there could be a great partnership opportunity between our companies.</p>

    <p>Interline Asia specializes in cruise and travel packages, with a particular focus on providing exceptional value and service to Australian travelers. We've been growing rapidly and are always looking to partner with quality travel agencies and consultants who share our commitment to customer satisfaction.</p>

    <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0C1E36; margin-top: 0;">Here's what we can offer your business:</h3>
        <ul style="margin: 0; padding-left: 20px;">
            <li>Competitive commission rates on all bookings</li>
            <li>Exclusive deals and packages not available elsewhere</li>
            <li>Dedicated support team for all your inquiries</li>
            <li>Marketing materials and resources to help you sell</li>
            <li>Fast and reliable booking confirmations</li>
            <li>Comprehensive travel insurance options</li>
        </ul>
    </div>

    <p>We work with major cruise lines including <strong>Royal Caribbean, Celebrity, Princess, Holland America</strong>, and many others, covering destinations worldwide from the Caribbean to Alaska, Mediterranean to Asia.</p>

    <p>I'd love to discuss how we can work together to provide your clients with amazing travel experiences while growing your business.</p>

    <p><strong>Would you be available for a brief 15-minute call this week to explore potential partnership opportunities?</strong> I'm happy to work around your schedule.</p>

    <p>You can reach me directly at this email or call me at <strong>+61 XXX XXX XXX</strong>.</p>

    <p>Looking forward to hearing from you!</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 5px;"><strong>[SENDER_NAME]</strong></p>
        <p style="margin-bottom: 5px; color: #6b7280;">Partnership Development</p>
        <p style="margin-bottom: 5px; color: #0C1E36; font-weight: bold;">Interline Asia</p>
        <p style="margin-bottom: 5px;">
            <a href="mailto:partnerships@interlineasia.com" style="color: #3b82f6;">partnerships@interlineasia.com</a>
        </p>
        <p style="margin-bottom: 15px;">
            <a href="https://www.interlineasia.com" style="color: #3b82f6;">www.interlineasia.com</a>
        </p>
    </div>

    <p style="font-style: italic; color: #6b7280;"><strong>P.S.</strong> If you're not the right person to speak with about partnerships, I'd appreciate it if you could point me in the right direction.</p>

    <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 6px; font-size: 12px; color: #6b7280; text-align: center;">
        If you'd prefer not to receive emails like this, please reply with "UNSUBSCRIBE" and I'll remove you from our list immediately.
    </div>
</body>
</html>`;

    return {
      subject,
      textContent,
      htmlContent,
    };
  }

  // Personalize email template with lead information
  private personalizeTemplate(template: EmailTemplate, lead: StoredLead): EmailTemplate {
    const senderName = "Sarah Mitchell"; // You can make this configurable
    
    // Replace placeholders in subject
    let personalizedSubject = template.subject;
    if (lead.company_name) {
      personalizedSubject = `Partnership Opportunity for ${lead.company_name} - Interline Asia`;
    }

    // Replace placeholders in text content
    let personalizedText = template.textContent
      .replace(/\[SENDER_NAME\]/g, senderName)
      .replace(/\[COMPANY_NAME\]/g, lead.company_name || 'your company')
      .replace(/\[CONTACT_NAME\]/g, lead.contact_name || '');

    // Add personalized greeting if we have a contact name
    if (lead.contact_name) {
      personalizedText = personalizedText.replace('Hi there,', `Hi ${lead.contact_name},`);
    }

    // Replace placeholders in HTML content
    let personalizedHtml = template.htmlContent || ''
      .replace(/\[SENDER_NAME\]/g, senderName)
      .replace(/\[COMPANY_NAME\]/g, lead.company_name || 'your company')
      .replace(/\[CONTACT_NAME\]/g, lead.contact_name || '');

    // Add personalized greeting in HTML if we have a contact name
    if (lead.contact_name && personalizedHtml) {
      personalizedHtml = personalizedHtml.replace('<p>Hi there,</p>', `<p>Hi ${lead.contact_name},</p>`);
    }

    return {
      subject: personalizedSubject,
      textContent: personalizedText,
      htmlContent: personalizedHtml,
    };
  }

  // Test email configuration
  async testEmailConfig(): Promise<boolean> {
    try {
      console.log('🧪 Testing Brevo email configuration...');
      
      const testEmail = {
        sender: {
          name: config.brevo.sender.name,
          email: config.brevo.sender.email,
        },
        to: [
          {
            email: config.brevo.sender.email, // Send test to ourselves
            name: 'Test Recipient',
          },
        ],
        subject: 'Interline Asia - Email Configuration Test',
        textContent: 'This is a test email to verify the Brevo configuration is working correctly.',
        tags: ['test', 'configuration'],
      };

      const response = await axios.post(`${this.baseUrl}/smtp/email`, testEmail, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        timeout: 30000,
      });

      if (response.status === 201) {
        console.log('✅ Email configuration test successful');
        return true;
      } else {
        console.error('❌ Email configuration test failed:', response.status);
        return false;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Email configuration test failed:', error.response?.data || error.message);
      } else {
        console.error('❌ Email configuration test failed:', error);
      }
      return false;
    }
  }

  // Get sending statistics
  getSendingStats(): { sent: number; errors: number } {
    return {
      sent: this.sentCount,
      errors: this.errorCount,
    };
  }

  // Get account information from Brevo
  async getAccountInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: {
          'Accept': 'application/json',
          'api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error getting account info:', error);
      return null;
    }
  }
}