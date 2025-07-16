// Upload Retry Logic - Interline Asia Backend Resilience
// Provides retry functionality for Supabase document uploads

/**
 * Upload file with retry logic and exponential backoff
 * @param {File} file - File to upload
 * @param {string} userId - User ID for upload
 * @param {Object} supabaseClient - Supabase client instance
 * @param {number} maxAttempts - Maximum retry attempts (default: 3)
 * @returns {Promise} Upload result or throws error
 */
async function uploadFileWithRetry(file, userId, supabaseClient, maxAttempts = 3) {
  const startTime = Date.now();
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxAttempts} for file: ${file.name}, user: ${userId}`);
      
      // Call the original upload method
      const result = await supabaseClient.uploadFile(file, userId);
      
      // Log successful upload
      console.log(`Upload successful on attempt ${attempt}, duration: ${Date.now() - startTime}ms`);
      await logUploadEvent('upload_success', {
        fileName: file.name,
        userId: userId,
        attempt: attempt,
        duration: Date.now() - startTime,
        fileSize: file.size
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      
      // Log failed attempt
      await logUploadEvent('upload_attempt_failed', {
        fileName: file.name,
        userId: userId,
        attempt: attempt,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      // If this was the last attempt, don't wait
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff: 1s → 3s → 5s
      const backoffDelay = attempt === 1 ? 1000 : attempt === 2 ? 3000 : 5000;
      console.log(`Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  // All attempts failed
  const totalDuration = Date.now() - startTime;
  console.error(`All ${maxAttempts} upload attempts failed for ${file.name}, total duration: ${totalDuration}ms`);
  
  await logUploadEvent('upload_failed_final', {
    fileName: file.name,
    userId: userId,
    maxAttempts: maxAttempts,
    finalError: lastError.message,
    totalDuration: totalDuration
  });
  
  throw new Error(`Upload failed after ${maxAttempts} attempts: ${lastError.message}`);
}

/**
 * Log upload events for monitoring and debugging
 * @param {string} eventType - Type of event (upload_success, upload_attempt_failed, etc.)
 * @param {Object} eventData - Event data to log
 */
async function logUploadEvent(eventType, eventData) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      event_data: eventData,
      source: 'upload_retry_system'
    };
    
    // Try to log to console for immediate visibility
    console.log(`UPLOAD_LOG [${eventType}]:`, JSON.stringify(eventData, null, 2));
    
    // In a production system, you might want to log to a monitoring service
    // or a dedicated logging table in Supabase
    
  } catch (error) {
    console.warn('Failed to log upload event:', error.message);
  }
}

/**
 * Validate file before upload attempt
 * @param {File} file - File to validate
 * @returns {boolean} True if file is valid
 */
function validateFileForUpload(file) {
  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Allowed file types
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (!file) {
    throw new Error('No file provided for upload');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit of 10MB`);
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: PDF, JPEG, PNG`);
  }
  
  return true;
}

/**
 * Enhanced upload function with validation and retry
 * @param {File} file - File to upload
 * @param {string} userId - User ID
 * @param {Object} supabaseClient - Supabase client
 * @returns {Promise} Upload result
 */
async function enhancedUpload(file, userId, supabaseClient) {
  try {
    // Validate file first
    validateFileForUpload(file);
    
    // Proceed with retry upload
    return await uploadFileWithRetry(file, userId, supabaseClient);
    
  } catch (error) {
    console.error('Enhanced upload failed:', error.message);
    throw error;
  }
}

module.exports = {
  uploadFileWithRetry,
  enhancedUpload,
  validateFileForUpload,
  logUploadEvent
};