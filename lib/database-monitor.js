// Database Monitoring System - Interline Asia Enterprise
// Monitors Supabase database health, RLS policies, and connection status

import { createClient } from '@supabase/supabase-js';

class DatabaseMonitor {
  constructor() {
    this.supabase = null;
    this.lastHealthCheck = null;
    this.healthHistory = [];
    this.maxHistorySize = 100;
    
    this.initializeClient();
  }

  initializeClient() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Database monitor initialized');
      } else {
        console.warn('⚠️ Supabase credentials not found for database monitoring');
      }
    } catch (error) {
      console.error('❌ Failed to initialize database monitor:', error.message);
    }
  }

  // Main health check function
  async performHealthCheck() {
    const startTime = Date.now();
    const healthResult = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      checks: {},
      errors: []
    };

    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test basic connectivity
      healthResult.checks.connectivity = await this.checkConnectivity();
      
      // Test database operations
      healthResult.checks.database = await this.checkDatabaseOperations();
      
      // Test RLS policies
      healthResult.checks.security = await this.checkRLSPolicies();
      
      // Test storage
      healthResult.checks.storage = await this.checkStorageHealth();
      
      // Calculate overall status
      healthResult.status = this.calculateOverallStatus(healthResult.checks);
      
    } catch (error) {
      healthResult.status = 'error';
      healthResult.errors.push(error.message);
    }

    healthResult.responseTime = Date.now() - startTime;
    this.lastHealthCheck = healthResult;
    this.addToHistory(healthResult);

    return healthResult;
  }

  // Test basic Supabase connectivity
  async checkConnectivity() {
    try {
      const startTime = Date.now();
      
      // Simple query to test connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'error',
          responseTime,
          error: error.message
        };
      }

      return {
        status: responseTime < 1000 ? 'healthy' : 'slow',
        responseTime,
        message: `Connection successful (${responseTime}ms)`
      };

    } catch (error) {
      return {
        status: 'error',
        responseTime: 0,
        error: error.message
      };
    }
  }

  // Test database operations
  async checkDatabaseOperations() {
    const checks = {};

    try {
      // Test profiles table
      checks.profiles = await this.testTableAccess('profiles');
      
      // Test uploads table
      checks.uploads = await this.testTableAccess('uploads');
      
      // Test deals_dashboard table
      checks.deals = await this.testTableAccess('deals_dashboard');
      
      // Test bot_logs table (may not exist)
      checks.bot_logs = await this.testTableAccess('bot_logs', true);

      const allHealthy = Object.values(checks).every(check => 
        check.status === 'healthy' || check.status === 'not_found'
      );

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        tables: checks
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        tables: checks
      };
    }
  }

  // Test table access
  async testTableAccess(tableName, optional = false) {
    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        if (optional && error.code === '42P01') {
          return {
            status: 'not_found',
            responseTime,
            message: `Table ${tableName} not found (optional)`
          };
        }
        
        return {
          status: 'error',
          responseTime,
          error: error.message
        };
      }

      return {
        status: 'healthy',
        responseTime,
        recordCount: data?.length || 0
      };

    } catch (error) {
      return {
        status: 'error',
        responseTime: 0,
        error: error.message
      };
    }
  }

  // Test RLS policies
  async checkRLSPolicies() {
    const policies = {};

    try {
      // Test profiles RLS
      policies.profiles = await this.testRLSPolicy('profiles');
      
      // Test uploads RLS
      policies.uploads = await this.testRLSPolicy('uploads');

      const allSecure = Object.values(policies).every(policy => 
        policy.status === 'secure' || policy.status === 'unknown'
      );

      return {
        status: allSecure ? 'secure' : 'warning',
        policies
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        policies
      };
    }
  }

  // Test RLS policy for a table
  async testRLSPolicy(tableName) {
    try {
      // Try to access without authentication (should fail if RLS is working)
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data, error } = await anonClient
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.message.includes('RLS')) {
        return {
          status: 'secure',
          message: 'RLS policy active'
        };
      } else if (data && data.length === 0) {
        return {
          status: 'secure',
          message: 'No data accessible without auth'
        };
      } else {
        return {
          status: 'warning',
          message: 'Data accessible without authentication'
        };
      }

    } catch (error) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  // Test storage health
  async checkStorageHealth() {
    try {
      const startTime = Date.now();
      
      // Test storage bucket access
      const { data, error } = await this.supabase.storage
        .from('verification-uploads')
        .list('', { limit: 1 });

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'error',
          responseTime,
          error: error.message
        };
      }

      return {
        status: 'healthy',
        responseTime,
        message: 'Storage accessible'
      };

    } catch (error) {
      return {
        status: 'error',
        responseTime: 0,
        error: error.message
      };
    }
  }

  // Calculate overall health status
  calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('error')) {
      return 'error';
    } else if (statuses.includes('warning') || statuses.includes('degraded')) {
      return 'warning';
    } else if (statuses.includes('slow')) {
      return 'slow';
    } else {
      return 'healthy';
    }
  }

  // Add health check to history
  addToHistory(healthResult) {
    this.healthHistory.unshift(healthResult);
    
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get current health status
  getCurrentHealth() {
    return this.lastHealthCheck || {
      status: 'unknown',
      message: 'No health check performed yet'
    };
  }

  // Get health trends
  getHealthTrends() {
    if (this.healthHistory.length === 0) {
      return { trend: 'unknown', message: 'No historical data' };
    }

    const recent = this.healthHistory.slice(0, 10);
    const healthy = recent.filter(h => h.status === 'healthy').length;
    const total = recent.length;
    const healthPercentage = (healthy / total) * 100;

    let trend = 'stable';
    if (healthPercentage >= 90) {
      trend = 'excellent';
    } else if (healthPercentage >= 70) {
      trend = 'good';
    } else if (healthPercentage >= 50) {
      trend = 'concerning';
    } else {
      trend = 'critical';
    }

    return {
      trend,
      healthPercentage,
      recentChecks: total,
      averageResponseTime: recent.reduce((sum, h) => sum + h.responseTime, 0) / total
    };
  }

  // Get detailed health report
  getDetailedReport() {
    const current = this.getCurrentHealth();
    const trends = this.getHealthTrends();
    
    return {
      current,
      trends,
      history: this.healthHistory.slice(0, 20),
      summary: {
        lastCheck: current.timestamp,
        status: current.status,
        responseTime: current.responseTime,
        uptime: this.calculateUptime()
      }
    };
  }

  // Calculate uptime percentage
  calculateUptime() {
    if (this.healthHistory.length === 0) return 100;
    
    const healthy = this.healthHistory.filter(h => 
      h.status === 'healthy' || h.status === 'slow'
    ).length;
    
    return Math.round((healthy / this.healthHistory.length) * 100);
  }

  // Validate specific database configuration
  async validateConfiguration() {
    const validation = {
      timestamp: new Date().toISOString(),
      checks: {},
      status: 'unknown'
    };

    try {
      // Check required tables exist
      validation.checks.requiredTables = await this.checkRequiredTables();
      
      // Check RLS is enabled
      validation.checks.rlsEnabled = await this.checkRLSEnabled();
      
      // Check storage buckets
      validation.checks.storageBuckets = await this.checkStorageBuckets();

      // Calculate overall validation status
      const allPassed = Object.values(validation.checks).every(check => 
        check.status === 'pass'
      );
      
      validation.status = allPassed ? 'valid' : 'invalid';

    } catch (error) {
      validation.status = 'error';
      validation.error = error.message;
    }

    return validation;
  }

  async checkRequiredTables() {
    const requiredTables = ['profiles', 'uploads'];
    const results = {};

    for (const table of requiredTables) {
      results[table] = await this.testTableAccess(table);
    }

    const allExist = Object.values(results).every(r => r.status === 'healthy');

    return {
      status: allExist ? 'pass' : 'fail',
      tables: results
    };
  }

  async checkRLSEnabled() {
    // This would require admin access to check pg_tables
    // For now, we'll test by attempting unauthorized access
    const rlsTests = await this.checkRLSPolicies();
    
    return {
      status: rlsTests.status === 'secure' ? 'pass' : 'fail',
      details: rlsTests
    };
  }

  async checkStorageBuckets() {
    const requiredBuckets = ['verification-uploads'];
    const results = {};

    for (const bucket of requiredBuckets) {
      try {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .list('', { limit: 1 });

        results[bucket] = {
          status: error ? 'error' : 'healthy',
          error: error?.message
        };
      } catch (error) {
        results[bucket] = {
          status: 'error',
          error: error.message
        };
      }
    }

    const allHealthy = Object.values(results).every(r => r.status === 'healthy');

    return {
      status: allHealthy ? 'pass' : 'fail',
      buckets: results
    };
  }
}

// Create singleton instance
const databaseMonitor = new DatabaseMonitor();

// Export main functions
export const performHealthCheck = () => databaseMonitor.performHealthCheck();
export const getCurrentHealth = () => databaseMonitor.getCurrentHealth();
export const getHealthTrends = () => databaseMonitor.getHealthTrends();
export const getDetailedReport = () => databaseMonitor.getDetailedReport();
export const validateConfiguration = () => databaseMonitor.validateConfiguration();

export default databaseMonitor;