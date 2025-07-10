// Interline Asia - Bot Framework Test Suite
// Tests LangSmith, Supabase, and Brevo integrations

import { getBotManager } from '../bots/bot-manager.js';

async function runBotTests() {
  console.log('🧪 Starting Interline Asia Bot Framework Tests...\n');

  try {
    // Initialize Bot Manager
    console.log('1️⃣ Initializing Bot Manager...');
    const botManager = getBotManager();
    await botManager.initialize();
    console.log('✅ Bot Manager initialized successfully\n');

    // Test Health Check
    console.log('2️⃣ Testing Health Check...');
    const health = await botManager.healthCheck();
    console.log('Health Status:', JSON.stringify(health, null, 2));
    console.log('✅ Health check completed\n');

    // Test BookingBot
    console.log('3️⃣ Testing BookingBot...');
    const bookingBot = await botManager.getBot('booking');
    const bookingHealth = await bookingBot.healthCheck();
    console.log('BookingBot Health:', JSON.stringify(bookingHealth, null, 2));
    console.log('✅ BookingBot test completed\n');

    // Test FollowUpBot
    console.log('4️⃣ Testing FollowUpBot...');
    const followUpBot = await botManager.getBot('followup');
    const followUpHealth = await followUpBot.healthCheck();
    console.log('FollowUpBot Health:', JSON.stringify(followUpHealth, null, 2));
    console.log('✅ FollowUpBot test completed\n');

    // Test LeadBot
    console.log('5️⃣ Testing LeadBot...');
    const leadBot = await botManager.getBot('lead');
    const leadHealth = await leadBot.healthCheck();
    console.log('LeadBot Health:', JSON.stringify(leadHealth, null, 2));
    console.log('✅ LeadBot test completed\n');

    // Test LangSmith Logging
    console.log('6️⃣ Testing LangSmith Integration...');
    await bookingBot.logToLangSmith('test_event', {
      testData: 'Bot framework test',
      timestamp: new Date().toISOString()
    });
    console.log('✅ LangSmith logging test completed\n');

    console.log('🎉 All tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBotTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runBotTests };