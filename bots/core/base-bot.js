// Interline Asia - Base Bot Framework (Clean)
// Core infrastructure for all AI bots with Supabase, Brevo, and Gemini integration

import { createClient } from '@supabase/supabase-js';
import GeminiClient from './gemini-client.js';

export class BaseBot {
  constructor(botName, config = {}) {
    this.botName = botName;
    this.config = config;
    this.supabaseClient = null;
    this.geminiClient = null;
    this.isInitialized = false;
    this.accessLevel = config.accessLevel || 'public'; // 'public', 'member', 'admin'
    this.expertise = config.expertise || []; // Bot's specific knowledge areas
    
    // Initialize all services
    this.initialize();
  }

  async initialize() {
    try {
      console.log(`Initializing ${this.botName} (${this.accessLevel} access)...`);
      
      // Initialize Supabase
      await this.initializeSupabase();
      
      // Initialize Gemini AI
      await this.initializeGemini();
      
      // Verify Brevo configuration
      this.verifyBrevoConfig();
      
      this.isInitialized = true;
      console.log(`${this.botName} initialized successfully`);
      
      // Log initialization to Supabase
      await this.logToSupabase('bot_initialized', {
        botName: this.botName,
        accessLevel: this.accessLevel,
        expertise: this.expertise,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      
    } catch (error) {
      console.error(`Failed to initialize ${this.botName}:`, error);
      throw error;
    }
  }

  // Access control validation
  validateAccess(requiredLevel, userContext = {}) {
    const levels = { 'public': 0, 'member': 1, 'admin': 2 };
    const botLevel = levels[this.accessLevel] || 0;
    const requiredLevelNum = levels[requiredLevel] || 0;
    
    if (botLevel < requiredLevelNum) {
      throw new Error(`Access denied: ${this.botName} requires ${requiredLevel} access`);
    }
    
    // Additional admin validation
    if (requiredLevel === 'admin' && !userContext.isAdmin) {
      throw new Error('Admin access required');
    }
    
    return true;
  }

  // Check if bot should answer this type of question
  canAnswerQuestion(question, userContext = {}) {
    const questionLower = question.toLowerCase();
    
    // Admin-only questions
    const adminKeywords = [
      'how many members', 'total users', 'pending bookings', 'email stats',
      'click rates', 'open rates', 'subscriber count', 'company breakdown',
      'verification stats', 'admin', 'database', 'metrics'
    ];
    
    const isAdminQuestion = adminKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    if (isAdminQuestion && this.accessLevel !== 'admin') {
      return {
        canAnswer: false,
        reason: 'admin_only',
        response: "Sorry, that information is only available to administrators."
      };
    }
    
    return { canAnswer: true };
  }

  async initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      
      // Test connection
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('permission')) {
        throw error;
      }
      
      console.log(`Supabase connected for ${this.botName}`);
      
    } catch (error) {
      console.error('Supabase initialization failed:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
  }

  async initializeGemini() {
    try {
      this.geminiClient = new GeminiClient();
      
      // Test connection
      const healthCheck = await this.geminiClient.healthCheck();
      
      if (!healthCheck.connected) {
        throw new Error(`Gemini connection failed: ${healthCheck.error}`);
      }
      
      console.log(`Gemini AI connected for ${this.botName} (${healthCheck.model})`);
      
    } catch (error) {
      console.warn(`Gemini AI initialization failed for ${this.botName}:`, error.message);
      console.warn('Bot will continue without AI capabilities');
      this.geminiClient = null;
    }
  }

  verifyBrevoConfig() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    
    if (!brevoApiKey) {
      console.warn('BREVO_API_KEY not found - email functionality will be limited');
    } else {
      console.log(`Brevo configuration verified for ${this.botName}`);
    }
  }

  // Simple logging to Supabase
  async logToSupabase(eventName, data) {
    if (!this.supabaseClient) {
      console.warn('Supabase not initialized, skipping log');
      return;
    }

    try {
      const logEntry = {
        bot_name: this.botName,
        event_name: eventName,
        event_data: data,
        timestamp: new Date().toISOString(),
        access_level: this.accessLevel
      };

      // Try to insert into bot_logs table (create if doesn't exist)
      const { error } = await this.supabaseClient
        .from('bot_logs')
        .insert([logEntry]);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        console.log('Creating bot_logs table...');
        // For now, just log to console
        console.log('Bot Log:', JSON.stringify(logEntry, null, 2));
      } else if (error) {
        console.error('Failed to log to Supabase:', error);
      }
      
    } catch (error) {
      console.error('Failed to log to Supabase:', error);
    }
  }

  // AI-powered helper methods
  async generateIntelligentResponse(prompt, context = {}) {
    if (!this.geminiClient) {
      throw new Error('Gemini AI not available - check configuration');
    }

    try {
      // Check access before generating response
      const accessCheck = this.canAnswerQuestion(prompt, context);
      if (!accessCheck.canAnswer) {
        return accessCheck.response;
      }

      const response = await this.geminiClient.generateContent(prompt, {
        botName: this.botName,
        accessLevel: this.accessLevel,
        expertise: this.expertise,
        ...context
      });

      await this.logToSupabase('ai_response_generated', {
        prompt: prompt.substring(0, 100) + '...',
        responseLength: response.length,
        context
      });

      return response;
    } catch (error) {
      await this.logToSupabase('ai_response_failed', {
        error: error.message,
        prompt: prompt.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    const status = {
      botName: this.botName,
      accessLevel: this.accessLevel,
      expertise: this.expertise,
      initialized: this.isInitialized,
      supabase: !!this.supabaseClient,
      gemini: !!this.geminiClient,
      brevo: !!process.env.BREVO_API_KEY,
      timestamp: new Date().toISOString()
    };

    // Test Gemini if available
    if (this.geminiClient) {
      try {
        const geminiHealth = await this.geminiClient.healthCheck();
        status.geminiHealth = geminiHealth;
      } catch (error) {
        status.geminiHealth = { connected: false, error: error.message };
      }
    }

    await this.logToSupabase('health_check', status);
    return status;
  }

  // Abstract methods to be implemented by specific bots
  async processRequest(requestData, userContext = {}) {
    throw new Error('processRequest method must be implemented by subclass');
  }

  async handleError(error, context = {}) {
    console.error(`${this.botName} error:`, error);
    
    await this.logToSupabase('error_occurred', {
      error: error.message,
      stack: error.stack,
      context: context
    });
  }
}

export default BaseBot;