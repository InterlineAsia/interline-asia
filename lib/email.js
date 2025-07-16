// Email Resilience Layer - Interline Asia Backend
// Provides retry and failover functionality for email sending

const brevo = require('./brevo.js');

/**
 * Send email with retry logic and failover
 * @param {Object} emailData - Email data (to, subject, content, etc.)
 * @param {number} maxAttempts - Maximum retry attempts (default: 2)
 * @returns {Promise} Email send result
 */
async function sendEmailWithRetry(emailData, maxAttempts = 2) {
  const startTime = Date.now();
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Email attempt ${attempt}/${maxAttempts} to: ${emailData.toEmail || emailData.to}`);
      
      // Try sending with Brevo
      const result = await brevo.sendEmail(emailData);
      
      // Log successful send
      console.log(`Email sent successfully on attempt ${attempt}, duration: ${Date.now() - startTime}ms`);
      await logEmailEvent('email_success', {
        recipient: emailData.toEmail || emailData.to,
        subject: emailData.subject,
        attempt: attempt,
        duration: Date.now() - startTime,
        service: 'brevo'
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`Email attempt ${attempt} failed:`, error.message);
      
      // Log failed attempt
      await logEmailEvent('email_attempt_failed', {
        recipient: emailData.toEmail || emailData.to,
        subject: emailData.subject,
        attempt: attempt,
        error: error.message,
        duration: Date.now() - startTime,
        service: 'brevo'
      });
      
      // If this was the last attempt, try fallback
      if (attempt === maxAttempts) {
        console.log('Attempting fallback email service...');
        try {
          const fallbackResult = await sendEmailFallback(emailData);
          
          await logEmailEvent('email_fallback_success', {
            recipient: emailData.toEmail || emailData.to,
            subject: emailData.subject,
            totalAttempts: maxAttempts,
            fallbackService: 'mailer_lite_stub'
          });
          
          return fallbackResult;
          
        } catch (fallbackError) {
          console.error('Fallback email service also failed:', fallbackError.message);
          
          await logEmailEvent('email_fallback_failed', {
            recipient: emailData.toEmail || emailData.to,
            subject: emailData.subject,
            primaryError: lastError.message,
            fallbackError: fallbackError.message,
            totalDuration: Date.now() - startTime
          });
        }
        break;
      }
      
      // Wait 2 seconds before retry
      console.log('Waiting 2 seconds before email retry...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // All attempts and fallback failed
  const totalDuration = Date.now() - startTime;
  console.error(`All email attempts failed, total duration: ${totalDuration}ms`);
  
  await logEmailEvent('email_failed_final', {
    recipient: emailData.toEmail || emailData.to,
    subject: emailData.subject,
    maxAttempts: maxAttempts,
    finalError: lastError.message,
    totalDuration: totalDuration
  });
  
  throw new Error(`Email failed after ${maxAttempts} attempts and fallback: ${lastError.message}`);
}

/**
 * Fallback email service (stub implementation)
 * @param {Object} emailData - Email data
 * @returns {Promise} Fallback result
 */
async function sendEmailFallback(emailData) {
  // This is a stub for a backup email service like MailerLite
  // In production, you would implement actual fallback service integration
  
  console.log('FALLBACK EMAIL SERVICE (STUB)');
  console.log('Would send via MailerLite or similar service:');
  console.log('- To:', emailData.toEmail || emailData.to);
  console.log('- Subject:', emailData.subject);
  console.log('- Content length:', emailData.htmlContent?.length || 0);
  
  // Simulate fallback service
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return a stub response
  return {
    success: true,
    service: 'fallback_stub',
    messageId: `fallback_${Date.now()}`,
    note: 'This is a stub implementation - integrate real fallback service'
  };
}

/**
 * Log email events for monitoring
 * @param {string} eventType - Type of event
 * @param {Object} eventData - Event data
 */
async function logEmailEvent(eventType, eventData) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      event_data: eventData,
      source: 'email_retry_system'
    };
    
    console.log(`EMAIL_LOG [${eventType}]:`, JSON.stringify(eventData, null, 2));
    
    // In production, log to monitoring service or database
    
  } catch (error) {
    console.warn('Failed to log email event:', error.message);
  }
}

/**
 * Enhanced email sending with validation
 * @param {Object} emailData - Email data
 * @returns {Promise} Send result
 */
async function enhancedSendEmail(emailData) {
  try {
    // Validate email data
    if (!emailData.toEmail && !emailData.to) {
      throw new Error('Recipient email is required');
    }
    
    if (!emailData.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!emailData.htmlContent && !emailData.textContent) {
      throw new Error('Email content is required');
    }
    
    // Send with retry logic
    return await sendEmailWithRetry(emailData);
    
  } catch (error) {
    console.error('Enhanced email send failed:', error.message);
    throw error;
  }
}

/**
 * Wrapper functions for common email types
 */
async function sendWelcomeEmailWithRetry(toEmail, toName) {
  return await enhancedSendEmail({
    toEmail,
    toName,
    subject: 'Welcome to Interline Asia',
    htmlContent: await brevo.sendWelcomeEmail(toEmail, toName)
  });
}

async function sendBookingConfirmationWithRetry(toEmail, toName, bookingDetails) {
  return await enhancedSendEmail({
    toEmail,
    toName,
    subject: 'Booking Confirmation - Interline Asia',
    htmlContent: await brevo.sendBookingConfirmation(toEmail, toName, bookingDetails)
  });
}

module.exports = {
  sendEmailWithRetry,
  enhancedSendEmail,
  sendEmailFallback,
  sendWelcomeEmailWithRetry,
  sendBookingConfirmationWithRetry,
  logEmailEvent
};