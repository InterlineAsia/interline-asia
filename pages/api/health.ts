// Health Check API Endpoint - Interline Asia Enterprise
// Provides system health status for uptime monitoring

import { NextApiRequest, NextApiResponse } from 'next';
import { performHealthCheck, getCurrentHealth } from '../../lib/database-monitor.js';
import { getHealthStatus } from '../../lib/error-handler.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers for monitoring services
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        status: 'error', 
        message: 'Method not allowed' 
      });
    }

    const startTime = Date.now();
    
    // Get query parameters
    const { detailed = 'false' } = req.query;
    const includeDetailed = detailed === 'true';

    // Basic health response
    const healthResponse: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // Add detailed health checks if requested
    if (includeDetailed) {
      try {
        // Database health
        const dbHealth = await performHealthCheck();
        healthResponse.database = {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          lastCheck: dbHealth.timestamp
        };

        // Error handler health
        const errorHealth = getHealthStatus();
        healthResponse.errorHandler = {
          status: errorHealth.status,
          recentErrors: errorHealth.recentErrorCount,
          sentryEnabled: errorHealth.sentryEnabled
        };

        // System resources
        healthResponse.system = {
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        };

        // Overall status based on components
        if (dbHealth.status === 'error' || errorHealth.status === 'critical') {
          healthResponse.status = 'degraded';
        } else if (dbHealth.status === 'warning' || errorHealth.status === 'warning') {
          healthResponse.status = 'warning';
        }

      } catch (detailedError) {
        healthResponse.status = 'warning';
        healthResponse.detailedCheckError = 'Failed to perform detailed health checks';
      }
    }

    // Add response time
    healthResponse.responseTime = Date.now() - startTime;

    // Set appropriate status code
    const statusCode = healthResponse.status === 'ok' ? 200 : 
                      healthResponse.status === 'warning' ? 200 : 503;

    return res.status(statusCode).json(healthResponse);

  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}