// Interline Asia - Base Bot Framework
// Core infrastructure for all AI bots with LangSmith, Supabase, and Brevo integration

import { Client } from 'langsmith';
import { createClient } from '@supabase/supabase-js';
import GeminiClient from './gemini-client.js';

export class BaseBot {
  constructor(botName, config = {}) {
    this.botName = botName;
    this.config = config;
    this.langsmithClient = null;
    this.supabaseClient = null;
    this.geminiClient = null;
    this.isInitialized = false;
    
    // Initialize all services
    this.initialize();
  }

  async initialize() {
    try {
      console.log(`🤖 Initializing ${this.botName}...`);
      
      // Initialize LangSmith
      await this.initializeLangSmith();
      
      // Initialize Supabase
      await this.initializeSupabase();
      
      // Initialize Gemini AI
      await this.initializeGemini();
      
      // Verify Brevo configuration
      this.verifyBrevoConfig();
      
      this.isInitialized = true;
      console.log(`✅ ${this.botName} initialized successfully`);
      
      // Log initialization to LangSmith
      await this.logToLangSmith('bot_initialized', {
        botName: this.botName,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.botName}:`, error);
      throw error;
    }
  }

  async initializeLangSmith() {
    try {
      const apiKey = process.env.LANGCHAIN_API_KEY;
      const endpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com';
      
      if (!apiKey) {
        throw new Error('LANGCHAIN_API_KEY not found in environment variables');
      }
      
      this.langsmithClient = new Client({
        apiKey: apiKey,
        apiUrl: endpoint
      });
      
      // Test connection
      await this.langsmithClient.createRun({
        name: `${this.botName}_connection_test`,
        run_type: 'chain',
        inputs: { test: 'connection' },
        outputs: { status: 'connected' }
      });
      
      console.log(`🔗 LangSmith connected for ${this.botName}`);
      
    } catch (error) {
      console.error('LangSmith initialization failed:', error);
      throw new Error(`LangSmith connection failed: ${error.message}`);
    }
  }

  async initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      
      // Test connection
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('permission')) {
        throw error;
      }
      
      console.log(`🗄️ Supabase connected for ${this.botName}`);
      
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
      
      console.log(`🧠 Gemini AI connected for ${this.botName} (${healthCheck.model})`);
      
    } catch (error) {
      console.warn(`⚠️ Gemini AI initialization failed for ${this.botName}:`, error.message);
      console.warn('Bot will continue without AI capabilities');
      this.geminiClient = null;
    }
  }

  verifyBrevoConfig() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    
    if (!brevoApiKey) {
      console.warn('⚠️ BREVO_API_KEY not found - email functionality will be limited');
    } else {
      console.log(`📧 Brevo configuration verified for ${this.botName}`);
    }
  }

  // LangSmith logging methods
  async logToLangSmith(eventName, data, runType = 'chain') {
    if (!this.langsmithClient) {
      console.warn('LangSmith not initialized, skipping log');
      return;
    }

    try {
      const run = await this.langsmithClient.createRun({
        name: `${this.botName}_${eventName}`,
        run_type: runType,
        inputs: {
          botName: this.botName,
          event: eventName,
          timestamp: new Date().toISOString(),
          ...data
        },
        outputs: {
          status: 'logged',
          processed_at: new Date().toISOString()
        }
      });
      
      return run;
    } catch (error) {
      console.error('Failed to log to LangSmith:', error);
    }
  }

  async startTrace(traceName, inputs = {}) {
    if (!this.langsmithClient) return null;

    try {
      return await this.langsmithClient.createRun({
        name: `${this.botName}_${traceName}`,
        run_type: 'chain',
        inputs: {
          botName: this.botName,
          trace: traceName,
          started_at: new Date().toISOString(),
          ...inputs
        }
      });
    } catch (error) {
      console.error('Failed to start trace:', error);
      return null;
    }
  }

  async endTrace(traceId, outputs = {}, status = 'success') {
    if (!this.langsmithClient || !traceId) return;

    try {
      await this.langsmithClient.updateRun(traceId, {
        outputs: {
          status: status,
          completed_at: new Date().toISOString(),
          ...outputs
        },
        end_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to end trace:', error);
    }
  }

  // Supabase helper methods
  async getBookingById(bookingId) {
    try {
      const { data, error } = await this.supabaseClient
        .from('bookings')
        .select(`
          *,
          passengers (*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get booking:', error);
      throw error;
    }
  }

  async getBookingByReference(referenceNumber) {
    try {
      const { data, error } = await this.supabaseClient
        .from('bookings')
        .select(`
          *,
          passengers (*)
        `)
        .eq('reference_number', referenceNumber)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get booking by reference:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId, status, additionalData = {}) {
    try {
      const { data, error } = await this.supabaseClient
        .from('bookings')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  }

  // Brevo email helper
  async sendBrevoEmail(emailData) {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Brevo email failed:', error);
      throw error;
    }
  }

  // Abstract methods to be implemented by specific bots
  async processRequest(requestData) {
    throw new Error('processRequest method must be implemented by subclass');
  }

  async handleError(error, context = {}) {
    console.error(`❌ ${this.botName} error:`, error);
    
    await this.logToLangSmith('error_occurred', {
      error: error.message,
      stack: error.stack,
      context: context
    });
  }

  // AI-powered helper methods
  async generateIntelligentResponse(prompt, context = {}) {
    if (!this.geminiClient) {
      throw new Error('Gemini AI not available - check configuration');
    }

    try {
      const response = await this.geminiClient.generateContent(prompt, {
        botName: this.botName,
        ...context
      });

      await this.logToLangSmith('ai_response_generated', {
        prompt: prompt.substring(0, 100) + '...',
        responseLength: response.length,
        context
      });

      return response;
    } catch (error) {
      await this.logToLangSmith('ai_response_failed', {
        error: error.message,
        prompt: prompt.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  async analyzeWithAI(analysisType, data) {
    if (!this.geminiClient) {
      console.warn('AI analysis not available - using fallback logic');
      return { analysis: 'AI not available', confidence: 0 };
    }

    try {
      let result;
      switch (analysisType) {
        case 'booking_request':
          result = await this.geminiClient.analyzeBookingRequest(data);
          break;
        case 'lead_qualification':
          result = await this.geminiClient.qualifyLead(data);
          break;
        case 'supplier_response':
          result = await this.geminiClient.analyzeSupplierResponse(data);
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      await this.logToLangSmith('ai_analysis_completed', {
        analysisType,
        result,
        dataKeys: Object.keys(data)
      });

      return result;
    } catch (error) {
      await this.logToLangSmith('ai_analysis_failed', {
        analysisType,
        error: error.message
      });
      throw error;
    }
  }

  async generatePersonalizedContent(contentType, recipientData, additionalData = {}) {
    if (!this.geminiClient) {
      console.warn('AI content generation not available - using templates');
      return null;
    }

    try {
      const content = await this.geminiClient.generatePersonalizedEmail(
        contentType,
        recipientData,
        additionalData
      );

      await this.logToLangSmith('ai_content_generated', {
        contentType,
        recipientEmail: recipientData.email,
        contentLength: content.length
      });

      return content;
    } catch (error) {
      await this.logToLangSmith('ai_content_failed', {
        contentType,
        error: error.message
      });
      return null;
    }
  }

  // Health check
  async healthCheck() {
    const status = {
      botName: this.botName,
      initialized: this.isInitialized,
      langsmith: !!this.langsmithClient,
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

    await this.logToLangSmith('health_check', status);
    return status;
  }
}

export default BaseBot;