#!/usr/bin/env node
// Comprehensive System Validation with Enhanced Gemini AI Testing
require('dotenv').config({ path: '.env.local' });

class ComprehensiveValidator {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.results = {
      timestamp: new Date().toISOString(),
      environmentCheck: {},
      geminiValidations: [],
      systemTests: [],
      overallScore: 0
    };
  }

  async validateEnvironment() {
    console.log('🔧 VALIDATING ENVIRONMENT VARIABLES...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY', 
      'GEMINI_API_KEY',
      'BREVO_API_KEY'
    ];
    
    let missingVars = [];
    let presentVars = [];
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        presentVars.push(varName);
        console.log(`✅ ${varName}: Present`);
      } else {
        missingVars.push(varName);
        console.log(`❌ ${varName}: Missing`);
      }
    });
    
    this.results.environmentCheck = {
      required: requiredVars.length,
      present: presentVars.length,
      missing: missingVars.length,
      missingVars,
      score: Math.round((presentVars.length / requiredVars.length) * 100)
    };
    
    return missingVars.length === 0;
  }

  async callGemini(prompt) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not available');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  async runGeminiValidation(component, systemData, context) {
    console.log(`🤖 GEMINI VALIDATION: ${component}`);
    
    try {
      const prompt = `SYSTEM HEALTH ANALYSIS - ${component}

Context: ${context}
System Data: ${JSON.stringify(systemData, null, 2).substring(0, 1000)}

Please analyze this system component and provide:
1. HEALTH_STATUS: HEALTHY/DEGRADED/CRITICAL
2. CONFIDENCE: 0-100% (your confidence in the assessment)
3. ISSUES: List specific problems found
4. RECOMMENDATIONS: Actionable fixes
5. SCORE: Overall component score 0-100

Format your response clearly with these exact headers.`;

      const response = await this.callGemini(prompt);
      
      // Parse confidence from response
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      // Parse score from response
      const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : confidence;
      
      // Parse health status
      const healthMatch = response.match(/HEALTH_STATUS:\s*(HEALTHY|DEGRADED|CRITICAL)/i);
      const healthStatus = healthMatch ? healthMatch[1] : 'UNKNOWN';
      
      const validation = {
        component,
        confidence,
        score,
        healthStatus,
        response: response.substring(0, 500),
        fullResponse: response,
        timestamp: new Date().toISOString()
      };
      
      this.results.geminiValidations.push(validation);
      
      console.log(`   Confidence: ${confidence}%`);
      console.log(`   Score: ${score}/100`);
      console.log(`   Status: ${healthStatus}`);
      
      return validation;
      
    } catch (error) {
      console.log(`   ❌ Gemini validation failed: ${error.message}`);
      return {
        component,
        confidence: 0,
        score: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testSystemComponents() {
    console.log('\n🧪 TESTING SYSTEM COMPONENTS...');
    
    const tests = [
      {
        name: 'Cruise Data System',
        test: () => this.testCruiseData(),
        geminiContext: 'Cruise data ingestion and fallback systems'
      },
      {
        name: 'Authentication System', 
        test: () => this.testAuthentication(),
        geminiContext: 'User authentication and session management'
      },
      {
        name: 'API Endpoints',
        test: () => this.testAPIEndpoints(),
        geminiContext: 'Unified API endpoint structure and routing'
      },
      {
        name: 'Bot Processing',
        test: () => this.testBotProcessing(),
        geminiContext: 'AI bot processing and Gemini integration'
      },
      {
        name: 'Frontend Systems',
        test: () => this.testFrontendSystems(),
        geminiContext: 'Frontend file integrity and user interface'
      }
    ];
    
    for (const test of tests) {
      console.log(`\n🔍 Testing: ${test.name}`);
      
      try {
        const testResult = await test.test();
        this.results.systemTests.push({
          name: test.name,
          ...testResult,
          timestamp: new Date().toISOString()
        });
        
        // Run Gemini validation for this component
        await this.runGeminiValidation(test.name, testResult, test.geminiContext);
        
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        this.results.systemTests.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          score: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async testCruiseData() {
    const fs = require('fs');
    
    // Check deals.json
    const dealsExist = fs.existsSync('deals.json');
    const dealsSize = dealsExist ? fs.statSync('deals.json').size : 0;
    
    let dealsCount = 0;
    if (dealsExist && dealsSize > 0) {
      const deals = JSON.parse(fs.readFileSync('deals.json', 'utf8'));
      dealsCount = Array.isArray(deals) ? deals.length : 0;
    }
    
    // Check CSV files
    const csvFiles = [
      '0807 CABIN TYPES.csv',
      '0807 Master Upload RIVER.csv',
      '1007 Master Upload Twins.csv'
    ];
    
    const csvStatus = csvFiles.map(file => ({
      file,
      exists: fs.existsSync(file),
      size: fs.existsSync(file) ? fs.statSync(file).size : 0
    }));
    
    const score = Math.min(100, 
      (dealsCount > 50 ? 40 : 0) + 
      (csvStatus.filter(c => c.exists).length * 20)
    );
    
    return {
      status: score >= 80 ? 'pass' : 'degraded',
      score,
      details: {
        dealsCount,
        csvFiles: csvStatus,
        fallbackAvailable: dealsExist
      }
    };
  }

  async testAuthentication() {
    const fs = require('fs');
    
    const authFiles = [
      'public/login.html',
      'public/signup.html',
      'public/dashboard.html',
      'public/dashboard-choice.html',
      'public/supabase-client.js'
    ];
    
    const fileStatus = authFiles.map(file => ({
      file,
      exists: fs.existsSync(file),
      size: fs.existsSync(file) ? fs.statSync(file).size : 0
    }));
    
    const existingFiles = fileStatus.filter(f => f.exists && f.size > 0);
    const score = Math.round((existingFiles.length / authFiles.length) * 100);
    
    return {
      status: score >= 90 ? 'pass' : score >= 70 ? 'degraded' : 'failed',
      score,
      details: {
        totalFiles: authFiles.length,
        existingFiles: existingFiles.length,
        fileStatus
      }
    };
  }

  async testAPIEndpoints() {
    const fs = require('fs');
    
    const unifiedAPI = fs.existsSync('api/unified-api.js');
    const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
    
    let endpointCount = 0;
    if (unifiedAPI) {
      const content = fs.readFileSync('api/unified-api.js', 'utf8');
      const endpoints = content.match(/case\s+['"]([^'"]+)['"]/g) || [];
      endpointCount = endpoints.length;
    }
    
    const score = Math.min(100, 
      (unifiedAPI ? 50 : 0) + 
      (endpointCount * 8) + 
      (apiFiles.length * 2)
    );
    
    return {
      status: score >= 80 ? 'pass' : 'degraded',
      score,
      details: {
        unifiedAPIExists: unifiedAPI,
        endpointCount,
        totalAPIFiles: apiFiles.length
      }
    };
  }

  async testBotProcessing() {
    // Test Gemini API connection
    let geminiWorking = false;
    let geminiResponse = '';
    
    try {
      geminiResponse = await this.callGemini('System test. Respond with: BOT_OPERATIONAL');
      geminiWorking = geminiResponse.includes('BOT_OPERATIONAL');
    } catch (error) {
      geminiResponse = error.message;
    }
    
    // Check bot files
    const fs = require('fs');
    const botFiles = [
      'bots/core/gemini-client.js',
      'bots/admin/admin-helper-bot-trained.js',
      'bots/customer/customer-bot-trained.js'
    ];
    
    const botStatus = botFiles.map(file => ({
      file,
      exists: fs.existsSync(file)
    }));
    
    const existingBots = botStatus.filter(b => b.exists).length;
    const score = Math.min(100,
      (geminiWorking ? 60 : 20) +
      (existingBots * 13)
    );
    
    return {
      status: score >= 80 ? 'pass' : 'degraded',
      score,
      details: {
        geminiWorking,
        geminiResponse: geminiResponse.substring(0, 100),
        botFiles: existingBots,
        totalBots: botFiles.length
      }
    };
  }

  async testFrontendSystems() {
    const fs = require('fs');
    
    const frontendFiles = [
      'public/index.html',
      'public/deals.html',
      'public/css/main.css',
      'public/js/unified-deals-loader.js'
    ];
    
    const fileStatus = frontendFiles.map(file => ({
      file,
      exists: fs.existsSync(file),
      size: fs.existsSync(file) ? fs.statSync(file).size : 0
    }));
    
    const workingFiles = fileStatus.filter(f => f.exists && f.size > 0);
    const score = Math.round((workingFiles.length / frontendFiles.length) * 100);
    
    return {
      status: score >= 90 ? 'pass' : 'degraded',
      score,
      details: {
        totalFiles: frontendFiles.length,
        workingFiles: workingFiles.length,
        fileStatus
      }
    };
  }

  calculateOverallScore() {
    const envScore = this.results.environmentCheck.score || 0;
    const systemScores = this.results.systemTests.map(t => t.score || 0);
    const geminiScores = this.results.geminiValidations.map(v => v.score || 0);
    
    const allScores = [envScore, ...systemScores, ...geminiScores];
    const overallScore = allScores.length > 0 ? 
      Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;
    
    this.results.overallScore = overallScore;
    return overallScore;
  }

  async run() {
    console.log('🚀 COMPREHENSIVE SYSTEM VALIDATION STARTING...');
    console.log(`Timestamp: ${this.results.timestamp}\n`);
    
    // 1. Validate Environment
    const envValid = await this.validateEnvironment();
    
    // 2. Test System Components with Gemini Validation
    await this.testSystemComponents();
    
    // 3. Calculate Overall Score
    const overallScore = this.calculateOverallScore();
    
    // 4. Generate Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🔧 ENVIRONMENT: ${this.results.environmentCheck.score}%`);
    console.log(`   Required vars: ${this.results.environmentCheck.required}`);
    console.log(`   Present: ${this.results.environmentCheck.present}`);
    console.log(`   Missing: ${this.results.environmentCheck.missing}`);
    
    console.log(`\n🧪 SYSTEM TESTS:`);
    this.results.systemTests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'degraded' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}: ${test.score || 0}%`);
    });
    
    console.log(`\n🤖 GEMINI AI VALIDATIONS:`);
    this.results.geminiValidations.forEach(validation => {
      const icon = validation.confidence >= 80 ? '✅' : validation.confidence >= 60 ? '⚠️' : '❌';
      console.log(`   ${icon} ${validation.component}: ${validation.confidence}% confidence, ${validation.score || 0}% score`);
    });
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallScore}%`);
    
    if (overallScore >= 95) {
      console.log('🟢 STATUS: EXCELLENT - All systems optimal');
    } else if (overallScore >= 85) {
      console.log('🟢 STATUS: GOOD - Minor optimizations possible');
    } else if (overallScore >= 70) {
      console.log('🟡 STATUS: DEGRADED - Needs attention');
    } else {
      console.log('🔴 STATUS: CRITICAL - Immediate fixes required');
    }
    
    // High confidence Gemini validations
    const highConfidenceValidations = this.results.geminiValidations.filter(v => v.confidence >= 80);
    console.log(`\n🎯 HIGH CONFIDENCE AI VALIDATIONS: ${highConfidenceValidations.length}/${this.results.geminiValidations.length}`);
    
    console.log('\n✅ COMPREHENSIVE VALIDATION COMPLETE');
    
    return {
      overallScore,
      environmentValid: envValid,
      highConfidenceValidations: highConfidenceValidations.length,
      totalValidations: this.results.geminiValidations.length
    };
  }
}

// Run comprehensive validation
const validator = new ComprehensiveValidator();
validator.run().catch(error => {
  console.error('🚨 VALIDATION CRASHED:', error.message);
  process.exit(1);
});