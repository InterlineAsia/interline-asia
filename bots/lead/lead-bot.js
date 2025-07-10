// Interline Asia - LeadBot with AI Integration
// Qualifies new email leads as verified travel industry staff using Gemini AI

import BaseBot from '../core/base-bot.js';

export class LeadBot extends BaseBot {
  constructor() {
    super('LeadBot', {
      description: 'AI-powered lead qualification for travel industry professionals',
      capabilities: [
        'ai_lead_qualification',
        'intelligent_email_generation',
        'industry_verification',
        'personalized_welcome_sequences',
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

    // 2. Perform AI-powered industry qualification
    let aiQualification = null;
    let industryScore = 0;
    
    try {
      // Use AI for intelligent lead qualification
      aiQualification = await this.analyzeWithAI('lead_qualification', {
        email,
        fullName,
        company,
        source
      });
      
      industryScore = aiQualification.qualification_score || 50;
      
      await this.logToLangSmith('ai_lead_qualification', {
        email,
        aiQualification,
        industryScore
      });
    } catch (error) {
      console.warn('AI qualification failed, using fallback scoring:', error.message);
      // Fallback to rule-based scoring
      industryScore = await this.calculateIndustryScore({
        email,
        company,
        fullName
      });
    }

    await this.logToLangSmith('industry_score_calculated', {
      email,
      industryScore,
      aiQualification,
      qualificationFactors: this.getQualificationFactors(email, company)
    });

    // 3. Send AI-personalized welcome email based on score
    let emailResult;
    if (industryScore >= 70) {
      emailResult = await this.sendIntelligentHighQualityWelcome(requestData, aiQualification);
    } else if (industryScore >= 40) {
      emailResult = await this.sendIntelligentMediumQualityWelcome(requestData, aiQualification);
    } else {
      emailResult = await this.sendIntelligentLowQualityWelcome(requestData, aiQualification);
    }

    return {
      success: true,
      status: 'new_lead_processed',
      industryScore,
      aiQualification,
      emailSent: emailResult.success
    };
  }

  async sendIntelligentHighQualityWelcome(leadData, aiQualification = null) {
    // Generate AI-powered personalized content
    let personalizedContent = null;
    try {
      personalizedContent = await this.generatePersonalizedContent(
        'welcome_high_quality',
        {
          fullName: leadData.fullName,
          email: leadData.email,
          company: leadData.company
        }
      );
    } catch (error) {
      console.warn('AI content generation failed, using template:', error.message);
    }

    const emailData = {
      sender: {
        name: "Interline Asia",
        email: "welcome@interlineasia.com"
      },
      to: [{
        email: leadData.email,
        name: leadData.fullName
      }],
      subject: "Welcome to Interline Asia - Your Industry Access Awaits",
      htmlContent: personalizedContent || this.getHighQualityWelcomeHTML(leadData)
    };

    try {
      const result = await this.sendBrevoEmail(emailData);
      
      await this.logToLangSmith('intelligent_high_quality_welcome_sent', {
        email: leadData.email,
        emailId: result.messageId,
        hasPersonalizedContent: !!personalizedContent,
        aiQualification
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

  async sendIntelligentMediumQualityWelcome(leadData, aiQualification = null) {
    // Generate AI-powered content for medium quality leads
    let personalizedContent = null;
    try {
      const prompt = `Generate a professional welcome email for a potential travel industry lead who needs verification:
      
Recipient: ${leadData.fullName}
Company: ${leadData.company || 'Not specified'}
Email: ${leadData.email}
AI Analysis: ${aiQualification ? JSON.stringify(aiQualification) : 'Standard qualification'}

Create an email that encourages verification while being professional and helpful.`;

      personalizedContent = await this.generateIntelligentResponse(prompt, {
        leadType: 'medium_quality',
        email: leadData.email
      });
    } catch (error) {
      console.warn('AI content generation failed for medium quality lead:', error.message);
    }

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
      htmlContent: personalizedContent || this.getMediumQualityWelcomeHTML(leadData)
    };

    const result = await this.sendBrevoEmail(emailData);
    
    await this.logToLangSmith('intelligent_medium_quality_welcome_sent', {
      email: leadData.email,
      hasPersonalizedContent: !!personalizedContent,
      aiQualification
    });
    
    return { success: true, result };
  }

  async sendIntelligentLowQualityWelcome(leadData, aiQualification = null) {
    // Generate AI-powered educational content
    let personalizedContent = null;
    try {
      const prompt = `Generate a polite but clear email explaining that Interline Asia is for travel industry professionals only:
      
Recipient: ${leadData.fullName}
Email: ${leadData.email}
AI Analysis suggests this may not be a travel industry professional.

Create a professional email that explains our industry-only policy while being respectful.`;

      personalizedContent = await this.generateIntelligentResponse(prompt, {
        leadType: 'low_quality',
        email: leadData.email
      });
    } catch (error) {
      console.warn('AI content generation failed for low quality lead:', error.message);
    }

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
      htmlContent: personalizedContent || this.getLowQualityWelcomeHTML(leadData)
    };

    const result = await this.sendBrevoEmail(emailData);
    
    await this.logToLangSmith('intelligent_low_quality_welcome_sent', {
      email: leadData.email,
      hasPersonalizedContent: !!personalizedContent,
      aiQualification
    });
    
    return { success: true, result };
  }

  // Fallback methods and other existing functionality...
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

    return Math.min(score, 100);
  }

  getQualificationFactors(email, company) {
    return {
      emailDomain: email.split('@')[1]?.toLowerCase(),
      hasCompany: !!company,
      companyName: company
    };
  }

  getHighQualityWelcomeHTML(leadData) {
    return `<h2>Welcome to Interline Asia, ${leadData.fullName}!</h2>
    <p>We're excited to have a travel industry professional like you join our exclusive community.</p>`;
  }

  getMediumQualityWelcomeHTML(leadData) {
    return `<h2>Welcome to Interline Asia, ${leadData.fullName}</h2>
    <p>Thank you for your interest in our travel industry rates.</p>`;
  }

  getLowQualityWelcomeHTML(leadData) {
    return `<h2>Thank you for your interest, ${leadData.fullName}</h2>
    <p>Interline Asia provides exclusive cruise rates for verified travel industry professionals only.</p>`;
  }

  async checkExistingUser(email) {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id, email, is_verified, verification_status')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  }
}

export default LeadBot;