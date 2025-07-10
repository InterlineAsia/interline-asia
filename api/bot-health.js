// Interline Asia - Bot Health Check API
// Endpoint for monitoring bot system health

import { getBotManager } from '../bots/bot-manager.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏥 Bot health check requested');

    const botManager = getBotManager();
    const healthStatus = await botManager.healthCheck();

    // Set appropriate HTTP status based on health
    let httpStatus = 200;
    if (healthStatus.status === 'degraded') {
      httpStatus = 206; // Partial Content
    } else if (healthStatus.status === 'error' || healthStatus.status === 'not_initialized') {
      httpStatus = 503; // Service Unavailable
    }

    return res.status(httpStatus).json({
      ...healthStatus,
      endpoint: '/api/bot-health',
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bot health check error:', error);
    
    return res.status(503).json({
      status: 'error',
      error: error.message,
      endpoint: '/api/bot-health',
      checkedAt: new Date().toISOString()
    });
  }
}