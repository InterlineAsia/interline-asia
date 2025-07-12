// Interline Asia - Support Bot
// Handles customer support issues with Gemini AI + static fallbacks

import BaseBot from '../core/base-bot.js';

export class SupportBot extends BaseBot {
  constructor() {
    super('SupportBot', {
      accessLevel: 'public',
      expertise: [
        'login_issues',
        'verification_process', 
        'document_upload',
        'booking_problems',
        'technical_issues',
        'account_management'
      ]
    });
    
    // Static fallback responses
    this.fallbackResponses = {
      login_issues: `🔐 **Login Help**

Having trouble logging in? Try these steps:

1. **Check your credentials**: Make sure your email and password are correct
2. **Reset your password**: Click "Forgot Password?" on the login page
3. **Clear browser data**: Clear cookies and cache, then try again
4. **Try different browser**: Sometimes browser issues can cause problems
5. **Check your email**: Look for any password reset emails (check spam folder)

**Still having trouble?** Click "Still need help" below and we'll assist you personally.`,

      verification_process: `📧 **Verification Help**

Waiting for verification? Here's what you need to know:

**Timeline**: Verification typically takes 24-48 hours during business days

**If you haven't received your verification email**:
1. **Check spam folder**: Verification emails sometimes go to spam
2. **Wait a few minutes**: Email delivery can be delayed
3. **Use work email**: Make sure you signed up with your company email
4. **Request new email**: Try requesting verification again from your dashboard

**What happens next**: Once verified, you'll get email confirmation and can access exclusive deals.`,

      document_upload: `📄 **Document Upload Guide**

Need help uploading verification documents? Here's how:

**Accepted Documents**:
✅ Employee ID card
✅ Recent pay stub  
✅ HR employment letter
✅ Company business card

**File Requirements**:
✅ Format: JPG, PNG, or PDF
✅ Size: Maximum 5MB
✅ Quality: Clear and readable
✅ Content: Must show your name and company

**Upload Steps**:
1. Go to your account dashboard
2. Click "Upload Documents"
3. Select your file
4. Wait for upload confirmation
5. You'll get email updates on approval status

**File too big?** Try compressing the image or taking a clearer photo.`,

      booking_problems: `🚢 **Booking Support**

Having booking issues? I can help with basic guidance:

**Common Solutions**:
• **Payment failed**: Check card details and try again
• **Session timeout**: Complete booking within 15 minutes
• **Price changed**: Cruise prices update frequently
• **Technical errors**: Try refreshing and starting over

**For specific booking changes, cancellations, or complex issues**, please use "Still need help" below - our team can access your booking details and provide personalized assistance.`,

      technical_issues: `🔧 **Technical Support**

Website not working properly? Try these fixes:

**Quick Solutions**:
1. **Refresh the page**: Press F5 or Ctrl+R
2. **Clear browser cache**: Clear cookies and cached data
3. **Try different browser**: Chrome, Firefox, Safari, or Edge
4. **Check internet**: Ensure stable internet connection
5. **Disable extensions**: Turn off ad blockers temporarily
6. **Update browser**: Make sure you're using latest version

**Mobile Issues**: Try the desktop site or update your mobile browser

**Still broken?** Click "Still need help" and describe exactly what's happening.`,

      account_management: `👤 **Account Help**

Need help managing your account? Here's what you can do:

**Common Account Tasks**:
• **Update profile**: Go to Account Settings
• **Change password**: Use "Change Password" in settings
• **Update email**: Contact support for email changes
• **View bookings**: Check "My Bookings" section
• **Download documents**: Access booking confirmations in your dashboard

**Account Issues**:
• **Locked account**: Use password reset or contact support
• **Missing bookings**: Check email confirmation or contact support
• **Profile errors**: Update information in Account Settings

**For account-specific issues**, click "Still need help" for personalized assistance.`,

      general: `👋 **How can I help you?**

I'm here to assist with common support issues:

🔐 **Login problems**
📧 **Verification questions** 
📄 **Document upload help**
🚢 **Basic booking guidance**
🔧 **Technical issues**
👤 **Account management**

**What's your question?** Just describe your issue and I'll provide specific help.

**Need human support?** Click "Still need help" anytime to reach our team directly.`
    };
  }

  async processRequest(requestData, userContext = {}) {
    try {
      const message = requestData.message || '';
      
      // Check if this is a restricted admin question
      const accessCheck = this.canAnswerQuestion(message, userContext);
      if (!accessCheck.canAnswer) {
        return {
          success: true,
          response: "Sorry, I can't help with that — but I can guide you through general support issues if you'd like.",
          responseType: 'restricted',
          showFeedback: true,
          showEscalation: true
        };
      }

      // Try Gemini AI first, then fallback to static responses
      const response = await this.generateSupportResponse(message, userContext);
      
      await this.logToSupabase('support_request', {
        message: message.substring(0, 200),
        responseType: response.responseType,
        userId: userContext.userId || 'anonymous'
      });

      return response;

    } catch (error) {
      await this.handleError(error, { requestData, userContext });
      
      return {
        success: true,
        response: this.fallbackResponses.general,
        responseType: 'error_fallback',
        showFeedback: true,
        showEscalation: true
      };
    }
  }

