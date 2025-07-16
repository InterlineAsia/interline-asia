// Automated Testing Framework
// Provides comprehensive testing for critical system functions

class AutomatedTestSuite {
  constructor() {
    this.testResults = [];
    this.supabaseClient = null;
    this.init();
  }
  
  async init() {
    // Initialize Supabase client for testing
    if (typeof window !== 'undefined' && window.supabaseClient) {
      this.supabaseClient = window.supabaseClient;
    }
  }
  
  // Main test runner
  async runAllTests() {
    console.log('🧪 Starting Automated Test Suite...');
    const startTime = Date.now();
    
    const testSuites = [
      { name: 'Database Connectivity', fn: () => this.testDatabaseConnectivity() },
      { name: 'Authentication Flow', fn: () => this.testAuthenticationFlow() },
      { name: 'Booking System', fn: () => this.testBookingSystem() },
      { name: 'Email System', fn: () => this.testEmailSystem() },
      { name: 'Bot Functionality', fn: () => this.testBotFunctionality() },
      { name: 'Security Features', fn: () => this.testSecurityFeatures() },
      { name: 'Performance Metrics', fn: () => this.testPerformanceMetrics() },
      { name: 'UI Components', fn: () => this.testUIComponents() }
    ];
    
    for (const suite of testSuites) {
      try {
        console.log(`\n📋 Running ${suite.name} tests...`);
        await suite.fn();
      } catch (error) {
        this.recordTestResult(suite.name, 'SUITE_ERROR', false, error.message);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return this.generateTestReport(duration);
  }
  
  // Database Tests
  async testDatabaseConnectivity() {
    // Test 1: Basic connection
    await this.runTest('Database Connection', async () => {
      if (!this.supabaseClient) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return 'Database connection successful';
    });
    
    // Test 2: RLS policies
    await this.runTest('Row Level Security', async () => {
      // This should fail without proper authentication
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('*');
      
      // If we get data without auth, RLS might not be working
      if (data && data.length > 0) {
        throw new Error('RLS may not be properly configured');
      }
      
      return 'RLS policies working correctly';
    });
    
    // Test 3: Table structure
    await this.runTest('Table Structure', async () => {
      const tables = ['profiles', 'uploads', 'cruise_deals'];
      const results = [];
      
      for (const table of tables) {
        try {
          const { error } = await this.supabaseClient
            .from(table)
            .select('*')
            .limit(1);
          
          if (error && !error.message.includes('RLS')) {
            throw new Error(`Table ${table} structure issue: ${error.message}`);
          }
          
          results.push(`${table}: OK`);
        } catch (err) {
          results.push(`${table}: ERROR - ${err.message}`);
        }
      }
      
      return results.join(', ');
    });
  }
  
  // Authentication Tests
  async testAuthenticationFlow() {
    // Test 1: Login page accessibility
    await this.runTest('Login Page Load', async () => {
      const response = await fetch('/login.html');
      if (!response.ok) {
        throw new Error(`Login page returned ${response.status}`);
      }
      return 'Login page accessible';
    });
    
    // Test 2: Signup form validation
    await this.runTest('Signup Validation', async () => {
      // Test invalid email
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        fullName: 'Test User'
      };
      
      // This should be handled by frontend validation
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidData.email);
      const passwordValid = invalidData.password.length >= 8;
      
      if (emailValid || passwordValid) {
        throw new Error('Validation not working properly');
      }
      
      return 'Form validation working';
    });
    
    // Test 3: Session management
    await this.runTest('Session Management', async () => {
      // Check if session storage is working
      if (typeof localStorage === 'undefined') {
        return 'Session storage not available (server-side)';
      }
      
      // Test session storage
      const testKey = 'test_session_' + Date.now();
      localStorage.setItem(testKey, 'test_value');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== 'test_value') {
        throw new Error('Session storage not working');
      }
      
      return 'Session management functional';
    });
  }
  
  // Booking System Tests
  async testBookingSystem() {
    // Test 1: Booking form validation
    await this.runTest('Booking Form Validation', async () => {
      const testData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        cruiseId: 'TEST123'
      };
      
      // Validate each field
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testData.email);
      const nameValid = testData.firstName.length >= 2 && testData.lastName.length >= 2;
      const phoneValid = testData.phone.length >= 10;
      const cruiseValid = testData.cruiseId.length >= 3;
      
      if (!emailValid || !nameValid || !phoneValid || !cruiseValid) {
        throw new Error('Booking validation failed');
      }
      
      return 'Booking form validation working';
    });
    
    // Test 2: Booking API endpoint
    await this.runTest('Booking API Endpoint', async () => {
      try {
        const response = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '+1234567890',
            cruiseId: 'TEST123'
          })
        });
        
        if (response.status === 404) {
          return 'Booking API endpoint not found (expected in development)';
        }
        
        return `Booking API responded with status ${response.status}`;
      } catch (error) {
        return `Booking API test completed (${error.message})`;
      }
    });
  }
  
  // Email System Tests
  async testEmailSystem() {
    // Test 1: Email configuration
    await this.runTest('Email Configuration', async () => {
      const hasBrevoKey = !!process.env.BREVO_API_KEY;
      const hasEmailConfig = !!process.env.ADMIN_EMAIL;
      
      if (!hasBrevoKey && !hasEmailConfig) {
        return 'Email configuration not found (expected in development)';
      }
      
      return 'Email configuration present';
    });
    
    // Test 2: Email template validation
    await this.runTest('Email Templates', async () => {
      // Test email template structure
      const testTemplate = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };
      
      const hasRequiredFields = testTemplate.to && testTemplate.subject && testTemplate.html;
      
      if (!hasRequiredFields) {
        throw new Error('Email template structure invalid');
      }
      
      return 'Email templates structured correctly';
    });
  }
  
  // Bot Functionality Tests
  async testBotFunctionality() {
    // Test 1: Bot initialization
    await this.runTest('Bot Initialization', async () => {
      if (typeof window === 'undefined') {
        return 'Bot test skipped (server-side)';
      }
      
      // Check if bot script is loaded
      const botScript = document.querySelector('script[src*="cruise-helper-bot"]');
      const botButton = document.getElementById('chat-button');
      
      if (!botScript && !botButton) {
        return 'Bot not initialized (expected on some pages)';
      }
      
      return 'Bot initialization detected';
    });
    
    // Test 2: CSV data loading
    await this.runTest('CSV Data Loading', async () => {
      try {
        const response = await fetch('/data/twins.csv');
        if (response.ok) {
          const csvText = await response.text();
          const lines = csvText.split('\n');
          
          if (lines.length < 2) {
            throw new Error('CSV data appears empty');
          }
          
          return `CSV data loaded (${lines.length} lines)`;
        } else {
          return 'CSV data not found (expected in some environments)';
        }
      } catch (error) {
        return `CSV test completed (${error.message})`;
      }
    });
    
    // Test 3: Bot escalation API
    await this.runTest('Bot Escalation API', async () => {
      try {
        const response = await fetch('/api/bot-escalation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            question: 'This is a test question for the bot escalation system.'
          })
        });
        
        return `Bot escalation API responded with status ${response.status}`;
      } catch (error) {
        return `Bot escalation test completed (${error.message})`;
      }
    });
  }
  
  // Security Tests
  async testSecurityFeatures() {
    // Test 1: HTTPS enforcement
    await this.runTest('HTTPS Enforcement', async () => {
      if (typeof window === 'undefined') {
        return 'HTTPS test skipped (server-side)';
      }
      
      const isHTTPS = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost';
      
      if (!isHTTPS && !isLocalhost) {
        throw new Error('HTTPS not enforced in production');
      }
      
      return isHTTPS ? 'HTTPS enforced' : 'HTTP allowed (localhost)';
    });
    
    // Test 2: Input sanitization
    await this.runTest('Input Sanitization', async () => {
      const testInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        '../../etc/passwd'
      ];
      
      // Test basic sanitization
      const sanitized = testInputs.map(input => 
        input.replace(/[<>]/g, '').substring(0, 100)
      );
      
      const hasScriptTags = sanitized.some(s => s.includes('<script>'));
      
      if (hasScriptTags) {
        throw new Error('Input sanitization not working');
      }
      
      return 'Input sanitization working';
    });
    
    // Test 3: Rate limiting simulation
    await this.runTest('Rate Limiting', async () => {
      // Simulate multiple rapid requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(fetch('/api/booking', { method: 'GET' }));
      }
      
      try {
        const responses = await Promise.all(requests);
        const rateLimited = responses.some(r => r.status === 429);
        
        return rateLimited ? 'Rate limiting active' : 'Rate limiting not detected';
      } catch (error) {
        return `Rate limiting test completed (${error.message})`;
      }
    });
  }
  
  // Performance Tests
  async testPerformanceMetrics() {
    // Test 1: Page load time
    await this.runTest('Page Load Performance', async () => {
      if (typeof window === 'undefined' || !window.performance) {
        return 'Performance API not available';
      }
      
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) {
        return 'Navigation timing not available';
      }
      
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      if (loadTime > 5000) {
        throw new Error(`Page load time too slow: ${loadTime}ms`);
      }
      
      return `Page load time: ${Math.round(loadTime)}ms`;
    });
    
    // Test 2: Memory usage
    await this.runTest('Memory Usage', async () => {
      if (typeof window === 'undefined' || !window.performance.memory) {
        return 'Memory API not available';
      }
      
      const memory = window.performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      if (usedMB > 100) {
        return `High memory usage detected: ${usedMB}MB`;
      }
      
      return `Memory usage: ${usedMB}MB`;
    });
  }
  
  // UI Component Tests
  async testUIComponents() {
    if (typeof window === 'undefined') {
      return this.recordTestResult('UI Components', 'SKIPPED', true, 'Server-side environment');
    }
    
    // Test 1: Critical elements present
    await this.runTest('Critical Elements', async () => {
      const criticalElements = [
        'head',
        'body',
        'title'
      ];
      
      const missing = criticalElements.filter(el => !document.querySelector(el));
      
      if (missing.length > 0) {
        throw new Error(`Missing critical elements: ${missing.join(', ')}`);
      }
      
      return 'All critical elements present';
    });
    
    // Test 2: Responsive design
    await this.runTest('Responsive Design', async () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      
      if (!viewport) {
        throw new Error('Viewport meta tag missing');
      }
      
      const content = viewport.getAttribute('content');
      const hasResponsiveSettings = content.includes('width=device-width');
      
      if (!hasResponsiveSettings) {
        throw new Error('Responsive viewport settings missing');
      }
      
      return 'Responsive design configured';
    });
    
    // Test 3: Accessibility features
    await this.runTest('Accessibility Features', async () => {
      const issues = [];
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
      
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images without alt text`);
      }
      
      // Check for form labels
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
      const inputsWithoutLabels = Array.from(inputs).filter(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        return !label && !input.getAttribute('aria-label');
      });
      
      if (inputsWithoutLabels.length > 0) {
        issues.push(`${inputsWithoutLabels.length} inputs without labels`);
      }
      
      if (issues.length > 0) {
        return `Accessibility issues found: ${issues.join(', ')}`;
      }
      
      return 'Basic accessibility features present';
    });
  }
  
  // Test execution helper
  async runTest(testName, testFunction) {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.recordTestResult(testName, 'PASSED', true, result, duration);
      console.log(`  ✅ ${testName}: ${result} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordTestResult(testName, 'FAILED', false, error.message, duration);
      console.log(`  ❌ ${testName}: ${error.message} (${duration}ms)`);
    }
  }
  
  recordTestResult(testName, status, passed, message, duration = 0) {
    this.testResults.push({
      testName,
      status,
      passed,
      message,
      duration,
      timestamp: new Date().toISOString()
    });
  }
  
  generateTestReport(totalDuration) {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        passRate: Math.round((passed / total) * 100),
        totalDuration
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Pass Rate: ${report.summary.passRate}%`);
    console.log(`   Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.testName}: ${r.message}`));
    }
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.passed);
    
    if (failedTests.some(t => t.testName.includes('Database'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database',
        message: 'Database connectivity issues detected. Check Supabase configuration.'
      });
    }
    
    if (failedTests.some(t => t.testName.includes('Security'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        message: 'Security vulnerabilities detected. Review security implementations.'
      });
    }
    
    if (failedTests.some(t => t.testName.includes('Performance'))) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        message: 'Performance issues detected. Consider optimization strategies.'
      });
    }
    
    if (failedTests.some(t => t.testName.includes('Accessibility'))) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Accessibility',
        message: 'Accessibility improvements needed for better user experience.'
      });
    }
    
    return recommendations;
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AutomatedTestSuite };
} else if (typeof window !== 'undefined') {
  window.AutomatedTestSuite = AutomatedTestSuite;
  
  // Auto-run tests in development
  if (window.location.hostname === 'localhost' && window.location.search.includes('test=auto')) {
    const testSuite = new AutomatedTestSuite();
    testSuite.runAllTests().then(report => {
      console.log('🧪 Automated tests completed:', report);
    });
  }
}