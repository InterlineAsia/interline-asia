// Interline Asia - AdminHelperBot Webhook
// Dedicated endpoint for AdminHelperBot requests

import AdminHelperBot from '../bots/admin/admin-helper-bot.js';

let adminBotInstance = null;

async function getAdminBot() {
  if (!adminBotInstance) {
    adminBotInstance = new AdminHelperBot();
    await adminBotInstance.initialize();
  }
  return adminBotInstance;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    if (!action || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: action, data' 
      });
    }

    console.log(`🧠 AdminHelperBot webhook triggered: ${action}`);

    // Verify admin access
    if (!data.adminUserId) {
      return res.status(403).json({
        error: 'Admin user ID required'
      });
    }

    const adminBot = await getAdminBot();
    
    // Prepare request data
    const requestData = {
      type: action,
      ...data,
      triggeredAt: new Date().toISOString(),
      source: 'admin_webhook'
    };

    // Process the request
    const result = await adminBot.processRequest(requestData);

    return res.status(200).json({
      success: true,
      action,
      result,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AdminHelperBot webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}