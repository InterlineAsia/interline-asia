// Interline Asia - Post-Booking Bot (Trained & Access-Controlled)
// MEMBER-level bot for post-booking support and follow-ups

import BaseBot from '../core/base-bot.js';

export class PostBookingBot extends BaseBot {
  constructor() {
    super('PostBookingBot', {
      accessLevel: 'member',
      expertise: [
        'booking_confirmations',
        'cruise_preparation',
        'travel_documents',
        'pre_cruise_tips',
        'countdown_updates',
        'welcome_home_followup',
        'booking_modifications',
        'cruise_experience'
      ]
    });
  }

  async processRequest(requestData, userContext = {}) {
    try {
      // Validate member access
      this.validateAccess('member', userContext);
      
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

      // Route to specific post-booking functions
      if (messageLower.includes('confirmation') || messageLower.includes('booking number')) {
        return await this.handleBookingConfirmation(message, userContext);
      }
      
      if (messageLower.includes('document') || messageLower.includes('passport') || messageLower.includes('visa')) {
        return await this.handleTravelDocuments(message);
      }
      
      if (messageLower.includes('pack') || messageLower.includes('prepare') || messageLower.includes('tip')) {
        return await this.handleCruisePreparation(message);
      }
      
      if (messageLower.includes('countdown') || messageLower.includes('days until') || messageLower.includes('departure')) {
        return await this.handleCountdownInfo(message, userContext);
      }
      
      if (messageLower.includes('modify') || messageLower.includes('change') || messageLower.includes('cancel')) {
        return await this.handleBookingModifications(message);
      }

      // General post-booking assistance
      return await this.generatePostBookingResponse(message, userContext);

    } catch (error) {
      await this.handleError(error, { requestData, userContext });
      return {
        success: true,
        response: "I'm here to help with your cruise booking! Please let me know what specific information you need about your upcoming cruise."
      };
    }
  }

