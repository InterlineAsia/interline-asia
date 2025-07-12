// Interline Asia - Newsletter Bot (Trained & Access-Controlled)
// PUBLIC bot for newsletter and email campaign information

import BaseBot from '../core/base-bot.js';

export class NewsletterBot extends BaseBot {
  constructor() {
    super('NewsletterBot', {
      accessLevel: 'public',
      expertise: [
        'newsletter_signup',
        'email_campaigns',
        'subscription_management',
        'campaign_content',
        'email_preferences',
        'unsubscribe_process',
        'brevo_integration',
        'email_confirmations'
      ]
    });
  }

  async processRequest(requestData, userContext = {}) {
    try {
      const message = requestData.message || '';
      
      // Check if this is an admin question that should be blocked
      const accessCheck = this.canAnswerQuestion(message, userContext);
      if (!accessCheck.canAnswer) {
        return {
          success: true,
          response: accessCheck.response
        };
      }

      const messageLower = message.toLowerCase();

      // Route to specific newsletter functions
      if (messageLower.includes('signup') || messageLower.includes('subscribe') || messageLower.includes('newsletter')) {
        return await this.handleNewsletterSignup(message);
      }
      
      if (messageLower.includes('unsubscribe') || messageLower.includes('stop') || messageLower.includes('remove')) {
        return await this.handleUnsubscribe(message);
      }
      
      if (messageLower.includes('campaign') || messageLower.includes('email') || messageLower.includes('content')) {
        return await this.handleCampaignInfo(message);
      }
      
      if (messageLower.includes('preference') || messageLower.includes('frequency') || messageLower.includes('settings')) {
        return await this.handleEmailPreferences(message);
      }

      // General newsletter assistance
      return await this.generateNewsletterResponse(message);

    } catch (error) {
      await this.handleError(error, { requestData, userContext });
      return {
        success: true,
        response: "I'm here to help with newsletter and email information! Please let me know what you'd like to know about our email campaigns."
      };
    }
  }

  async handleNewsletterSignup(message) {
    try {
      const response = `📧 **Newsletter Signup Information**

**What You'll Receive**:
🚢 **Exclusive Cruise Deals** - First access to new promotions
🌍 **Destination Spotlights** - Featured ports and itineraries  
💰 **Flash Sales** - Limited-time offers and last-minute deals
📅 **Seasonal Campaigns** - Holiday and themed cruise packages
🎯 **Personalized Recommendations** - Based on your preferences

**Email Types**:
• **Weekly Newsletter** - Latest deals and travel inspiration
• **Deal Alerts** - Immediate notifications for special offers
• **Booking Confirmations** - Automated cruise booking updates
• **Pre-Cruise Tips** - Preparation guides and countdown emails
• **Welcome Series** - Onboarding for new subscribers

**How to Subscribe**:
1. **Website Signup** - Use the newsletter form on our homepage
2. **Account Creation** - Automatically subscribed when you register
3. **Booking Process** - Opt-in during cruise booking
4. **Preference Center** - Manage subscriptions in your account

**Subscription Benefits**:
✅ Early access to exclusive deals
✅ Member-only pricing alerts
✅ Personalized cruise recommendations
✅ Travel tips and destination guides
✅ Priority notification for flash sales

**Email Frequency**:
• Newsletter: Weekly (Wednesdays)
• Deal alerts: As available (2-3 per week max)
• Booking updates: As needed
• Seasonal campaigns: Monthly

**Privacy & Data**:
• Your email is never shared with third parties
• Unsubscribe anytime with one click
• Preference management available
• GDPR compliant data handling

Ready to stay updated on the best cruise deals? Sign up through our website or your account dashboard!

Would you like help with the signup process or information about specific email types?`;

      await this.logToSupabase('newsletter_signup_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Newsletter signup error:', error);
      return {
        success: true,
        response: "Our newsletter keeps you updated on exclusive cruise deals and travel inspiration! You can sign up through our website or your account dashboard to receive weekly updates and deal alerts."
      };
    }
  }

