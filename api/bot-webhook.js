// Interline Asia - Bot Webhook API
// Main endpoint for triggering bot actions from the application

import { getBotManager } from '../bots/bot-manager.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { botType, action, data } = req.body;

    if (!botType || !action || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: botType, action, data' 
      });
    }

    console.log(`🎯 Bot webhook triggered: ${botType}/${action}`);

    const botManager = getBotManager();
    
    // Prepare request data
    const requestData = {
      type: action,
      ...data,
      triggeredAt: new Date().toISOString(),
      source: 'webhook'
    };

    // Process the request
    const result = await botManager.processRequest(botType, requestData);

    return res.status(200).json({
      success: true,
      botType,
      action,
      result,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bot webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to trigger bot actions from other parts of the application
export async function triggerBotAction(botType, action, data) {
  try {
    const botManager = getBotManager();
    
    const requestData = {
      type: action,
      ...data,
      triggeredAt: new Date().toISOString(),
      source: 'internal'
    };

    return await botManager.processRequest(botType, requestData);
  } catch (error) {
    console.error(`Failed to trigger bot action ${botType}/${action}:`, error);
    throw error;
  }
}