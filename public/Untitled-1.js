// Vercel Cron Job for Interline Asia Email Scheduling
// This function is triggered by the schedule defined in vercel.json.

const { createEmailTemplate, sendEmail } = require('./_lib/emailUtils.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for secure backend operations
);

// --- Database Helpers ---

async function checkEmailSent(bookingId, emailType, year = null) {
  try {
    let query = supabase
      .from('email_log')
      .select('id', { count: 'exact' })
      .eq('booking_id', bookingId)
      .eq('email_type', emailType);

    if (year) {
      query = query.eq('year_sent', year);
    }

    const { error, count } = await query;
    
    if (error) {
      console.error('Error checking email log:', error);
      return false; // Fail safely
    }

    return count > 0;
  } catch (error) {
    console.error('Error checking email sent status:', error);
    return false;
  }
}

async function logEmailSent(bookingId, emailType, year = null) {
  try {
    const logData = {
      booking_id: bookingId,
      email_type: emailType,
      sent_at: new Date().toISOString()
    };

    if (year) {
      logData.year_sent = year;
    }

    const { error } = await supabase.from('email_log').insert([logData]);

    if (error) {
      console.error('Error logging email:', error);
    }
  } catch (error) {
    console.error('Error logging sent email:', error);
  }
}

// --- Email Sending Logic ---

async function sendBonVoyageEmail(booking) {
  const alreadySent = await checkEmailSent(booking.booking_id, 'bon_voyage');
  if (alreadySent) return;

  const cruiseData = booking.cruise_data || {};
  const emailContent = `<h2>⛵ Bon Voyage! Your Cruise Adventure Awaits</h2>...`; // Content from your original file

  await sendEmail(
    booking.user_email,
    `⛵ Bon Voyage! Your ${cruiseData.shipName} cruise departs in 3 days`,
    createEmailTemplate('Bon Voyage', emailContent)
  );

  await logEmailSent(booking.booking_id, 'bon_voyage');
  console.log(`📧 Bon voyage email sent to ${booking.user_email}`);
}

async function sendWelcomeHomeEmail(booking) {
  const alreadySent = await checkEmailSent(booking.booking_id, 'welcome_home');
  if (alreadySent) return;

  const cruiseData = booking.cruise_data || {};
  const emailContent = `<h2>🏠 Welcome Home! How Was Your Cruise?</h2>...`; // Content from your original file

  await sendEmail(
    booking.user_email,
    `🏠 Welcome home from your ${cruiseData.shipName} cruise!`,
    createEmailTemplate('Welcome Home', emailContent)
  );

  await logEmailSent(booking.booking_id, 'welcome_home');
  console.log(`📧 Welcome home email sent to ${booking.user_email}`);
}

async function sendBirthdayEmail(booking) {
  const alreadySent = await checkEmailSent(booking.booking_id, 'birthday', new Date().getFullYear());
  if (alreadySent) return;

  const emailContent = `<h2>🎂 Happy Birthday from Interline Asia!</h2>...`; // Content from your original file

  await sendEmail(
    booking.user_email,
    `🎂 Happy Birthday ${booking.guest_name.split(' ')[0]}! Special cruise offers await`,
    createEmailTemplate('Happy Birthday', emailContent)
  );

  await logEmailSent(booking.booking_id, 'birthday', new Date().getFullYear());
  console.log(`📧 Birthday email sent to ${booking.user_email}`);
}

// --- Main Processing Functions ---

async function processBonVoyageEmails() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .gte('cruise_departure_date', threeDaysFromNow.toISOString().split('T')[0])
    .lt('cruise_departure_date', new Date(threeDaysFromNow.getTime() + 24*60*60*1000).toISOString().split('T')[0]);

  if (error) throw new Error(`Bon Voyage fetch failed: ${error.message}`);
  for (const booking of bookings || []) await sendBonVoyageEmail(booking);
  console.log(`Processed ${bookings?.length || 0} bon voyage emails`);
}

async function processWelcomeHomeEmails() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .not('cruise_data->nights', 'is', null);

  if (error) throw new Error(`Welcome Home fetch failed: ${error.message}`);

  const eligibleBookings = (bookings || []).filter(booking => {
    if (!booking.cruise_departure_date || !booking.cruise_data?.nights) return false;
    const departureDate = new Date(booking.cruise_departure_date);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + parseInt(booking.cruise_data.nights));
    const threeDaysAfterReturn = new Date(returnDate);
    threeDaysAfterReturn.setDate(threeDaysAfterReturn.getDate() + 3);
    return new Date().toDateString() === threeDaysAfterReturn.toDateString();
  });

  for (const booking of eligibleBookings) await sendWelcomeHomeEmail(booking);
  console.log(`Processed ${eligibleBookings.length} welcome home emails`);
}

async function processBirthdayEmails() {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .not('date_of_birth', 'is', null);

  if (error) throw new Error(`Birthday fetch failed: ${error.message}`);

  const birthdayBookings = (bookings || []).filter(booking => {
    if (!booking.date_of_birth) return false;
    const dob = new Date(booking.date_of_birth);
    return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
  });

  for (const booking of birthdayBookings) await sendBirthdayEmail(booking);
  console.log(`Processed ${birthdayBookings.length} birthday emails`);
}

/**
 * The main handler for the Vercel Cron Job.
 * @param {import('http').IncomingMessage} req - The request object.
 * @param {import('http').ServerResponse} res - The response object.
 */
module.exports = async (req, res) => {
  // 1. Security Check: Ensure the request is from Vercel's cron service.
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Run the email processing logic
  try {
    console.log('📅 Processing scheduled emails via Vercel Cron...');
    
    await Promise.all([
      processBonVoyageEmails(),
      processWelcomeHomeEmails(),
      processBirthdayEmails()
    ]);
    
    console.log('✅ Scheduled email processing complete');
    res.status(200).json({ status: 'ok', message: 'Emails processed successfully.' });

  } catch (error) {
    console.error('❌ Error processing scheduled emails:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};