  async handleUnsubscribe(message) {
    try {
      const response = `🚫 **Unsubscribe Information**

**How to Unsubscribe**:

**Option 1: Email Links**
• Click "Unsubscribe" at the bottom of any email
• You'll be taken to a confirmation page
• Choose to unsubscribe from all or specific email types
• Confirmation will be sent to verify the change

**Option 2: Account Dashboard**
• Log into your Interline Asia account
• Go to "Email Preferences" or "Account Settings"
• Toggle off specific email types
• Save your preferences

**Option 3: Contact Support**
• Email our support team with your request
• Include the email address to be unsubscribed
• We'll process the request within 24 hours

**Selective Unsubscribe Options**:
Instead of unsubscribing completely, you can:
• Turn off promotional emails but keep booking confirmations
• Reduce frequency from weekly to monthly
• Only receive deal alerts for specific cruise lines
• Pause emails temporarily (vacation mode)

**What Happens After Unsubscribing**:
✅ Immediate removal from marketing lists
✅ No more promotional emails within 48 hours
✅ Booking confirmations will still be sent (important!)
✅ Account notifications remain active
✅ You can re-subscribe anytime

**Important Notes**:
• Booking confirmations and account security emails cannot be disabled
• Unsubscribe is processed within 24-48 hours
• You can always re-subscribe if you change your mind
• Preference changes are saved to your account

**Having Second Thoughts?**
Consider adjusting your email preferences instead of unsubscribing completely:
• Reduce frequency
• Choose specific content types
• Pause temporarily

**Re-subscribing**:
If you unsubscribe and want to receive emails again:
• Use the same signup process
• Update preferences in your account
• Contact support for assistance

Need help with the unsubscribe process or want to adjust your email preferences instead?`;

      await this.logToSupabase('newsletter_unsubscribe_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Unsubscribe error:', error);
      return {
        success: true,
        response: "To unsubscribe, click the unsubscribe link in any email or adjust your preferences in your account dashboard. You can also contact support for assistance."
      };
    }
  }

  async handleCampaignInfo(message) {
    try {
      const response = `📬 **Email Campaign Information**

**Current Active Campaigns**:

🚢 **Weekly Newsletter**
• **Content**: Latest cruise deals, destination features, travel tips
• **Schedule**: Every Wednesday at 10 AM
• **Audience**: All subscribers
• **Goal**: Keep members informed of new opportunities

💰 **Flash Deal Alerts**
• **Content**: Time-sensitive cruise promotions
• **Schedule**: As deals become available (2-3 per week max)
• **Audience**: Verified members only
• **Goal**: First access to exclusive pricing

🌟 **Seasonal Campaigns**
• **Content**: Holiday-themed cruises, special events
• **Schedule**: Monthly or seasonal
• **Audience**: Segmented by preferences
• **Goal**: Promote themed cruise experiences

📋 **Booking Journey Series**
• **Content**: Confirmation, preparation, countdown, follow-up
• **Schedule**: Triggered by booking actions
• **Audience**: Active bookers only
• **Goal**: Support customers through cruise experience

**Campaign Features**:
✅ **Personalization** - Content based on your preferences
✅ **Mobile Optimized** - Looks great on all devices
✅ **Exclusive Deals** - Member-only pricing and offers
✅ **Rich Content** - High-quality images and detailed information
✅ **Clear CTAs** - Easy booking and information access

**Email Design**:
• Clean, professional layout
• Cruise line branding and imagery
• Easy-to-scan deal summaries
• Mobile-responsive design
• Accessible for all users

**Content Strategy**:
• **Educational** - Travel tips and destination guides
• **Promotional** - Exclusive deals and limited offers
• **Inspirational** - Beautiful cruise imagery and stories
• **Practical** - Booking guides and preparation tips

**Engagement Features**:
• Social media integration
• Share with friends options
• Feedback and survey links
• Customer story submissions

**Quality Assurance**:
• All emails tested across devices
• Spam filter optimization
• Deliverability monitoring
• A/B testing for improvements

**Upcoming Campaigns**:
• Summer cruise season promotions
• Early booking incentives for next year
• Destination spotlight series
• Customer testimonial features

Interested in specific campaign content or have suggestions for future newsletters?`;

      await this.logToSupabase('newsletter_campaign_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Campaign info error:', error);
      return {
        success: true,
        response: "Our email campaigns include weekly newsletters with cruise deals, flash deal alerts for time-sensitive offers, and seasonal promotions. All emails are mobile-optimized and personalized for our members."
      };
    }
  }

