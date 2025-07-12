// Interline Asia - Customer Bot (Trained & Access-Controlled)
// PUBLIC bot for general customer inquiries about travel deals and booking process

import BaseBot from '../core/base-bot.js';

export class CustomerBot extends BaseBot {
  constructor() {
    super('CustomerBot', {
      accessLevel: 'public',
      expertise: [
        'cruise_deals',
        'booking_process',
        'travel_information',
        'verification_steps',
        'general_inquiries',
        'cruise_lines',
        'destinations',
        'pricing_info'
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

      // Route to specific customer service functions
      if (messageLower.includes('deal') || messageLower.includes('cruise') || messageLower.includes('price')) {
        return await this.handleCruiseDealsQuery(message);
      }
      
      if (messageLower.includes('book') || messageLower.includes('reservation')) {
        return await this.handleBookingQuery(message);
      }
      
      if (messageLower.includes('verify') || messageLower.includes('document') || messageLower.includes('upload')) {
        return await this.handleVerificationQuery(message);
      }
      
      if (messageLower.includes('company') || messageLower.includes('eligib')) {
        return await this.handleEligibilityQuery(message);
      }

      // General customer assistance
      return await this.generateCustomerResponse(message);

    } catch (error) {
      await this.handleError(error, { requestData, userContext });
      return {
        success: true,
        response: "I apologize for the technical difficulty. Please try rephrasing your question or contact our support team for immediate assistance."
      };
    }
  }

  async handleCruiseDealsQuery(message) {
    try {
      const response = `🚢 **Cruise Deals & Information**

I can help you find amazing cruise deals! Here's what's available:

**Popular Cruise Lines**:
• Royal Caribbean - Adventure and innovation
• Norwegian - Freestyle cruising
• Celebrity - Modern luxury
• Princess - Traditional elegance
• Holland America - Premium experiences

**Current Promotions**:
• Early booking discounts up to 30%
• Free specialty dining packages
• Onboard credit offers
• Reduced deposits available

**Destinations**:
• Mediterranean & Greek Isles
• Caribbean & Bahamas
• Alaska & Northern Passages
• Asia & Pacific Crossings

**How to Book**:
1. Browse our deals page
2. Select your preferred cruise
3. Complete verification (company email required)
4. Secure your booking with deposit

Would you like information about specific destinations, cruise lines, or booking requirements?`;

      await this.logToSupabase('customer_deals_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Deals query error:', error);
      return {
        success: true,
        response: "I can help you find cruise deals! Please visit our deals page or let me know what type of cruise experience you're looking for."
      };
    }
  }

  async handleBookingQuery(message) {
    try {
      const response = `📋 **Booking Process Guide**

**Step-by-Step Booking**:

1️⃣ **Browse & Select**
   • View available cruise deals
   • Compare prices and itineraries
   • Check departure dates

2️⃣ **Verify Eligibility**
   • Must have corporate email from partner company
   • Upload employment verification document
   • Wait for admin approval (usually 24-48 hours)

3️⃣ **Complete Booking**
   • Select cabin category
   • Add passenger details
   • Choose dining preferences
   • Review terms and conditions

4️⃣ **Payment & Confirmation**
   • Secure deposit to hold booking
   • Receive booking confirmation
   • Get cruise documents closer to departure

**Partner Companies Include**:
• Qantas Airways
• Hilton Hotels
• Emirates Airlines
• And many more travel industry partners

**Need Help?**
• Check verification status in your dashboard
• Contact support for booking assistance
• Review our FAQ for common questions

What specific part of the booking process can I help clarify?`;

      await this.logToSupabase('customer_booking_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Booking query error:', error);
      return {
        success: true,
        response: "I can guide you through our booking process! The main steps are: browse deals, verify eligibility, complete booking, and make payment. What specific step would you like help with?"
      };
    }
  }

  async handleVerificationQuery(message) {
    try {
      const response = `✅ **Verification Process**

**Why Verification is Required**:
Our exclusive deals are available only to employees of partner travel companies.

**What You Need**:
• Valid company email address (@qantas.com, @hilton.com, etc.)
• Employment verification document:
  - Employee ID card
  - Recent pay stub
  - HR letter confirming employment
  - Company business card

**Verification Steps**:
1. Sign up with your company email
2. Upload clear photo of verification document
3. Wait for admin review (24-48 hours)
4. Receive approval notification
5. Start booking exclusive deals!

**Document Tips**:
• Ensure document is clearly readable
• Include your name and company name
• Use good lighting for photos
• Accepted formats: JPG, PNG, PDF

**Status Check**:
• Log into your dashboard to check verification status
• You'll receive email updates on approval
• Contact support if verification takes longer than 48 hours

**Already Verified?**
Once approved, you can immediately access all exclusive cruise deals and start booking!

Is there a specific part of the verification process you need help with?`;

      await this.logToSupabase('customer_verification_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Verification query error:', error);
      return {
        success: true,
        response: "I can help with the verification process! You'll need a company email and employment verification document. The process typically takes 24-48 hours for approval."
      };
    }
  }

  async handleEligibilityQuery(message) {
    try {
      const response = `🏢 **Eligibility Requirements**

**Who Can Access Our Deals**:
Employees of partner travel industry companies with exclusive access to wholesale cruise pricing.

**Partner Company Examples**:
• **Airlines**: Qantas, Emirates, Virgin, Jetstar
• **Hotels**: Hilton, Marriott, Accor, IHG
• **Travel Agencies**: Flight Centre, STA Travel
• **Tour Operators**: Contiki, G Adventures
• **Cruise Lines**: Royal Caribbean, Celebrity, Princess
• **Travel Technology**: Amadeus, Sabre, Travelport

**Eligibility Criteria**:
✅ Current employee of partner company
✅ Valid company email address
✅ Able to provide employment verification
✅ Agree to terms and conditions

**Not Sure If Your Company Qualifies?**
• Try signing up with your company email
• Our system will indicate if your domain is recognized
• Contact support for manual review if needed
• We regularly add new partner companies

**Family & Friends**:
• Bookings are for employee and immediate family
• Employee must be primary booker
• All travelers covered under employee benefits

**Getting Started**:
1. Check if your company email domain is accepted
2. Complete the verification process
3. Start browsing exclusive deals!

Would you like to check if your specific company is a partner, or do you have questions about the verification process?`;

      await this.logToSupabase('customer_eligibility_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Eligibility query error:', error);
      return {
        success: true,
        response: "Our exclusive deals are for travel industry employees from partner companies like airlines, hotels, and travel agencies. You'll need a company email and employment verification to access the deals."
      };
    }
  }

  async generateCustomerResponse(message) {
    try {
      if (this.geminiClient) {
        const customerPrompt = `You are the Customer Service Bot for Interline Asia, a travel platform offering exclusive cruise deals to travel industry employees.

Your expertise covers:
- Cruise deals and pricing information
- Booking process and requirements
- Verification steps for eligibility
- General travel information
- Cruise lines and destinations

IMPORTANT: You must NOT provide any internal business information like:
- Number of members or users
- Revenue or booking statistics  
- Email campaign metrics
- Admin-only data

If asked about internal metrics, respond: "Sorry, that information is only available to administrators."

Customer question: "${message}"

Provide a helpful, friendly response focused on customer service. Be informative about cruise deals and booking process.`;

        const response = await this.generateIntelligentResponse(customerPrompt, {
          isCustomer: true,
          botType: 'customer'
        });

        return {
          success: true,
          response: response
        };
      }

      // Fallback response without AI
      return {
        success: true,
        response: `Welcome to Interline Asia! 🚢

I'm here to help you with:
• Cruise deals and pricing
• Booking process guidance
• Verification requirements
• Travel information
• Partner company eligibility

How can I assist you today? Feel free to ask about our exclusive cruise deals or the booking process!`
      };

    } catch (error) {
      console.error('Customer response generation error:', error);
      return {
        success: true,
        response: "I'm here to help with cruise deals and bookings! Please let me know what specific information you're looking for."
      };
    }
  }
}

export default CustomerBot;