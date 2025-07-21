// Health Check API - Monitor system status and service availability
// Provides health status for monitoring and debugging

const { checkServiceHealth } = require('../lib/fallback-handler');
const { getAuditStats } = require('../lib/audit-logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await checkServiceHealth();
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's stats
    const quoteStats = await getAuditStats('quotes', today);
    const bookingStats = await getAuditStats('bookings', today);
    const errorStats = await getAuditStats('errors', today);
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: health.services,
      stats: {
        today: {
          quotes: quoteStats?.total || 0,
          bookings: bookingStats?.total || 0,
          errors: errorStats?.total || 0,
          uniqueIps: Math.max(quoteStats?.uniqueIps || 0, bookingStats?.uniqueIps || 0)
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasBrevo: !!process.env.BREVO_API_KEY
      }
    };
    
    // Determine overall health status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.includes('down')) {
      response.status = 'degraded';
      res.status(503);
    } else if (serviceStatuses.includes('degraded')) {
      response.status = 'degraded';
      res.status(200);
    } else {
      res.status(200);
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
}