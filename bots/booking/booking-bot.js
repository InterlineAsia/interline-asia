// Interline Asia - BookingBot
// Handles cruise rate requests from verified users with full LangSmith tracing

import BaseBot from '../core/base-bot.js';

export class BookingBot extends BaseBot {
  constructor() {
    super('BookingBot', {
      description: 'Processes cruise rate requests from verified travel industry users',
      capabilities: [
        'booking_validation',
        'passenger_verification', 
        'email_automation',
        'supplier_communication'
      ]
    });
  }

  async processRequest(requestData) {
    const trace = await this.startTrace('booking_request_processing', {
      requestType: requestData.type || 'cruise_rate_request',
      userId: requestData.userId,
      bookingReference: requestData.bookingReference
    });

    try {
      console.log(`🤖 BookingBot processing request: ${requestData.type}`);

      let result;
      switch (requestData.type) {
        case 'new_booking_submitted':
          result = await this.handleNewBookingSubmission(requestData);
          break;
        case 'booking_status_update':
          result = await this.handleBookingStatusUpdate(requestData);
          break;
        case 'supplier_response':
          result = await this.handleSupplierResponse(requestData);
          break;
        default:
          throw new Error(`Unknown request type: ${requestData.type}`);
      }

      await this.endTrace(trace?.id, { result, success: true });
      return result;

    } catch (error) {
      await this.endTrace(trace?.id, { error: error.message }, 'error');
      await this.handleError(error, { requestData });
      throw error;
    }
  }

  async handleNewBookingSubmission(requestData) {
    const { bookingId, referenceNumber } = requestData;
    
    await this.logToLangSmith('new_booking_processing', {
      bookingId,
      referenceNumber,
      step: 'starting_processing'
    });

    // 1. Fetch booking details from Supabase
    const booking = await this.getBookingById(bookingId);
    
    // 2. AI Analysis of booking request
    let aiAnalysis = null;
    try {
      aiAnalysis = await this.analyzeWithAI('booking_request', booking);
      await this.logToLangSmith('ai_booking_analysis', {
        bookingId,
        analysis: aiAnalysis,
        riskLevel: aiAnalysis.risk_level
      });
    } catch (error) {
      console.warn('AI analysis failed, continuing with standard processing:', error.message);
    }
    
    await this.logToLangSmith('booking_data_retrieved', {
      bookingId,
      cruiseLine: booking.cruise_line,
      shipName: booking.ship_name,
      passengerCount: booking.passengers?.length || 0,
      aiAnalysis: aiAnalysis
    });

    // 3. Validate user verification status
    const userVerified = await this.validateUserVerification(booking.user_id);
    
    if (!userVerified) {
      throw new Error('User not verified for industry rates');
    }

    // 4. Generate personalized confirmation emails with AI
    const emailResults = await this.sendIntelligentBookingConfirmationEmails(booking, aiAnalysis);
    
    await this.logToLangSmith('emails_sent', {
      bookingId,
      emailResults,
      memberEmail: emailResults.member,
      adminEmail: emailResults.admin,
      supplierEmail: emailResults.supplier
    });

    // 5. Update booking status with AI insights
    await this.updateBookingStatus(bookingId, 'pending', {
      processed_by_bot: true,
      processed_at: new Date().toISOString(),
      ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
      risk_level: aiAnalysis?.risk_level || 'medium'
    });

    return {
      success: true,
      bookingId,
      referenceNumber,
      emailsSent: emailResults,
      status: 'pending_supplier_response'
    };
  }

  async handleBookingStatusUpdate(requestData) {
    const { bookingId, newStatus, updateData } = requestData;
    
    await this.logToLangSmith('status_update_processing', {
      bookingId,
      newStatus,
      updateData
    });

    const booking = await this.getBookingById(bookingId);
    
    // Update booking in database
    const updatedBooking = await this.updateBookingStatus(bookingId, newStatus, updateData);
    
    // Send appropriate notification emails
    let emailResult = null;
    if (newStatus === 'confirmed') {
      emailResult = await this.sendBookingConfirmedEmail(updatedBooking);
    } else if (newStatus === 'declined') {
      emailResult = await this.sendBookingDeclinedEmail(updatedBooking);
    }

    await this.logToLangSmith('status_update_completed', {
      bookingId,
      newStatus,
      emailSent: !!emailResult
    });

    return {
      success: true,
      bookingId,
      newStatus,
      emailSent: !!emailResult
    };
  }

  async handleSupplierResponse(requestData) {
    const { referenceNumber, action, responseData } = requestData;
    
    await this.logToLangSmith('supplier_response_processing', {
      referenceNumber,
      action,
      responseData
    });

    const booking = await this.getBookingByReference(referenceNumber);
    
    if (action === 'confirm') {
      return await this.processSupplierConfirmation(booking, responseData);
    } else if (action === 'decline') {
      return await this.processSupplierDecline(booking, responseData);
    }

    throw new Error(`Unknown supplier action: ${action}`);
  }

