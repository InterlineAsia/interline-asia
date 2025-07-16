// Centralized Error Handling System - Interline Asia Enterprise
// Provides comprehensive error logging, monitoring, and recovery mechanisms

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 1000;
    this.sentryEnabled = false;
    
    // Check if Sentry is available
    this.initializeSentry();
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  initializeSentry() {
    try {
      if (typeof window !== 'undefined' && window.Sentry) {
        this.sentryEnabled = true;
        console.log('✅ Sentry integration detected');
      } else if (typeof global !== 'undefined' && global.Sentry) {
        this.sentryEnabled = true;
        console.log('✅ Sentry integration detected (server)');
      }
    } catch (error) {
      console.log('ℹ️ Sentry not available, using fallback logging');
    }
  }

  setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      // Browser error handlers
      window.addEventListener('error', (event) => {
        this.logError(event.error || new Error(event.message), {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError(event.reason, {
          type: 'unhandled_promise_rejection'
        });
      });
    }

    if (typeof process !== 'undefined') {
      // Node.js error handlers
      process.on('uncaughtException', (error) => {
        this.logError(error, {
          type: 'uncaught_exception',
          fatal: true
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.logError(reason, {
          type: 'unhandled_rejection',
          promise: promise.toString()
        });
      });
    }
  }

  // Main error logging function
  async logError(error, context = {}) {
    try {
      const errorInfo = this.processError(error, context);
      
      // Log to console (always available)
      this.logToConsole(errorInfo);
      
      // Log to Sentry if available
      if (this.sentryEnabled) {
        this.logToSentry(errorInfo);
      }
      
      // Log to Supabase if available
      await this.logToSupabase(errorInfo);
      
      // Update error statistics
      this.updateErrorStats(errorInfo);
      
      // Add to history
      this.addToHistory(errorInfo);
      
      return errorInfo;
      
    } catch (loggingError) {
      // Fallback: at least log to console if logging itself fails
      console.error('❌ Error logging failed:', loggingError);
      console.error('📋 Original error:', error);
    }
  }

  processError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();
    
    // Extract error information
    let errorInfo = {
      id: errorId,
      timestamp,
      message: 'Unknown error',
      stack: null,
      name: 'Error',
      context,
      severity: this.determineSeverity(error, context),
      environment: this.getEnvironment(),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : null,
      url: typeof window !== 'undefined' ? window.location?.href : null
    };

    if (error instanceof Error) {
      errorInfo.message = error.message;
      errorInfo.stack = error.stack;
      errorInfo.name = error.name;
    } else if (typeof error === 'string') {
      errorInfo.message = error;
    } else if (error && typeof error === 'object') {
      errorInfo.message = error.message || JSON.stringify(error);
      errorInfo.stack = error.stack;
      errorInfo.name = error.name || 'ObjectError';
    }

    return errorInfo;
  }

  determineSeverity(error, context) {
    if (context.fatal || context.type === 'uncaught_exception') {
      return 'fatal';
    }
    
    if (context.type === 'api_error' && context.statusCode >= 500) {
      return 'error';
    }
    
    if (error?.name === 'TypeError' || error?.name === 'ReferenceError') {
      return 'error';
    }
    
    if (context.type === 'validation_error' || context.statusCode < 500) {
      return 'warning';
    }
    
    return 'error';
  }

  getEnvironment() {
    if (typeof window !== 'undefined') {
      return 'browser';
    } else if (typeof process !== 'undefined') {
      return process.env.NODE_ENV || 'development';
    }
    return 'unknown';
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logToConsole(errorInfo) {
    const emoji = {
      fatal: '💀',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    console.group(`${emoji[errorInfo.severity]} ${errorInfo.severity.toUpperCase()}: ${errorInfo.message}`);
    console.log('🆔 Error ID:', errorInfo.id);
    console.log('⏰ Timestamp:', errorInfo.timestamp);
    console.log('🌍 Environment:', errorInfo.environment);
    
    if (errorInfo.context && Object.keys(errorInfo.context).length > 0) {
      console.log('📋 Context:', errorInfo.context);
    }
    
    if (errorInfo.stack) {
      console.log('📚 Stack trace:', errorInfo.stack);
    }
    
    console.groupEnd();
  }

  logToSentry(errorInfo) {
    try {
      const Sentry = typeof window !== 'undefined' ? window.Sentry : global.Sentry;
      
      if (Sentry) {
        Sentry.withScope((scope) => {
          scope.setTag('errorId', errorInfo.id);
          scope.setLevel(errorInfo.severity);
          scope.setContext('errorDetails', errorInfo.context);
          
          if (errorInfo.severity === 'fatal') {
            Sentry.captureException(new Error(errorInfo.message));
          } else {
            Sentry.captureMessage(errorInfo.message, errorInfo.severity);
          }
        });
      }
    } catch (sentryError) {
      console.warn('⚠️ Failed to log to Sentry:', sentryError.message);
    }
  }

  async logToSupabase(errorInfo) {
    try {
      // Only attempt if we're in a browser environment with supabaseClient
      if (typeof window !== 'undefined' && window.supabaseClient) {
        const { error } = await window.supabaseClient.supabase
          .from('error_logs')
          .insert([{
            error_id: errorInfo.id,
            timestamp: errorInfo.timestamp,
            message: errorInfo.message,
            stack: errorInfo.stack,
            severity: errorInfo.severity,
            context: errorInfo.context,
            environment: errorInfo.environment,
            user_agent: errorInfo.userAgent,
            url: errorInfo.url
          }]);

        if (error && error.code !== '42P01') { // Ignore table doesn't exist error
          console.warn('⚠️ Failed to log to Supabase:', error.message);
        }
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase logging failed:', supabaseError.message);
    }
  }

  updateErrorStats(errorInfo) {
    const key = `${errorInfo.name}:${errorInfo.message}`;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  addToHistory(errorInfo) {
    this.errorHistory.unshift(errorInfo);
    
    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  // Wrapper for API routes
  wrapApiRoute(handler) {
    return async (req, res) => {
      try {
        return await handler(req, res);
      } catch (error) {
        await this.logError(error, {
          type: 'api_error',
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent']
        });

        // Return user-friendly error response
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again later.',
            errorId: this.generateErrorId()
          });
        }
      }
    };
  }

  // Wrapper for async functions
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logError(error, {
          type: 'async_function_error',
          functionName: fn.name,
          ...context
        });
        throw error; // Re-throw to maintain original behavior
      }
    };
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      recentErrors: this.errorHistory.slice(0, 10),
      errorCounts: Object.fromEntries(this.errorCounts),
      topErrors: [...this.errorCounts.entries()]
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    };

    return stats;
  }

  // Clear error history (useful for testing)
  clearHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  // Health check
  getHealthStatus() {
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - new Date(error.timestamp).getTime() < 300000 // 5 minutes
    );

    const fatalErrors = recentErrors.filter(error => error.severity === 'fatal');
    const errorRate = recentErrors.length;

    return {
      status: fatalErrors.length > 0 ? 'critical' : errorRate > 10 ? 'warning' : 'healthy',
      recentErrorCount: recentErrors.length,
      fatalErrorCount: fatalErrors.length,
      sentryEnabled: this.sentryEnabled,
      lastError: this.errorHistory[0] || null
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export the main logging function and utilities
export const logError = (error, context) => errorHandler.logError(error, context);
export const wrapApiRoute = (handler) => errorHandler.wrapApiRoute(handler);
export const wrapAsync = (fn, context) => errorHandler.wrapAsync(fn, context);
export const getErrorStats = () => errorHandler.getErrorStats();
export const getHealthStatus = () => errorHandler.getHealthStatus();

export default errorHandler;