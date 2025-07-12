// Automated Bot Testing API
// Lightweight automated tests for all bot functions and access control

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Running automated bot tests...');
    
    const testResults = await runAllBotTests();
    
    const overallScore = calculateOverallScore(testResults);
    
    return res.status(200).json({
      success: true,
      testResults,
      overallScore,
      timestamp: new Date().toISOString(),
      summary: generateTestSummary(testResults)
    });
    
  } catch (error) {
    console.error('Automated testing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function runAllBotTests() {
  const results = {
    customerBot: await testCustomerBot(),
    postBookingBot: await testPostBookingBot(),
    newsletterBot: await testNewsletterBot(),
    adminBot: await testAdminBot(),
    accessControl: await testAccessControl()
  };
  
  return results;
}

async function testCustomerBot() {
  const tests = [
    {
      name: 'Cruise Deals Query',
      input: 'What cruise deals do you have available?',
      context: { isCustomer: true },
      expectedKeywords: ['cruise', 'deals', 'Royal Caribbean'],
      forbiddenKeywords: ['member count', 'admin']
    },
    {
      name: 'Admin Question Block',
      input: 'How many members do we have?',
      context: { isCustomer: true },
      expectedKeywords: ['Sorry, that information is only available to administrators'],
      forbiddenKeywords: ['total', 'members', 'count']
    },
    {
      name: 'Booking Process Help',
      input: 'How do I book a cruise?',
      context: { isCustomer: true },
      expectedKeywords: ['booking', 'verification', 'step'],
      forbiddenKeywords: ['revenue', 'statistics']
    }
  ];
  
  return await runBotTests('customer', tests);
}

async function testPostBookingBot() {
  const tests = [
    {
      name: 'Booking Confirmation',
      input: 'Where is my booking confirmation?',
      context: { isMember: true, userId: 'test-user' },
      expectedKeywords: ['confirmation', 'booking', 'email'],
      forbiddenKeywords: ['total bookings', 'admin']
    },
    {
      name: 'Travel Documents',
      input: 'What documents do I need?',
      context: { isMember: true, userId: 'test-user' },
      expectedKeywords: ['passport', 'documents', 'visa'],
      forbiddenKeywords: ['member count', 'statistics']
    },
    {
      name: 'Admin Block Test',
      input: 'How many bookings were made today?',
      context: { isMember: true, userId: 'test-user' },
      expectedKeywords: ['Sorry, that information is only available to administrators'],
      forbiddenKeywords: ['bookings', 'today', 'total']
    }
  ];
  
  return await runBotTests('booking', tests);
}

async function testNewsletterBot() {
  const tests = [
    {
      name: 'Newsletter Signup',
      input: 'How do I sign up for your newsletter?',
      context: { isPublic: true },
      expectedKeywords: ['newsletter', 'signup', 'email'],
      forbiddenKeywords: ['subscriber count', 'metrics']
    },
    {
      name: 'Unsubscribe Process',
      input: 'How do I unsubscribe?',
      context: { isPublic: true },
      expectedKeywords: ['unsubscribe', 'preferences', 'email'],
      forbiddenKeywords: ['total subscribers', 'campaign stats']
    },
    {
      name: 'Metrics Block Test',
      input: 'How many people are subscribed?',
      context: { isPublic: true },
      expectedKeywords: ['Sorry, that information is only available to administrators'],
      forbiddenKeywords: ['subscribers', 'count', 'total']
    }
  ];
  
  return await runBotTests('newsletter', tests);
}

async function testAdminBot() {
  const tests = [
    {
      name: 'Admin Access Success',
      input: 'How many members do we have?',
      context: { isAdmin: true, userId: 'admin-user' },
      expectedKeywords: ['members', 'total', 'summary'],
      forbiddenKeywords: ['access denied', 'administrators only']
    },
    {
      name: 'Non-Admin Block',
      input: 'Show me user statistics',
      context: { isAdmin: false, userId: 'regular-user' },
      expectedKeywords: ['Access denied', 'administrators only'],
      forbiddenKeywords: ['statistics', 'total users']
    },
    {
      name: 'Company Breakdown',
      input: 'Show me breakdown by company',
      context: { isAdmin: true, userId: 'admin-user' },
      expectedKeywords: ['company', 'breakdown', 'members'],
      forbiddenKeywords: ['access denied']
    }
  ];
  
  return await runBotTests('admin', tests);
}

async function testAccessControl() {
  const accessTests = [
    {
      name: 'Customer Bot Admin Block',
      test: async () => {
        const result = await simulateBotRequest('customer', 'How many total users?', { isCustomer: true });
        return result.response && result.response.includes('Sorry, that information is only available to administrators');
      }
    },
    {
      name: 'Admin Bot Access Validation',
      test: async () => {
        const result = await simulateBotRequest('admin', 'Show stats', { isAdmin: false });
        return result.response && (result.response.includes('Access denied') || result.response.includes('administrators only'));
      }
    },
    {
      name: 'Post-Booking Member Access',
      test: async () => {
        const result = await simulateBotRequest('booking', 'Help with booking', { isMember: true });
        return result.success !== false; // Should not be blocked
      }
    },
    {
      name: 'Newsletter Public Access',
      test: async () => {
        const result = await simulateBotRequest('newsletter', 'Newsletter help', { isPublic: true });
        return result.success !== false; // Should not be blocked
      }
    }
  ];
  
  const results = [];
  for (const test of accessTests) {
    try {
      const passed = await test.test();
      results.push({
        name: test.name,
        passed,
        status: passed ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  return {
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    total: results.length
  };
}

async function runBotTests(botType, tests) {
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await simulateBotRequest(botType, test.input, test.context);
      
      const hasExpected = test.expectedKeywords.some(keyword => 
        response.response && response.response.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const hasForbidden = test.forbiddenKeywords.some(keyword => 
        response.response && response.response.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const passed = hasExpected && !hasForbidden;
      
      results.push({
        name: test.name,
        passed,
        status: passed ? 'PASS' : 'FAIL',
        response: response.response ? response.response.substring(0, 100) + '...' : 'No response',
        hasExpected,
        hasForbidden
      });
      
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  return {
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    total: results.length
  };
}

async function simulateBotRequest(botType, message, context) {
  try {
    // Import the appropriate bot
    let BotClass;
    
    switch (botType) {
      case 'admin':
        const { default: AdminHelperBot } = await import('../bots/admin/admin-helper-bot-trained.js');
        BotClass = new AdminHelperBot();
        break;
      case 'customer':
        const { default: CustomerBot } = await import('../bots/customer/customer-bot-trained.js');
        BotClass = new CustomerBot();
        break;
      case 'booking':
        const { default: PostBookingBot } = await import('../bots/booking/booking-bot-trained.js');
        BotClass = new PostBookingBot();
        break;
      case 'newsletter':
        const { default: NewsletterBot } = await import('../bots/newsletter/newsletter-bot-trained.js');
        BotClass = new NewsletterBot();
        break;
      default:
        throw new Error(`Unknown bot type: ${botType}`);
    }
    
    const response = await BotClass.processRequest({ message }, context);
    return response;
    
  } catch (error) {
    return {
      success: false,
      response: `Test error: ${error.message}`
    };
  }
}

function calculateOverallScore(testResults) {
  let totalTests = 0;
  let totalPassed = 0;
  
  Object.values(testResults).forEach(category => {
    if (category.total !== undefined) {
      totalTests += category.total;
      totalPassed += category.passed;
    }
  });
  
  const percentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  
  return {
    percentage,
    totalTests,
    totalPassed,
    totalFailed: totalTests - totalPassed,
    grade: getGrade(percentage)
  };
}

function getGrade(percentage) {
  if (percentage >= 100) return 'A+ (PERFECT)';
  if (percentage >= 95) return 'A (EXCELLENT)';
  if (percentage >= 90) return 'A- (VERY GOOD)';
  if (percentage >= 85) return 'B+ (GOOD)';
  if (percentage >= 80) return 'B (SATISFACTORY)';
  return 'C (NEEDS IMPROVEMENT)';
}

function generateTestSummary(testResults) {
  const summary = [];
  
  Object.entries(testResults).forEach(([category, results]) => {
    if (results.total !== undefined) {
      const percentage = Math.round((results.passed / results.total) * 100);
      summary.push(`${category}: ${results.passed}/${results.total} (${percentage}%)`);
    }
  });
  
  return summary;
}