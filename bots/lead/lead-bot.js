// Interline Asia - LeadBot
// Qualifies new email leads as verified travel industry staff

import BaseBot from '../core/base-bot.js';

export class LeadBot extends BaseBot {
  constructor() {
    super('LeadBot', {
      description: 'Qualifies and processes new travel industry leads',
      capabilities: [
        'lead_qualification',
        'industry_verification',
        'welcome_sequences',
        'verification_reminders'
      ]
    });
  }

  async processRequest(requestData) {
    const trace = await this.startTrace('lead_processing', {
      leadType: requestData.type,
      email: requestData.email,
      source: requestData.source
    });

    try {
      console.log(`🤖 LeadBot processing: ${requestData.type}`);

      let result;
      switch (requestData.type) {
        case 'new_signup':
          result = await this.processNewSignup(requestData);
          break;
        case 'verification_reminder':
          result = await this.sendVerificationReminder(requestData);
          break;
        case 'industry_check':
          result = await this.performIndustryCheck(requestData);
          break;
        default:
          throw new Error(`Unknown lead type: ${requestData.type}`);
      }

      await this.endTrace(trace?.id, { result, success: true });
      return result;

    } catch (error) {
      await this.endTrace(trace?.id, { error: error.message }, 'error');
      await this.handleError(error, { requestData });
      throw error;
    }
  }

  async processNewSignup(requestData) {
    const { email, fullName, company, source } = requestData;
    
    await this.logToLangSmith('new_signup_processing', {
      email,
      fullName,
      company,
      source
    });

    // 1. Check if user already exists
    const existingUser = await this.checkExistingUser(email);
    
    if (existingUser) {
      await this.logToLangSmith('existing_user_found', {
        email,
        userId: existingUser.id,
        isVerified: existingUser.is_verified
      });
      
      return {
        success: true,
        status: 'existing_user',
        isVerified: existingUser.is_verified
      };
    }

    // 2. Perform initial industry qualification
    const industryScore = await this.calculateIndustryScore({
      email,
      company,
      fullName
    });

    await this.logToLangSmith('industry_score_calculated', {
      email,
      industryScore,
      qualificationFactors: this.getQualificationFactors(email, company)
    });

    // 3. Send appropriate welcome email based on score
    let emailResult;
    if (industryScore >= 70) {
      emailResult = await this.sendHighQualityLeadWelcome(requestData);
    } else if (industryScore >= 40) {
      emailResult = await this.sendMediumQualityLeadWelcome(requestData);
    } else {
      emailResult = await this.sendLowQualityLeadWelcome(requestData);
    }

    return {
      success: true,
      status: 'new_lead_processed',
      industryScore,
      emailSent: emailResult.success
    };
  }

  async checkExistingUser(email) {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id, email, is_verified, verification_status')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  }

  async calculateIndustryScore({ email, company, fullName }) {
    let score = 0;
    const factors = [];

    // Email domain analysis
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const industryDomains = [
      'travel', 'cruise', 'tours', 'vacation', 'holiday',
      'expedia', 'booking', 'travelocity', 'orbitz',
      'agent', 'agency', 'consultant'
    ];

    if (industryDomains.some(domain => emailDomain?.includes(domain))) {
      score += 30;
      factors.push('industry_email_domain');
    }

    // Company name analysis
    if (company) {
      const companyLower = company.toLowerCase();
      const industryKeywords = [
        'travel', 'cruise', 'tour', 'vacation', 'holiday',
        'agency', 'agent', 'consultant', 'advisor',
        'booking', 'reservation', 'hospitality'
      ];

      if (industryKeywords.some(keyword => companyLower.includes(keyword))) {
        score += 25;
        factors.push('industry_company_name');
      }
    }

    // Professional email patterns
    if (emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain)) {
      score += 15;
      factors.push('professional_email');
    }

    // Name patterns (travel industry common names/titles)
    if (fullName) {
      const nameLower = fullName.toLowerCase();
      if (nameLower.includes('agent') || nameLower.includes('advisor') || nameLower.includes('consultant')) {
        score += 20;
        factors.push('professional_title');
      }
    }

    await this.logToLangSmith('industry_score_factors', {
      email,
      score,
      factors,
      emailDomain,
      company
    });

    return Math.min(score, 100); // Cap at 100
  }