  async generateSupportResponse(message, userContext = {}) {
    // First try Gemini AI
    try {
      if (this.geminiClient) {
        const aiResponse = await this.generateGeminiResponse(message);
        if (aiResponse) {
          return {
            success: true,
            response: aiResponse,
            responseType: 'gemini_ai',
            showFeedback: true,
            showEscalation: true
          };
        }
      }
    } catch (error) {
      console.warn('Gemini AI failed, using fallback:', error.message);
    }

    // Fallback to static responses
    const category = this.categorizeQuestion(message);
    const staticResponse = this.fallbackResponses[category] || this.fallbackResponses.general;
    
    return {
      success: true,
      response: staticResponse,
      responseType: 'static_fallback',
      category: category,
      showFeedback: true,
      showEscalation: true
    };
  }

  async generateGeminiResponse(message) {
    if (!this.geminiClient) {
      throw new Error('Gemini client not available');
    }

    const supportPrompt = `You are a helpful customer support bot for Interline Asia, a travel platform offering exclusive cruise deals to travel industry employees.

IMPORTANT RESTRICTIONS:
- Only answer questions about: login issues, verification process, document upload, booking problems, technical issues, account management
- DO NOT provide any internal business data, statistics, or admin information
- If asked about restricted topics, respond: "Sorry, I can't help with that — but I can guide you through general support issues if you'd like."

RESPONSE STYLE:
- Be friendly, clear, and helpful
- Provide step-by-step instructions when appropriate
- Keep responses concise but complete
- Use bullet points or numbered lists for clarity
- Always offer escalation option for complex issues

KNOWLEDGE BASE:
- Verification takes 24-48 hours
- Accepted documents: Employee ID, pay stub, HR letter, business card
- File formats: JPG, PNG, PDF (max 5MB)
- Users need company email addresses
- Booking sessions timeout after 15 minutes
- Password reset emails may go to spam

Customer question: "${message}"

Provide a helpful support response:`;

    try {
      const response = await this.geminiClient.generateContent(supportPrompt, {
        maxTokens: 300,
        temperature: 0.3 // Lower temperature for more consistent support responses
      });

      // Validate response isn't revealing restricted information
      if (this.containsRestrictedContent(response)) {
        throw new Error('Response contains restricted content');
      }

      return response;
    } catch (error) {
      console.error('Gemini response generation failed:', error);
      throw error;
    }
  }

  categorizeQuestion(message) {
    const messageLower = message.toLowerCase();
    
    // Login issues
    if (messageLower.includes('login') || messageLower.includes('password') || 
        messageLower.includes('sign in') || messageLower.includes('log in') ||
        messageLower.includes('forgot password') || messageLower.includes('reset password')) {
      return 'login_issues';
    }
    
    // Verification process
    if (messageLower.includes('verification') || messageLower.includes('verify') ||
        messageLower.includes('verification email') || messageLower.includes('approved') ||
        messageLower.includes('pending') || messageLower.includes('how long')) {
      return 'verification_process';
    }
    
    // Document upload
    if (messageLower.includes('upload') || messageLower.includes('document') ||
        messageLower.includes('file') || messageLower.includes('photo') ||
        messageLower.includes('id card') || messageLower.includes('pay stub') ||
        messageLower.includes('too big') || messageLower.includes('file size')) {
      return 'document_upload';
    }
    
    // Booking problems
    if (messageLower.includes('booking') || messageLower.includes('book') ||
        messageLower.includes('payment') || messageLower.includes('cruise') ||
        messageLower.includes('reservation') || messageLower.includes('cancel') ||
        messageLower.includes('change booking')) {
      return 'booking_problems';
    }
    
    // Technical issues
    if (messageLower.includes('website') || messageLower.includes('page') ||
        messageLower.includes('error') || messageLower.includes('broken') ||
        messageLower.includes('not working') || messageLower.includes('loading') ||
        messageLower.includes('browser') || messageLower.includes('mobile')) {
      return 'technical_issues';
    }
    
    // Account management
    if (messageLower.includes('account') || messageLower.includes('profile') ||
        messageLower.includes('settings') || messageLower.includes('email') ||
        messageLower.includes('personal info') || messageLower.includes('dashboard')) {
      return 'account_management';
    }
    
    return 'general';
  }

  containsRestrictedContent(response) {
    const restrictedTerms = [
      'total members', 'member count', 'number of users',
      'revenue', 'bookings today', 'statistics',
      'admin data', 'internal metrics', 'database'
    ];
    
    const responseLower = response.toLowerCase();
    return restrictedTerms.some(term => responseLower.includes(term));
  }

  // Override the base canAnswerQuestion to be more specific for support
  canAnswerQuestion(question, userContext = {}) {
    const questionLower = question.toLowerCase();
    
    // Support-specific restricted keywords
    const restrictedKeywords = [
      'how many members', 'total users', 'member count',
      'booking revenue', 'total bookings', 'statistics',
      'admin panel', 'database', 'internal data',
      'company breakdown', 'user analytics'
    ];
    
    const isRestrictedQuestion = restrictedKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    if (isRestrictedQuestion) {
      return {
        canAnswer: false,
        reason: 'restricted_support',
        response: "Sorry, I can't help with that — but I can guide you through general support issues if you'd like."
      };
    }
    
    return { canAnswer: true };
  }

  async logSupportInteraction(interactionType, data) {
    await this.logToSupabase('support_interaction', {
      interactionType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

export default SupportBot;