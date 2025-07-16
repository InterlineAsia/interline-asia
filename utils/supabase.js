// Enhanced Supabase Client with Retry Logic - Interline Asia Backend
// Wraps the original Supabase client with resilience features

const { uploadFileWithRetry, enhancedUpload } = require('./upload.js');

/**
 * Enhanced Supabase client wrapper with retry capabilities
 * Extends the original client with resilience features
 */
class EnhancedSupabaseClient {
  constructor(originalClient) {
    this.client = originalClient;
    this.retryConfig = {
      maxAttempts: 3,
      backoffMultiplier: 1000 // Base delay in ms
    };
  }

  /**
   * Enhanced upload method with retry logic
   * @param {File} file - File to upload
   * @param {string} userId - User ID
   * @returns {Promise} Upload result
   */
  async uploadFileWithRetry(file, userId) {
    return await uploadFileWithRetry(file, userId, this.client, this.retryConfig.maxAttempts);
  }

  /**
   * Enhanced upload with validation and retry
   * @param {File} file - File to upload
   * @param {string} userId - User ID
   * @returns {Promise} Upload result
   */
  async enhancedUpload(file, userId) {
    return await enhancedUpload(file, userId, this.client);
  }

  /**
   * Database operation with retry logic
   * @param {Function} operation - Database operation function
   * @param {number} maxAttempts - Maximum retry attempts
   * @returns {Promise} Operation result
   */
  async dbOperationWithRetry(operation, maxAttempts = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`Database operation succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`Database operation attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxAttempts) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Database operation failed after ${maxAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Proxy all other methods to the original client
   */
  get auth() { return this.client.auth; }
  get storage() { return this.client.storage; }
  get functions() { return this.client.functions; }
  
  from(table) { return this.client.from(table); }
  rpc(fn, args) { return this.client.rpc(fn, args); }
}

/**
 * Create enhanced Supabase client
 * @param {Object} originalClient - Original Supabase client
 * @returns {EnhancedSupabaseClient} Enhanced client with retry capabilities
 */
function createEnhancedClient(originalClient) {
  return new EnhancedSupabaseClient(originalClient);
}

module.exports = {
  EnhancedSupabaseClient,
  createEnhancedClient
};