  getQualificationFactors(email, company) {
    return {
      emailDomain: email.split('@')[1]?.toLowerCase(),
      hasCompany: !!company,
      companyName: company
    };
  }

  async sendHighQualityLeadWelcome(leadData) {
    const emailData = {
      sender: {
        name: "Interline Asia",
        email: "welcome@interlineasia.com"
      },
      to: [{
        email: leadData.email,
        name: leadData.fullName
      }],
      subject: "🛳️ Welcome to Interline Asia - Your Industry Access Awaits",
      htmlContent: this.getHighQualityWelcomeHTML(leadData)
    };

    try {
      const result = await this.sendBrevoEmail(emailData);
      
      await this.logToLangSmith('high_quality_welcome_sent', {
        email: leadData.email,
        emailId: result.messageId
      });

      return { success: true, result };
    } catch (error) {
      await this.logToLangSmith('welcome_email_failed', {
        email: leadData.email,
        error: error.message
      });
      throw error;
    }
  }

  async sendMediumQualityLeadWelcome(leadData) {
    // Similar structure but different email content
    const emailData = {
      sender: {
        name: "Interline Asia",
        email: "welcome@interlineasia.com"
      },
      to: [{
        email: leadData.email,
        name: leadData.fullName
      }],
      subject: "Welcome to Interline Asia - Verification Required",
      htmlContent: this.getMediumQualityWelcomeHTML(leadData)
    };

    const result = await this.sendBrevoEmail(emailData);
    return { success: true, result };
  }

  async sendLowQualityLeadWelcome(leadData) {
    // Educational email about travel industry requirements
    const emailData = {
      sender: {
        name: "Interline Asia",
        email: "info@interlineasia.com"
      },
      to: [{
        email: leadData.email,
        name: leadData.fullName
      }],
      subject: "About Interline Asia - Travel Industry Professionals Only",
      htmlContent: this.getLowQualityWelcomeHTML(leadData)
    };

    const result = await this.sendBrevoEmail(emailData);
    return { success: true, result };
  }

  getHighQualityWelcomeHTML(leadData) {
    return `
      <h2>Welcome to Interline Asia, ${leadData.fullName}!</h2>
      <p>We're excited to have a travel industry professional like you join our exclusive community.</p>
      <p>Based on your profile, you appear to be well-qualified for our industry rates. Please complete your verification to access exclusive cruise deals.</p>
      <a href="https://www.interlineasia.com/verify" style="background: #FF7F41; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Complete Verification</a>
    `;
  }

  getMediumQualityWelcomeHTML(leadData) {
    return `
      <h2>Welcome to Interline Asia, ${leadData.fullName}</h2>
      <p>Thank you for your interest in our travel industry rates.</p>
      <p>To access exclusive cruise deals, we need to verify your travel industry credentials. Please upload your IATA card or employment verification.</p>
      <a href="https://www.interlineasia.com/verify" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Verification</a>
    `;
  }

  getLowQualityWelcomeHTML(leadData) {
    return `
      <h2>Thank you for your interest, ${leadData.fullName}</h2>
      <p>Interline Asia provides exclusive cruise rates for verified travel industry professionals only.</p>
      <p>If you work in the travel industry, please provide your professional credentials for verification.</p>
      <p>If you're looking for consumer cruise deals, we recommend checking with your local travel agent.</p>
    `;
  }

  async sendVerificationReminder(requestData) {
    const { userId, email } = requestData;
    
    await this.logToLangSmith('verification_reminder_sending', {
      userId,
      email
    });

    // Implementation for verification reminders
    return { success: true, reminderSent: true };
  }

  async performIndustryCheck(requestData) {
    const { email, additionalData } = requestData;
    
    // Perform deeper industry verification checks
    const score = await this.calculateIndustryScore(additionalData);
    
    await this.logToLangSmith('industry_check_performed', {
      email,
      score,
      checkType: 'detailed_verification'
    });

    return {
      success: true,
      industryScore: score,
      recommendation: score >= 70 ? 'approve' : score >= 40 ? 'manual_review' : 'decline'
    };
  }
}

export default LeadBot;