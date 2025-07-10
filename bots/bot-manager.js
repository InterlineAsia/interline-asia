// Interline Asia - Bot Manager
// Central orchestrator for all AI bots with LangSmith monitoring

import BookingBot from './booking/booking-bot.js';
import FollowUpBot from './followup/followup-bot.js';
import LeadBot from './lead/lead-bot.js';

export class BotManager {
  constructor() {
    this.bots = new Map();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    try {
      console.log('🚀 Initializing Interline Asia Bot Manager...');

      // Initialize all bots
      const bookingBot = new BookingBot();
      const followUpBot = new FollowUpBot();
      const leadBot = new LeadBot();

      // Wait for all bots to initialize
      await Promise.all([
        bookingBot.initialize(),
        followUpBot.initialize(),
        leadBot.initialize()
      ]);

      // Register bots
      this.bots.set('booking', bookingBot);
      this.bots.set('followup', followUpBot);
      this.bots.set('lead', leadBot);

      this.isInitialized = true;
      console.log('✅ Bot Manager initialized successfully');

      // Log to LangSmith
      await this.logManagerEvent('bot_manager_initialized', {
        botsCount: this.bots.size,
        botTypes: Array.from(this.bots.keys()),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('❌ Bot Manager initialization failed:', error);
      throw error;
    }
  }

  async processRequest(botType, requestData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const bot = this.bots.get(botType);
    if (!bot) {
      throw new Error(`Bot type '${botType}' not found. Available bots: ${Array.from(this.bots.keys()).join(', ')}`);
    }

    try {
      console.log(`🤖 Processing request with ${botType} bot`);
      
      await this.logManagerEvent('request_processing_started', {
        botType,
        requestType: requestData.type,
        timestamp: new Date().toISOString()
      });

      const result = await bot.processRequest(requestData);

      await this.logManagerEvent('request_processing_completed', {
        botType,
        requestType: requestData.type,
        success: true,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      await this.logManagerEvent('request_processing_failed', {
        botType,
        requestType: requestData.type,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  async getBot(botType) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.bots.get(botType);
  }

  async getAllBots() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return Array.from(this.bots.values());
  }

  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          timestamp: new Date().toISOString()
        };
      }

      const botHealthChecks = await Promise.all(
        Array.from(this.bots.entries()).map(async ([name, bot]) => {
          try {
            const health = await bot.healthCheck();
            return { name, ...health };
          } catch (error) {
            return { 
              name, 
              status: 'error', 
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        })
      );

      const overallStatus = {
        status: 'healthy',
        manager: {
          initialized: this.isInitialized,
          botsCount: this.bots.size,
          timestamp: new Date().toISOString()
        },
        bots: botHealthChecks
      };

      // Check if any bots are unhealthy
      const unhealthyBots = botHealthChecks.filter(bot => !bot.initialized || bot.status === 'error');
      if (unhealthyBots.length > 0) {
        overallStatus.status = 'degraded';
        overallStatus.unhealthyBots = unhealthyBots.map(bot => bot.name);
      }

      await this.logManagerEvent('health_check_completed', overallStatus);

      return overallStatus;
    } catch (error) {
      const errorStatus = {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await this.logManagerEvent('health_check_failed', errorStatus);
      return errorStatus;
    }
  }

  async logManagerEvent(eventName, data) {
    try {
      // Use the first available bot's LangSmith client for logging
      const firstBot = Array.from(this.bots.values())[0];
      if (firstBot && firstBot.langsmithClient) {
        await firstBot.logToLangSmith(`manager_${eventName}`, {
          source: 'BotManager',
          ...data
        });
      }
    } catch (error) {
      console.error('Failed to log manager event:', error);
    }
  }

  // Convenience methods for common operations
  async processBookingRequest(requestData) {
    return this.processRequest('booking', requestData);
  }

  async processFollowUpRequest(requestData) {
    return this.processRequest('followup', requestData);
  }

  async processLeadRequest(requestData) {
    return this.processRequest('lead', requestData);
  }

  // Batch processing for scheduled tasks
  async processBatchRequests(requests) {
    const results = [];
    
    await this.logManagerEvent('batch_processing_started', {
      requestsCount: requests.length,
      requestTypes: requests.map(r => `${r.botType}:${r.data.type}`)
    });

    for (const request of requests) {
      try {
        const result = await this.processRequest(request.botType, request.data);
        results.push({ success: true, result, request: request.id || request.botType });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          request: request.id || request.botType 
        });
      }
    }

    await this.logManagerEvent('batch_processing_completed', {
      requestsCount: requests.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    });

    return results;
  }

  // Shutdown method
  async shutdown() {
    console.log('🛑 Shutting down Bot Manager...');
    
    await this.logManagerEvent('bot_manager_shutdown', {
      timestamp: new Date().toISOString()
    });

    this.bots.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    
    console.log('✅ Bot Manager shutdown complete');
  }
}

// Singleton instance
let botManagerInstance = null;

export function getBotManager() {
  if (!botManagerInstance) {
    botManagerInstance = new BotManager();
  }
  return botManagerInstance;
}

export default BotManager;