  async processSupplierConfirmation(booking, confirmationData) {
    const { cabinNumber, bookingNumber, paymentAmount, paymentInstructions } = confirmationData;
    
    // AI Analysis of supplier response
    let supplierAnalysis = null;
    try {
      supplierAnalysis = await this.analyzeWithAI('supplier_response', {
        action: 'confirm',
        cabinNumber,
        bookingNumber,
        paymentAmount,
        paymentInstructions
      });
      
      await this.logToLangSmith('supplier_response_analyzed', {
        bookingId: booking.id,
        analysis: supplierAnalysis,
        legitimacyScore: supplierAnalysis.legitimacy_score
      });
    } catch (error) {
      console.warn('AI supplier analysis failed:', error.message);
    }
    
    // Update booking with confirmation details
    const updatedBooking = await this.updateBookingStatus(booking.id, 'confirmed', {
      cabin_number: cabinNumber,
      official_booking_number: bookingNumber,
      payment_amount: paymentAmount,
      payment_instructions: paymentInstructions,
      confirmed_at: new Date().toISOString()
    });

    // Send confirmation email to customer
    await this.sendBookingConfirmedEmail(updatedBooking);
    
    // Send admin notification
    await this.sendAdminSupplierResponseNotification(updatedBooking, 'confirmed');

    await this.logToLangSmith('supplier_confirmation_processed', {
      bookingId: booking.id,
      cabinNumber,
      bookingNumber,
      paymentAmount
    });

    return {
      success: true,
      status: 'confirmed',
      bookingDetails: updatedBooking
    };
  }

  async processSupplierDecline(booking, declineData) {
    const { reason } = declineData;
    
    // Update booking with decline details
    const updatedBooking = await this.updateBookingStatus(booking.id, 'declined', {
      supplier_response: reason,
      declined_at: new Date().toISOString()
    });

    // Send decline email to customer
    await this.sendBookingDeclinedEmail(updatedBooking);
    
    // Send admin notification
    await this.sendAdminSupplierResponseNotification(updatedBooking, 'declined');

    await this.logToLangSmith('supplier_decline_processed', {
      bookingId: booking.id,
      reason
    });

    return {
      success: true,
      status: 'declined',
      reason
    };
  }

  async validateUserVerification(userId) {
    try {
      const { data: user, error } = await this.supabaseClient
        .from('users')
        .select('is_verified, verification_status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return user.is_verified === true;
    } catch (error) {
      console.error('User verification check failed:', error);
      return false;
    }
  }

  async sendIntelligentBookingConfirmationEmails(booking, aiAnalysis = null) {
    const emailResults = {
      member: 'pending',
      admin: 'pending', 
      supplier: 'pending'
    };

    try {
      // Generate AI-powered personalized content for member email
      const passenger1 = booking.passengers?.find(p => p.passenger_number === 1);
      let personalizedContent = null;
      
      if (passenger1 && this.geminiClient) {
        try {
          personalizedContent = await this.generatePersonalizedContent(
            'booking_confirmation',
            {
              fullName: passenger1.full_name,
              email: passenger1.email
            },
            {
              cruise_line: booking.cruise_line,
              ship_name: booking.ship_name,
              departure_date: booking.departure_date,
              reference_number: booking.reference_number,
              nights: booking.nights,
              region: booking.region
            }
          );
          
          await this.logToLangSmith('personalized_email_generated', {
            bookingId: booking.id,
            emailType: 'booking_confirmation',
            hasPersonalizedContent: !!personalizedContent
          });
        } catch (error) {
          console.warn('AI email generation failed, using template:', error.message);
        }
      }

      // Use existing email API with enhanced data
      const response = await fetch('/api/send-booking-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingData: {
            cruiseData: {
              cruiseLine: booking.cruise_line,
              shipName: booking.ship_name,
              departureDate: booking.departure_date,
              nights: booking.nights,
              region: booking.region,
              from: 'Various Ports',
              to: 'Round Trip'
            },
            selectedCabin: booking.cabin_type,
            passengers: booking.passengers,
            aiAnalysis: aiAnalysis,
            personalizedContent: personalizedContent
          },
          referenceNumber: booking.reference_number
        })
      });

      const result = await response.json();
      return result.results || emailResults;
      
    } catch (error) {
      console.error('Failed to send intelligent booking confirmation emails:', error);
      return emailResults;
    }
  }

  // Keep original method as fallback
  async sendBookingConfirmationEmails(booking) {
    return this.sendIntelligentBookingConfirmationEmails(booking, null);
  }

  async sendBookingConfirmedEmail(booking) {
    try {
      const response = await fetch('/api/send-supplier-response-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referenceNumber: booking.reference_number,
          action: 'confirmed',
          updateData: {
            cabin_number: booking.cabin_number,
            official_booking_number: booking.official_booking_number,
            payment_amount: booking.payment_amount,
            payment_instructions: booking.payment_instructions
          },
          bookingData: booking
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  async sendBookingDeclinedEmail(booking) {
    try {
      const response = await fetch('/api/send-supplier-response-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referenceNumber: booking.reference_number,
          action: 'declined',
          updateData: {
            supplier_response: booking.supplier_response
          },
          bookingData: booking
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to send decline email:', error);
      throw error;
    }
  }

  async sendAdminSupplierResponseNotification(booking, action) {
    // This would send an internal admin notification
    await this.logToLangSmith('admin_notification_sent', {
      bookingId: booking.id,
      action,
      adminNotified: true
    });
  }

  // BookingBot specific health check
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    // Test booking system connectivity
    try {
      const { data, error } = await this.supabaseClient
        .from('bookings')
        .select('count')
        .limit(1);
        
      baseHealth.bookingSystemConnected = !error;
    } catch (error) {
      baseHealth.bookingSystemConnected = false;
    }

    return {
      ...baseHealth,
      botType: 'BookingBot',
      capabilities: this.config.capabilities
    };
  }
}

export default BookingBot;