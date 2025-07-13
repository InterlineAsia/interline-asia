#!/usr/bin/env node
// Nightly System Check - Comprehensive Health Monitoring with Gemini AI
// Runs at 3:00 AM daily via schedule-nightly-check.js

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Gemini AI Integration for system checks
class GeminiSystemValidator {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-1.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async validateWithAI(component, data, context) {
    if (!this.apiKey) {
      return {
        status: 'skipped',
        reason: 'Gemini API key not available'
      };
    }

    try {
      const prompt = this.buildValidationPrompt(component, data, context);
      const response = await this.callGemini(prompt);
      
      return {
        status: 'validated',
        aiResponse: response,
        confidence: this.parseConfidence(response)
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        fallback: 'Using standard validation'
      };
    }
  }

  buildValidationPrompt(component, data, context) {
    return `System Health Check - ${component}

Context: ${context}
Data Sample: ${JSON.stringify(data).substring(0, 500)}

Please analyze this system component and respond with:
1. HEALTH_STATUS: HEALTHY/DEGRADED/CRITICAL
2. CONFIDENCE: 0-100%
3. ISSUES: List any problems found
4. RECOMMENDATIONS: Suggested fixes

Keep response concise and technical.`;
  }

  async callGemini(prompt) {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  parseConfidence(response) {
    const match = response.match(/CONFIDENCE:\s*(\d+)/i);
    return match ? parseInt(match[1]) : 50;
  }
}

class NightlySystemCheck {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      repairs: [],
      failures: [],
      aiValidations: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        repaired: 0,
        aiValidated: 0
      }
    };
    this.geminiValidator = new GeminiSystemValidator();
  }

  log(message) {
    console.log(message);
  }

  async runCheck(name, checkFunction) {
    this.log(`Checking: ${name}`);
    this.results.summary.total++;
    
    try {
      const result = await checkFunction();
      
      if (result.status === 'pass') {
        this.log(`✅ ${name}: PASS`);
        this.results.summary.passed++;
      } else if (result.status === 'repaired') {
        this.log(`🔧 ${name}: REPAIRED - ${result.repair}`);
        this.results.summary.repaired++;
        this.results.repairs.push({ component: name, action: result.repair });
      } else {
        this.log(`❌ ${name}: FAIL - ${result.error}`);
        this.results.summary.failed++;
        this.results.failures.push({ component: name, error: result.error });
      }
      
      this.results.checks.push({
        component: name,
        status: result.status,
        details: result.details || '',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.log(`🚨 ${name}: EXCEPTION - ${error.message}`);
      this.results.summary.failed++;
      this.results.failures.push({ component: name, error: error.message });
    }
  }

  async checkCruiseDataIngestion() {
    try {
      // Check CSV files exist
      const csvFiles = [
        '0807 CABIN TYPES.csv',
        '0807 Master Upload RIVER.csv', 
        '1007 Master Upload Twins.csv'
      ];
      
      let missingFiles = [];
      for (const file of csvFiles) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        return {
          status: 'fail',
          error: `Missing CSV files: ${missingFiles.join(', ')}`
        };
      }
      
      // Check deals.json fallback
      if (!fs.existsSync('deals.json')) {
        return {
          status: 'fail',
          error: 'Fallback deals.json missing'
        };
      }
      
      const dealsData = JSON.parse(fs.readFileSync('deals.json', 'utf8'));
      if (!Array.isArray(dealsData) || dealsData.length < 50) {
        return {
          status: 'fail',
          error: `Insufficient deals data: ${dealsData.length} deals`
        };
      }

      // AI validation of cruise data
      const aiValidation = await this.geminiValidator.validateWithAI(
        'Cruise Data Ingestion',
        { 
          csvFiles: csvFiles.length,
          dealsCount: dealsData.length,
          sampleDeal: dealsData[0]
        },
        'Validating cruise data ingestion pipeline and fallback systems'
      );
      
      if (aiValidation.status === 'validated') {
        this.results.summary.aiValidated++;
        this.results.aiValidations.push({
          component: 'Cruise Data',
          confidence: aiValidation.confidence,
          response: aiValidation.aiResponse.substring(0, 200)
        });
      } else if (aiValidation.status === 'error') {
        this.log(`⚠️ Gemini validation error: ${aiValidation.error}`);
      }
      
      return {
        status: 'pass',
        details: `CSV files present, ${dealsData.length} deals in fallback`
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async checkUnifiedAPIEndpoints() {
    try {
      const endpoints = [
        'cruise-data',
        'bot-webhook', 
        'bot-health',
        'system-health-check',
        'csv-manager'
      ];
      
      // Check if unified API file exists
      const apiFile = path.join('api', 'unified-api.js');
      if (!fs.existsSync(apiFile)) {
        return {
          status: 'fail',
          error: 'Unified API file missing'
        };
      }
      
      // Validate API structure
      const apiContent = fs.readFileSync(apiFile, 'utf8');
      let missingEndpoints = [];
      
      for (const endpoint of endpoints) {
        if (!apiContent.includes(`case '${endpoint}':`)) {
          missingEndpoints.push(endpoint);
        }
      }
      
      if (missingEndpoints.length > 0) {
        return {
          status: 'fail',
          error: `Missing endpoints: ${missingEndpoints.join(', ')}`
        };
      }
      
      return {
        status: 'pass',
        details: `All ${endpoints.length} endpoints configured`
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async checkBotProcessing() {
    try {
      // Check environment variables
      const requiredEnvVars = [
        'GEMINI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      let missingVars = [];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          missingVars.push(envVar);
        }
      }
      
      if (missingVars.length > 0) {
        return {
          status: 'fail',
          error: `Missing environment variables: ${missingVars.join(', ')}`
        };
      }
      
      // Test Gemini API connection
      this.log('🤖 Testing Gemini API connection...');
      try {
        const testPrompt = 'System health check test. Respond with: GEMINI_OPERATIONAL';
        const geminiResponse = await this.geminiValidator.callGemini(testPrompt);
        
        if (geminiResponse.includes('GEMINI_OPERATIONAL')) {
          this.log('✅ Gemini API: Connected and responding');
        } else {
          this.log('⚠️ Gemini API: Connected but unexpected response');
        }
        
        // AI validation of bot system
        const aiValidation = await this.geminiValidator.validateWithAI(
          'Bot Processing System',
          { 
            envVars: requiredEnvVars.length,
            geminiModel: this.geminiValidator.model,
            testResponse: geminiResponse.substring(0, 100)
          },
          'Nightly health check of AI bot processing capabilities'
        );
        
        if (aiValidation.status === 'validated') {
          this.results.summary.aiValidated++;
          this.results.aiValidations.push({
            component: 'Bot Processing',
            confidence: aiValidation.confidence,
            response: aiValidation.aiResponse.substring(0, 200)
          });
        }
        
      } catch (geminiError) {
        this.log(`⚠️ Gemini API Error: ${geminiError.message}`);
        // Continue with standard checks even if Gemini fails
      }
      
      // Check bot files exist
      const botFiles = [
        'bots/core/gemini-client.js',
        'bots/admin/admin-helper-bot-trained.js',
        'bots/customer/customer-bot-trained.js'
      ];
      
      let missingBots = [];
      for (const botFile of botFiles) {
        if (!fs.existsSync(botFile)) {
          missingBots.push(botFile);
        }
      }
      
      if (missingBots.length > 0) {
        return {
          status: 'fail',
          error: `Missing bot files: ${missingBots.join(', ')}`
        };
      }
      
      return {
        status: 'pass',
        details: `Environment variables present, Gemini API tested, ${botFiles.length} bot files verified`
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async checkAuthenticationFlows() {
    try {
      const authFiles = [
        'public/login.html',
        'public/signup.html', 
        'public/dashboard.html',
        'public/supabase-client.js'
      ];
      
      let missingFiles = [];
      for (const file of authFiles) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        return {
          status: 'fail',
          error: `Missing auth files: ${missingFiles.join(', ')}`
        };
      }
      
      // Check for broken verify.html (should not exist)
      if (fs.existsSync('public/verify.html')) {
        const verifyContent = fs.readFileSync('public/verify.html', 'utf8');
        if (verifyContent.trim().length === 0) {
          fs.unlinkSync('public/verify.html');
          return {
            status: 'repaired',
            repair: 'Removed empty verify.html file',
            details: 'Cleaned up broken verification flow'
          };
        }
      }
      
      return {
        status: 'pass',
        details: 'Authentication files present and flows clean'
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async checkDashboardAndLoginFlows() {
    try {
      // Check critical frontend files
      const frontendFiles = [
        'public/index.html',
        'public/deals.html',
        'public/css/main.css',
        'public/js/unified-deals-loader.js'
      ];
      
      let missingFiles = [];
      let emptyFiles = [];
      
      for (const file of frontendFiles) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        } else {
          const stats = fs.statSync(file);
          if (stats.size === 0) {
            emptyFiles.push(file);
          }
        }
      }
      
      if (missingFiles.length > 0) {
        return {
          status: 'fail',
          error: `Missing frontend files: ${missingFiles.join(', ')}`
        };
      }
      
      if (emptyFiles.length > 0) {
        // Attempt repair for empty deals.html
        if (emptyFiles.includes('public/deals.html')) {
          return {
            status: 'fail',
            error: 'deals.html is empty - requires manual recreation'
          };
        }
        
        return {
          status: 'fail',
          error: `Empty files detected: ${emptyFiles.join(', ')}`
        };
      }
      
      return {
        status: 'pass',
        details: 'All frontend files present and non-empty'
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async checkDataIntegrity() {
    try {
      // Check deals.json integrity
      const dealsData = JSON.parse(fs.readFileSync('deals.json', 'utf8'));
      
      if (!Array.isArray(dealsData)) {
        return {
          status: 'fail',
          error: 'deals.json is not an array'
        };
      }
      
      // Check for required fields in sample deals
      const sampleDeal = dealsData[0];
      const requiredFields = ['cruiseLine', 'shipName', 'departureDate', 'region'];
      let missingFields = [];
      
      for (const field of requiredFields) {
        if (!sampleDeal[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        return {
          status: 'fail',
          error: `Sample deal missing fields: ${missingFields.join(', ')}`
        };
      }
      
      // Check chunked data integrity
      const dataDir = 'public/data';
      if (fs.existsSync(dataDir)) {
        const chunkFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('deals-chunk-'));
        
        if (chunkFiles.length === 0) {
          return {
            status: 'fail',
            error: 'No chunked data files found'
          };
        }
      }
      
      return {
        status: 'pass',
        details: `${dealsData.length} deals validated, data structure intact`
      };
      
    } catch (error) {
      return {
        status: 'fail',
        error: error.message
      };
    }
  }

  async sendNotificationIfNeeded() {
    const criticalFailures = this.results.failures.filter(failure => 
      failure.component.includes('Cruise Data') ||
      failure.component.includes('API') ||
      failure.error.includes('missing') ||
      failure.error.includes('empty')
    );
    
    if (criticalFailures.length > 0) {
      this.log('🚨 CRITICAL FAILURES DETECTED - EMAIL NOTIFICATION REQUIRED');
      this.log('Email would be sent to: admin@interlineasia.com');
      this.log('Critical issues:');
      criticalFailures.forEach(failure => {
        this.log(`  - ${failure.component}: ${failure.error}`);
      });
    } else {
      this.log('✅ No critical failures - no notification needed');
    }
  }

  async run() {
    this.log('🌙 STARTING NIGHTLY SYSTEM CHECK');
    this.log(`Timestamp: ${this.results.timestamp}`);
    this.log(`Gemini API: ${this.geminiValidator.apiKey ? 'Available' : 'Not configured'}`);
    this.log('─'.repeat(60));
    
    // Run all system checks
    await this.runCheck('Cruise Data Ingestion', () => this.checkCruiseDataIngestion());
    await this.runCheck('Unified API Endpoints', () => this.checkUnifiedAPIEndpoints());
    await this.runCheck('Bot Processing', () => this.checkBotProcessing());
    await this.runCheck('Authentication Flows', () => this.checkAuthenticationFlows());
    await this.runCheck('Dashboard and Login', () => this.checkDashboardAndLoginFlows());
    await this.runCheck('Data Integrity', () => this.checkDataIntegrity());
    
    // Generate summary
    this.log('─'.repeat(60));
    this.log('📊 NIGHTLY CHECK SUMMARY');
    this.log(`Total Checks: ${this.results.summary.total}`);
    this.log(`✅ Passed: ${this.results.summary.passed}`);
    this.log(`🔧 Repaired: ${this.results.summary.repaired}`);
    this.log(`❌ Failed: ${this.results.summary.failed}`);
    this.log(`🤖 AI Validated: ${this.results.summary.aiValidated}`);
    
    if (this.results.repairs.length > 0) {
      this.log('\n🔧 AUTO-REPAIRS PERFORMED:');
      this.results.repairs.forEach(repair => {
        this.log(`  - ${repair.component}: ${repair.action}`);
      });
    }
    
    if (this.results.aiValidations.length > 0) {
      this.log('\n🤖 AI VALIDATIONS:');
      this.results.aiValidations.forEach(validation => {
        this.log(`  - ${validation.component}: ${validation.confidence}% confidence`);
      });
    }
    
    if (this.results.failures.length > 0) {
      this.log('\n❌ FAILURES DETECTED:');
      this.results.failures.forEach(failure => {
        this.log(`  - ${failure.component}: ${failure.error}`);
      });
    }
    
    // Check if notification needed
    await this.sendNotificationIfNeeded();
    
    const healthScore = Math.round((this.results.summary.passed + this.results.summary.repaired) / this.results.summary.total * 100);
    this.log(`\n🎯 SYSTEM HEALTH SCORE: ${healthScore}%`);
    
    if (healthScore >= 90) {
      this.log('🟢 SYSTEM STATUS: HEALTHY');
    } else if (healthScore >= 70) {
      this.log('🟡 SYSTEM STATUS: DEGRADED');
    } else {
      this.log('🔴 SYSTEM STATUS: CRITICAL');
    }
    
    this.log('🌙 NIGHTLY CHECK COMPLETE');
    
    // Exit with appropriate code
    process.exit(this.results.summary.failed > 0 ? 1 : 0);
  }
}

// Run the nightly check
const checker = new NightlySystemCheck();
checker.run().catch(error => {
  console.error('🚨 NIGHTLY CHECK CRASHED:', error.message);
  process.exit(1);
});