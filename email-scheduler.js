// Automated Email Scheduler for Interline Asia
// Handles lifecycle emails: Bon Voyage, Welcome Home, Birthday

const { createEmailTemplate, sendEmail } = require('./emailUtils');
const { createClient } = require('@supabase/supabase-js');

class EmailScheduler {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.isRunning = false;
  }

  // Start the scheduler (runs every hour)
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📅 Email scheduler started');
    
    // Run immediately on start
    this.processScheduledEmails();
    
    // Then run every hour
    this.intervalId = setInterval(() => {
      this.processScheduledEmails();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('📅 Email scheduler stopped');
  }

  // Main processing function
  async processScheduledEmails() {
    try {
      console.log('📅 Processing scheduled emails...');
      
      await Promise.all([
        this.processBonVoyageEmails(),
        this.processWelcomeHomeEmails(),
        this.processBirthdayEmails()
      ]);
      
      console.log('✅ Scheduled email processing complete');
    } catch (error) {
      console.error('❌ Error processing scheduled emails:', error);
    }
  }

  // Process Bon Voyage emails (3 days before departure)
  async processBonVoyageEmails() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Get confirmed bookings departing in 3 days
      const { data: bookings, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .gte('cruise_departure_date', threeDaysFromNow.toISOString().split('T')[0])
        .lt('cruise_departure_date', new Date(threeDaysFromNow.getTime() + 24*60*60*1000).toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching bon voyage bookings:', error);
        return;
      }

      for (const booking of bookings || []) {
        await this.sendBonVoyageEmail(booking);
      }
      
      console.log(`📧 Processed ${bookings?.length || 0} bon voyage emails`);
    } catch (error) {
      console.error('Error processing bon voyage emails:', error);
    }
  }

  // Process Welcome Home emails (3 days after return)
  async processWelcomeHomeEmails() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Calculate return date (departure + nights)
      const { data: bookings, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .not('cruise_data->nights', 'is', null);

      if (error) {
        console.error('Error fetching welcome home bookings:', error);
        return;
      }

      const eligibleBookings = (bookings || []).filter(booking => {
        if (!booking.cruise_departure_date || !booking.cruise_data?.nights) return false;
        
        const departureDate = new Date(booking.cruise_departure_date);
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + parseInt(booking.cruise_data.nights));
        
        const threeDaysAfterReturn = new Date(returnDate);
        threeDaysAfterReturn.setDate(threeDaysAfterReturn.getDate() + 3);
        
        const today = new Date();
        return today.toDateString() === threeDaysAfterReturn.toDateString();
      });

      for (const booking of eligibleBookings) {
        await this.sendWelcomeHomeEmail(booking);
      }
      
      console.log(`📧 Processed ${eligibleBookings.length} welcome home emails`);
    } catch (error) {
      console.error('Error processing welcome home emails:', error);
    }
  }

  // Process Birthday emails (annual)
  async processBirthdayEmails() {
    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // 1-12
      const todayDay = today.getDate();
      
      // Get all confirmed bookings with DOB matching today
      const { data: bookings, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .not('date_of_birth', 'is', null);

      if (error) {
        console.error('Error fetching birthday bookings:', error);
        return;
      }

      const birthdayBookings = (bookings || []).filter(booking => {
        if (!booking.date_of_birth) return false;
        
        const dob = new Date(booking.date_of_birth);
        return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
      });

      for (const booking of birthdayBookings) {
        await this.sendBirthdayEmail(booking);
      }
      
      console.log(`📧 Processed ${birthdayBookings.length} birthday emails`);
    } catch (error) {
      console.error('Error processing birthday emails:', error);
    }
  }

  // Send Bon Voyage email
  async sendBonVoyageEmail(booking) {
    try {
      // Check if already sent
      const alreadySent = await this.checkEmailSent(booking.booking_id, 'bon_voyage');
      if (alreadySent) return;

      const cruiseData = booking.cruise_data || {};
      const departureDate = new Date(booking.cruise_departure_date);
      
      const emailContent = `
        <h2>⛵ Bon Voyage! Your Cruise Adventure Awaits</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>Your exciting cruise adventure is just 3 days away! We're thrilled to be part of your journey.</p>
        
        <div style="background: #dbeafe; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #3b82f6;">
          <h3>🚢 Your Cruise Details</h3>
          <p><strong>Ship:</strong> ${cruiseData.shipName} (${cruiseData.cruiseLine})</p>
          <p><strong>Departure:</strong> ${departureDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Duration:</strong> ${cruiseData.nights} nights</p>
          <p><strong>Route:</strong> ${cruiseData.from} to ${cruiseData.to}</p>
          <p><strong>Cabin:</strong> ${booking.cabin_number} (${booking.cabin_type})</p>
          <p><strong>Booking Reference:</strong> ${booking.cruise_booking_number}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>📋 Pre-Departure Checklist</h3>
          <ul>
            <li>✅ Check-in online (usually opens 24 hours before)</li>
            <li>✅ Ensure passport is valid for 6+ months</li>
            <li>✅ Pack essentials in carry-on bag</li>
            <li>✅ Arrive at port 2-3 hours early</li>
            <li>✅ Bring printed boarding documents</li>
            <li>✅ Check weather and pack accordingly</li>
          </ul>
        </div>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>💡 Travel Tips</h3>
          <ul>
            <li>📱 Download the cruise line's mobile app</li>
            <li>💳 Notify your bank of travel dates</li>
            <li>📷 Charge your camera and devices</li>
            <li>🌊 Pack motion sickness remedies if needed</li>
            <li>👕 Bring formal attire for special dinners</li>
          </ul>
        </div>
        
        <p>Have an absolutely wonderful time! We can't wait to hear about your adventures.</p>
        <p>Safe travels and bon voyage!</p>
        <p><strong>The Interline Asia Team</strong></p>
      `;

      await sendEmail(
        booking.user_email,
        `⛵ Bon Voyage! Your ${cruiseData.shipName} cruise departs in 3 days`,
        createEmailTemplate('Bon Voyage', emailContent)
      );

      // Log the sent email
      await this.logEmailSent(booking.booking_id, 'bon_voyage');
      
      console.log(`📧 Bon voyage email sent to ${booking.user_email}`);
    } catch (error) {
      console.error(`Error sending bon voyage email for booking ${booking.booking_id}:`, error);
    }
  }

  // Send Welcome Home email
  async sendWelcomeHomeEmail(booking) {
    try {
      // Check if already sent
      const alreadySent = await this.checkEmailSent(booking.booking_id, 'welcome_home');
      if (alreadySent) return;

      const cruiseData = booking.cruise_data || {};
      
      const emailContent = `
        <h2>🏠 Welcome Home! How Was Your Cruise?</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>Welcome back from your amazing cruise adventure aboard the ${cruiseData.shipName}!</p>
        
        <div style="background: #dcfce7; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #22c55e;">
          <h3>🌟 We Hope You Had an Amazing Time!</h3>
          <p>Your recent cruise:</p>
          <p><strong>Ship:</strong> ${cruiseData.shipName} (${cruiseData.cruiseLine})</p>
          <p><strong>Route:</strong> ${cruiseData.from} to ${cruiseData.to}</p>
          <p><strong>Duration:</strong> ${cruiseData.nights} wonderful nights</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>📝 Share Your Experience</h3>
          <p>We'd love to hear about your cruise experience! Your feedback helps us continue providing exceptional travel opportunities.</p>
          <div style="text-align: center; margin: 1.5rem 0;">
            <a href="mailto:admin@interlineasia.com?subject=Cruise Feedback - ${cruiseData.shipName}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              📧 Share Your Feedback
            </a>
          </div>
        </div>
        
        <div style="background: #fef3c7; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>🚢 Planning Your Next Adventure?</h3>
          <p>Already dreaming of your next cruise? We have exclusive deals waiting for you!</p>
          <div style="text-align: center; margin: 1.5rem 0;">
            <a href="https://interlineasia.com/deals-styled.html" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              🌊 Browse New Deals
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>📷 Share Your Photos</h3>
          <p>Did you capture some amazing moments? We'd love to see your cruise photos! Tag us on social media or send them our way.</p>
        </div>
        
        <p>Thank you for choosing Interline Asia for your cruise adventure. We hope to help you plan many more incredible journeys!</p>
        <p><strong>The Interline Asia Team</strong></p>
      `;

      await sendEmail(
        booking.user_email,
        `🏠 Welcome home from your ${cruiseData.shipName} cruise!`,
        createEmailTemplate('Welcome Home', emailContent)
      );

      // CC admin for post-cruise follow-up
      await sendEmail(
        'admin@interlineasia.com',
        `Post-Cruise Follow-up: ${booking.guest_name} - ${cruiseData.shipName}`,
        createEmailTemplate('Post-Cruise Admin Copy', `
          <h3>Post-Cruise Follow-up Sent</h3>
          <p><strong>Customer:</strong> ${booking.guest_name} (${booking.user_email})</p>
          <p><strong>Cruise:</strong> ${cruiseData.shipName}</p>
          <p><strong>Booking:</strong> ${booking.cruise_booking_number}</p>
          <p>Welcome home email sent for feedback and future booking opportunities.</p>
        `)
      );

      // Log the sent email
      await this.logEmailSent(booking.booking_id, 'welcome_home');
      
      console.log(`📧 Welcome home email sent to ${booking.user_email}`);
    } catch (error) {
      console.error(`Error sending welcome home email for booking ${booking.booking_id}:`, error);
    }
  }

  // Send Birthday email
  async sendBirthdayEmail(booking) {
    try {
      // Check if already sent this year
      const alreadySent = await this.checkEmailSent(booking.booking_id, 'birthday', new Date().getFullYear());
      if (alreadySent) return;

      const today = new Date();
      const age = today.getFullYear() - new Date(booking.date_of_birth).getFullYear();
      
      const emailContent = `
        <h2>🎂 Happy Birthday from Interline Asia!</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>🎉 Happy Birthday! We hope your special day is filled with joy, laughter, and wonderful memories.</p>
        
        <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 2rem; border-radius: 12px; margin: 1.5rem 0; text-align: center;">
          <h3 style="color: #92400e; font-size: 1.5rem; margin-bottom: 1rem;">🎈 Celebrating You! 🎈</h3>
          <p style="color: #92400e; font-size: 1.2rem; margin: 0;">Wishing you a fantastic birthday and an amazing year ahead!</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>🌊 Birthday Travel Inspiration</h3>
          <p>What better way to celebrate another year of life than with an incredible cruise adventure?</p>
          <ul>
            <li>🏝️ <strong>Caribbean Paradise:</strong> Tropical islands and crystal-clear waters</li>
            <li>🏔️ <strong>Alaska Wilderness:</strong> Glaciers, wildlife, and breathtaking scenery</li>
            <li>🏛️ <strong>Mediterranean Culture:</strong> Historic ports and culinary delights</li>
            <li>🌸 <strong>Asian Adventures:</strong> Exotic destinations and rich traditions</li>
          </ul>
          <div style="text-align: center; margin: 1.5rem 0;">
            <a href="https://interlineasia.com/deals-styled.html" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              🎁 Browse Birthday Deals
            </a>
          </div>
        </div>
        
        <div style="background: #dcfce7; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
          <h3>🎁 Special Birthday Offer</h3>
          <p>As our valued customer, you're always eligible for our exclusive industry rates and VIP treatment. Contact us to discuss special birthday cruise packages!</p>
          <p style="text-align: center;">
            <a href="mailto:admin@interlineasia.com?subject=Birthday Cruise Inquiry" 
               style="color: #059669; font-weight: 600; text-decoration: none;">
              📧 Contact us for special offers
            </a>
          </p>
        </div>
        
        <p>Thank you for being part of the Interline Asia family. We're grateful to have you as a valued customer and look forward to helping you create more amazing travel memories!</p>
        <p>Have a wonderful birthday celebration! 🎉</p>
        <p><strong>With warm birthday wishes,<br>The Interline Asia Team</strong></p>
      `;

      await sendEmail(
        booking.user_email,
        `🎂 Happy Birthday ${booking.guest_name.split(' ')[0]}! Special cruise offers await`,
        createEmailTemplate('Happy Birthday', emailContent)
      );

      // Log the sent email with year
      await this.logEmailSent(booking.booking_id, 'birthday', new Date().getFullYear());
      
      console.log(`📧 Birthday email sent to ${booking.user_email}`);
    } catch (error) {
      console.error(`Error sending birthday email for booking ${booking.booking_id}:`, error);
    }
  }

  // Check if email was already sent
  async checkEmailSent(bookingId, emailType, year = null) {
    try {
      let query = this.supabase
        .from('email_log')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('email_type', emailType);

      if (year) {
        query = query.eq('year_sent', year);
      }

      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking email log:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking email sent status:', error);
      return false;
    }
  }

  // Log sent email to prevent duplicates
  async logEmailSent(bookingId, emailType, year = null) {
    try {
      const logData = {
        booking_id: bookingId,
        email_type: emailType,
        sent_at: new Date().toISOString()
      };

      if (year) {
        logData.year_sent = year;
      }

      const { error } = await this.supabase
        .from('email_log')
        .insert([logData]);

      if (error) {
        console.error('Error logging email:', error);
      }
    } catch (error) {
      console.error('Error logging sent email:', error);
    }
  }

  // Manual trigger for testing
  async triggerTestEmails(bookingId, emailTypes = ['bon_voyage', 'welcome_home', 'birthday']) {
    try {
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error || !booking) {
        throw new Error('Booking not found');
      }

      const results = {};

      if (emailTypes.includes('bon_voyage')) {
        await this.sendBonVoyageEmail(booking);
        results.bon_voyage = 'sent';
      }

      if (emailTypes.includes('welcome_home')) {
        await this.sendWelcomeHomeEmail(booking);
        results.welcome_home = 'sent';
      }

      if (emailTypes.includes('birthday')) {
        await this.sendBirthdayEmail(booking);
        results.birthday = 'sent';
      }

      return results;
    } catch (error) {
      console.error('Error triggering test emails:', error);
      throw error;
    }
  }
}

module.exports = EmailScheduler;