  async handleEmailPreferences(message) {
    try {
      const response = `⚙️ **Email Preferences Management**

**Available Preference Options**:

**Email Types**:
☐ **Weekly Newsletter** - Cruise deals and travel inspiration
☐ **Deal Alerts** - Flash sales and exclusive offers  
☐ **Booking Updates** - Confirmation and preparation emails
☐ **Seasonal Campaigns** - Holiday and themed promotions
☐ **Travel Tips** - Destination guides and cruise advice

**Frequency Options**:
• **Real-time** - Immediate deal alerts
• **Daily Digest** - Once per day summary
• **Weekly** - Standard newsletter schedule
• **Monthly** - Reduced frequency option
• **Pause** - Temporary suspension (up to 6 months)

**Content Preferences**:
🚢 **Cruise Lines**:
• Royal Caribbean
• Norwegian Cruise Line
• Celebrity Cruises
• Princess Cruises
• Holland America
• All cruise lines

🌍 **Destinations**:
• Caribbean & Bahamas
• Mediterranean
• Alaska
• Asia & Pacific
• All destinations

💰 **Price Ranges**:
• Budget-friendly (Under $1,000)
• Mid-range ($1,000-$3,000)
• Luxury ($3,000+)
• All price ranges

**How to Update Preferences**:

**Method 1: Account Dashboard**
1. Log into your Interline Asia account
2. Navigate to "Email Preferences"
3. Toggle options on/off
4. Select frequency and content types
5. Save changes

**Method 2: Email Footer**
1. Click "Update Preferences" in any email
2. Modify your settings
3. Confirm changes
4. Receive confirmation email

**Method 3: Contact Support**
• Email our team with preference changes
• We'll update your account within 24 hours
• Confirmation sent once complete

**Smart Recommendations**:
Based on your activity, we suggest:
• Keep booking confirmations enabled (important!)
• Set deal alerts to weekly if daily feels overwhelming
• Choose 2-3 preferred destinations for targeted content
• Enable seasonal campaigns for special offers

**Preference Benefits**:
✅ **Reduced Email Volume** - Only what you want
✅ **Relevant Content** - Matches your interests
✅ **Better Experience** - Less clutter, more value
✅ **Easy Changes** - Update anytime
✅ **Instant Updates** - Changes take effect immediately

**Temporary Options**:
• **Vacation Mode** - Pause emails while traveling
• **Reduced Frequency** - Temporarily lower email volume
• **Seasonal Pause** - Stop emails during busy periods

Need help setting up your email preferences or have questions about specific options?`;

      await this.logToSupabase('newsletter_preferences_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Email preferences error:', error);
      return {
        success: true,
        response: "You can manage your email preferences in your account dashboard or by clicking 'Update Preferences' in any email. Choose frequency, content types, and specific cruise lines or destinations that interest you."
      };
    }
  }

  async generateNewsletterResponse(message) {
    try {
      if (this.geminiClient) {
        const newsletterPrompt = `You are the Newsletter Bot for Interline Asia cruise platform.

Your expertise covers:
- Newsletter signup and subscription process
- Email campaign information and content
- Unsubscribe and preference management
- Brevo email platform integration
- Email frequency and content options

You help customers with email-related questions and newsletter management.

IMPORTANT: You must NOT provide any internal metrics like:
- Subscriber counts or numbers
- Email open/click rates
- Campaign performance statistics
- Revenue or conversion data

If asked about metrics, respond: "Sorry, that information is only available to administrators."

Customer question: "${message}"

Provide helpful information about newsletter services and email management.`;

        const response = await this.generateIntelligentResponse(newsletterPrompt, {
          isPublic: true,
          botType: 'newsletter'
        });

        return {
          success: true,
          response: response
        };
      }

      // Fallback response without AI
      return {
        success: true,
        response: `Newsletter Support! 📧

I can help you with:
• Newsletter signup and subscription
• Email preferences and frequency
• Campaign information and content
• Unsubscribe process
• Email management

What would you like to know about our email communications?`
      };

    } catch (error) {
      console.error('Newsletter response generation error:', error);
      return {
        success: true,
        response: "I'm here to help with newsletter and email questions! Let me know what you'd like to know about our email communications."
      };
    }
  }
}

export default NewsletterBot;