// Interline Asia - FollowUpBot
// Sends Bon Voyage and Welcome Home emails with LangSmith tracing

import BaseBot from '../core/base-bot.js';

export class FollowUpBot extends BaseBot {
  constructor() {
    super('FollowUpBot', {
      description: 'Sends automated follow-up emails for cruise bookings',
      capabilities: [
        'bon_voyage_emails',
        'welcome_home_emails',
        'date_calculation',
        'email_scheduling'
      ]
    });
  }

  async processRequest(requestData) {
    const trace = await this.startTrace('followup_email_processing', {
      emailType: requestData.emailType,
      bookingId: requestData.bookingId
    });

    try {
      console.log(`🤖 FollowUpBot processing: ${requestData.emailType}`);

      let result;
      switch (requestData.emailType) {
        case 'bon_voyage':
          result = await this.sendBonVoyageEmail(requestData.bookingId);
          break;
        case 'welcome_home':
          result = await this.sendWelcomeHomeEmail(requestData.bookingId);
          break;
        case 'schedule_followups':
          result = await this.scheduleFollowUpEmails(requestData.bookingId);
          break;
        default:
          throw new Error(`Unknown email type: ${requestData.emailType}`);
      }

      await this.endTrace(trace?.id, { result, success: true });
      return result;

    } catch (error) {
      await this.endTrace(trace?.id, { error: error.message }, 'error');
      await this.handleError(error, { requestData });
      throw error;
    }
  }

  async sendBonVoyageEmail(bookingId) {
    const booking = await this.getBookingById(bookingId);
    
    await this.logToLangSmith('bon_voyage_email_sending', {
      bookingId,
      cruiseLine: booking.cruise_line,
      departureDate: booking.departure_date
    });

    try {
      const response = await fetch('/api/send-followup-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailType: 'bon-voyage',
          bookingData: booking
        })
      });

      const result = await response.json();
      
      await this.logToLangSmith('bon_voyage_email_sent', {
        bookingId,
        success: result.success,
        emailResult: result.result
      });

      return result;
    } catch (error) {
      await this.logToLangSmith('bon_voyage_email_failed', {
        bookingId,
        error: error.message
      });
      throw error;
    }
  }

  async sendWelcomeHomeEmail(bookingId) {
    const booking = await this.getBookingById(bookingId);
    
    await this.logToLangSmith('welcome_home_email_sending', {
      bookingId,
      cruiseLine: booking.cruise_line,
      returnDate: this.calculateReturnDate(booking.departure_date, booking.nights)
    });

    try {
      const response = await fetch('/api/send-followup-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailType: 'welcome-home',
          bookingData: booking
        })
      });

      const result = await response.json();
      
      await this.logToLangSmith('welcome_home_email_sent', {
        bookingId,
        success: result.success,
        emailResult: result.result
      });

      return result;
    } catch (error) {
      await this.logToLangSmith('welcome_home_email_failed', {
        bookingId,
        error: error.message
      });
      throw error;
    }
  }

  async scheduleFollowUpEmails(bookingId) {
    const booking = await this.getBookingById(bookingId);
    const departureDate = new Date(booking.departure_date);
    const returnDate = this.calculateReturnDate(booking.departure_date, booking.nights);
    
    const bonVoyageDate = new Date(departureDate);
    bonVoyageDate.setDate(bonVoyageDate.getDate() - 3);
    
    const welcomeHomeDate = new Date(returnDate);
    welcomeHomeDate.setDate(welcomeHomeDate.getDate() + 3);

    await this.logToLangSmith('followup_emails_scheduled', {
      bookingId,
      bonVoyageDate: bonVoyageDate.toISOString(),
      welcomeHomeDate: welcomeHomeDate.toISOString(),
      departureDate: booking.departure_date,
      nights: booking.nights
    });

    // In a real implementation, you would schedule these emails
    // For now, we'll just log the scheduling
    return {
      success: true,
      bookingId,
      scheduledEmails: {
        bonVoyage: bonVoyageDate.toISOString(),
        welcomeHome: welcomeHomeDate.toISOString()
      }
    };
  }

  calculateReturnDate(departureDate, nights) {
    const departure = new Date(departureDate);
    const returnDate = new Date(departure);
    returnDate.setDate(returnDate.getDate() + parseInt(nights));
    return returnDate;
  }

  async checkDueFollowUps() {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    try {
      // Check for bookings departing in 3 days (Bon Voyage emails)
      const { data: departingBookings, error: departingError } = await this.supabaseClient
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .gte('departure_date', threeDaysFromNow.toISOString().split('T')[0])
        .lt('departure_date', new Date(threeDaysFromNow.getTime() + 24*60*60*1000).toISOString().split('T')[0]);

      if (departingError) throw departingError;

      // Check for bookings that returned 3 days ago (Welcome Home emails)
      // This would require calculating return dates based on departure + nights
      
      await this.logToLangSmith('due_followups_checked', {
        departingBookingsCount: departingBookings?.length || 0,
        checkDate: today.toISOString()
      });

      return {
        bonVoyageDue: departingBookings || [],
        welcomeHomeDue: [] // Would be calculated based on return dates
      };

    } catch (error) {
      await this.handleError(error, { operation: 'checkDueFollowUps' });
      throw error;
    }
  }
}

export default FollowUpBot;