  async handleBookingConfirmation(message, userContext) {
    try {
      // Try to get user's booking information
      let bookingInfo = null;
      
      if (userContext.userId && this.supabaseClient) {
        const { data: bookings } = await this.supabaseClient
          .from('bookings')
          .select('*')
          .eq('user_id', userContext.userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        bookingInfo = bookings?.[0];
      }

      let response = `📋 **Booking Confirmation Information**

`;

      if (bookingInfo) {
        response += `**Your Recent Booking**:
• Booking Reference: ${bookingInfo.reference_number || 'Pending'}
• Status: ${bookingInfo.status || 'Processing'}
• Cruise Line: ${bookingInfo.cruise_line || 'TBD'}
• Departure: ${bookingInfo.departure_date ? new Date(bookingInfo.departure_date).toLocaleDateString() : 'TBD'}

`;
      }

      response += `**What's Included in Your Confirmation**:
✅ Booking reference number
✅ Cruise itinerary details
✅ Cabin assignment and deck plan
✅ Departure terminal information
✅ Check-in time requirements
✅ Dining time preferences
✅ Special requests confirmation

**Next Steps**:
1. **Travel Documents** - Ensure passport is valid 6+ months
2. **Online Check-in** - Available 90 days before departure
3. **Shore Excursions** - Book popular tours early
4. **Specialty Dining** - Reserve restaurants in advance
5. **Spa Appointments** - Book treatments before sailing

**Important Reminders**:
• Arrive at terminal 2-3 hours before departure
• Bring printed boarding documents
• Check baggage restrictions and policies
• Review cruise line's dress code requirements

**Need Help?**
• Check your email for detailed confirmation
• Log into your dashboard for booking details
• Contact cruise line directly for specific requests

Is there something specific about your booking confirmation you'd like me to explain?`;

      await this.logToSupabase('post_booking_confirmation_query', { 
        hasBookingInfo: !!bookingInfo,
        userId: userContext.userId
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Booking confirmation error:', error);
      return {
        success: true,
        response: "I can help you understand your booking confirmation! Check your email for the detailed confirmation document, or log into your dashboard to view booking details."
      };
    }
  }

  async handleTravelDocuments(message) {
    try {
      const response = `📄 **Travel Documents Checklist**

**Essential Documents**:
🛂 **Passport**
• Must be valid 6+ months beyond return date
• Ensure sufficient blank pages for stamps
• Check expiration date immediately

🛂 **Visa Requirements**
• Research each port of call
• Some destinations require visas for cruise passengers
• Apply early - processing can take weeks

🛂 **Cruise Documents**
• Printed boarding pass and luggage tags
• Travel insurance confirmation
• Emergency contact information
• Medical prescriptions and documentation

**By Destination**:

**Caribbean**: Passport required (passport card not sufficient for air travel)

**Mediterranean**: Passport required, some ports may need Schengen visa

**Alaska**: Passport required for international waters

**Asia/Pacific**: Passport + destination-specific visas often required

**Document Tips**:
• Make photocopies and store separately
• Take photos of important documents on your phone
• Leave copies with emergency contact at home
• Check cruise line's specific requirements

**Travel Insurance**:
• Highly recommended for international cruises
• Covers medical emergencies, trip cancellation
• Some cruise lines offer their own policies
• Compare coverage options before purchasing

**Special Considerations**:
• Minors traveling - additional documentation may be required
• Name on documents must match booking exactly
• Recent name changes - bring supporting documentation

Need specific information about visa requirements for your cruise destinations?`;

      await this.logToSupabase('post_booking_documents_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Travel documents error:', error);
      return {
        success: true,
        response: "For travel documents, ensure your passport is valid 6+ months beyond your return date. Check visa requirements for each port of call, and don't forget to print your boarding documents!"
      };
    }
  }

  async handleCruisePreparation(message) {
    try {
      const response = `🧳 **Cruise Preparation Guide**

**Packing Essentials**:

**Clothing**:
• Formal wear (2-3 formal nights typical)
• Smart casual for specialty dining
• Comfortable walking shoes for ports
• Swimwear and cover-ups
• Light jacket for air conditioning
• Weather-appropriate clothing for destinations

**Electronics**:
• Phone charger and international adapters
• Camera with extra batteries/memory cards
• Portable power bank
• Waterproof phone case for excursions

**Health & Wellness**:
• Prescription medications (bring extra)
• Seasickness remedies
• Sunscreen (reef-safe for Caribbean)
• Basic first aid supplies
• Hand sanitizer

**Important Items**:
• Travel documents in waterproof folder
• Credit cards (notify bank of travel)
• Cash for tips and port shopping
• Reusable water bottle
• Day bag for shore excursions

**Pre-Cruise Checklist**:
✅ Complete online check-in
✅ Select dining times and specialty restaurants
✅ Book shore excursions
✅ Set up internet package if needed
✅ Review daily schedules and plan activities
✅ Check weather forecast for packing
✅ Arrange transportation to/from port

**Money-Saving Tips**:
• Bring your own toiletries
• Pack formal wear instead of renting
• Research port shopping before excursions
• Consider cruise line's beverage packages

**First-Time Cruiser Tips**:
• Arrive at port early for smooth boarding
• Explore the ship on embarkation day
• Make dinner reservations early
• Download the cruise line's app
• Attend the muster drill - it's mandatory!

What specific aspect of cruise preparation would you like more details about?`;

      await this.logToSupabase('post_booking_preparation_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Cruise preparation error:', error);
      return {
        success: true,
        response: "For cruise preparation, focus on packing formal wear for elegant nights, comfortable shoes for ports, and don't forget your travel documents! Complete online check-in and book excursions early."
      };
    }
  }

  async handleCountdownInfo(message, userContext) {
    try {
      let response = `⏰ **Cruise Countdown Information**

`;

      // Try to get specific cruise date if available
      if (userContext.userId && this.supabaseClient) {
        const { data: bookings } = await this.supabaseClient
          .from('bookings')
          .select('departure_date, cruise_line')
          .eq('user_id', userContext.userId)
          .order('departure_date', { ascending: true })
          .limit(1);
        
        if (bookings?.[0]?.departure_date) {
          const departureDate = new Date(bookings[0].departure_date);
          const today = new Date();
          const daysUntil = Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil > 0) {
            response += `🚢 **Your ${bookings[0].cruise_line} Cruise**
**Departure**: ${departureDate.toLocaleDateString()}
**Days Until Departure**: ${daysUntil} days!

`;
          }
        }
      }

      response += `**Countdown Milestones**:

**90 Days Before**:
✅ Online check-in opens
✅ Shore excursion booking available
✅ Specialty dining reservations open
✅ Spa appointment booking begins

**60 Days Before**:
✅ Final payment typically due
✅ Travel insurance deadline (if purchasing)
✅ Passport expiration check
✅ Visa applications should be submitted

**30 Days Before**:
✅ Weather research for packing
✅ Prescription refills
✅ Travel notifications to banks
✅ Pet/house sitting arrangements

**14 Days Before**:
✅ Print boarding documents
✅ Pack luggage
✅ Confirm transportation to port
✅ Download cruise line app

**7 Days Before**:
✅ Check in online if not done
✅ Review port maps and excursions
✅ Prepare day-of-departure timeline
✅ Charge all electronic devices

**Day of Departure**:
🎉 Arrive at port 2-3 hours early
🎉 Have documents ready
🎉 Enjoy your cruise adventure!

**Getting Excited?**
• Follow your cruise line on social media for updates
• Join online cruise communities for tips
• Research ports of call for must-see attractions
• Plan your formal night outfits

How many days until your cruise departure?`;

      await this.logToSupabase('post_booking_countdown_query', { 
        userId: userContext.userId
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Countdown info error:', error);
      return {
        success: true,
        response: "The countdown to your cruise is exciting! Key milestones include online check-in at 90 days, final payment at 60 days, and arrival at the port 2-3 hours before departure."
      };
    }
  }

  async handleBookingModifications(message) {
    try {
      const response = `✏️ **Booking Modifications**

**What Can Be Changed**:
• Cabin category (subject to availability)
• Dining time preferences
• Shore excursions
• Specialty restaurant reservations
• Spa appointments
• Beverage packages

**What Usually Cannot Be Changed**:
• Cruise dates (may require cancellation/rebooking)
• Ship or itinerary
• Passenger names (strict policies)
• Pricing (locked at time of booking)

**How to Make Changes**:

**Through Cruise Line**:
• Call customer service directly
• Use online account portal
• Contact your travel agent if booked through one

**Through Interline Asia**:
• Contact our support team
• We can assist with cruise line communication
• Some changes may affect your exclusive pricing

**Important Policies**:
⚠️ **Cancellation Deadlines**:
• 90+ days: Usually minimal penalty
• 60-89 days: Moderate penalty
• 30-59 days: Higher penalty
• Less than 30 days: Significant penalty or no refund

⚠️ **Name Changes**:
• Must match passport exactly
• Usually require documentation
• May incur fees
• Some cruise lines don't allow name changes

**Travel Insurance**:
• Can protect against cancellation fees
• Review policy terms carefully
• Some reasons for cancellation are covered
• Purchase soon after booking for best coverage

**Need to Make Changes?**
1. Review your booking confirmation for policies
2. Contact the cruise line or our support team
3. Understand any fees or penalties
4. Get changes confirmed in writing

**Emergency Situations**:
If you have a genuine emergency preventing travel, contact both the cruise line and your travel insurance provider immediately.

What specific changes are you looking to make to your booking?`;

      await this.logToSupabase('post_booking_modifications_query', { 
        query: message.substring(0, 100)
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Booking modifications error:', error);
      return {
        success: true,
        response: "For booking modifications, contact the cruise line directly or our support team. Keep in mind that changes may have fees and some items like dates or passenger names have strict policies."
      };
    }
  }

  async generatePostBookingResponse(message, userContext) {
    try {
      if (this.geminiClient) {
        const postBookingPrompt = `You are the Post-Booking Support Bot for Interline Asia cruise bookings.

Your expertise covers:
- Booking confirmations and details
- Travel document requirements
- Cruise preparation and packing
- Pre-cruise planning and tips
- Countdown milestones
- Booking modifications and policies

You help customers who have already booked their cruise and need assistance with preparation, documentation, or understanding their booking.

IMPORTANT: You must NOT provide any internal business information like member counts, revenue data, or admin metrics.

Customer question: "${message}"

Provide helpful post-booking support focused on cruise preparation and booking assistance.`;

        const response = await this.generateIntelligentResponse(postBookingPrompt, {
          isMember: true,
          botType: 'post-booking',
          userId: userContext.userId
        });

        return {
          success: true,
          response: response
        };
      }

      // Fallback response without AI
      return {
        success: true,
        response: `Welcome to Post-Booking Support! 🚢

I'm here to help with your cruise preparation:
• Booking confirmation details
• Travel document requirements  
• Packing and preparation tips
• Countdown milestones
• Booking modifications

What aspect of your upcoming cruise can I help you with?`
      };

    } catch (error) {
      console.error('Post-booking response generation error:', error);
      return {
        success: true,
        response: "I'm here to help with your cruise preparation! Let me know what specific information you need about your upcoming cruise."
      };
    }
  }
}

export default PostBookingBot;