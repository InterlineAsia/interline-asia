// Fallback Handler - Graceful degradation when services are down
// Provides user-friendly error messages and fallback responses

/**
 * Check if error is a Supabase connection issue
 */
function isSupabaseDown(error) {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';
  
  // Common Supabase connection error patterns
  const supabaseErrorPatterns = [
    'fetch failed',
    'network error',
    'connection refused',
    'timeout',
    'econnrefused',
    'enotfound',
    'supabase',
    'postgrest',
    'connection reset',
    'socket hang up'
  ];
  
  return supabaseErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Check if error is a general service unavailable issue
 */
function isServiceUnavailable(error, statusCode) {
  if (statusCode >= 500 && statusCode <= 599) return true;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const serviceErrorPatterns = [
    'service unavailable',
    'internal server error',
    'bad gateway',
    'gateway timeout',
    'temporarily unavailable'
  ];
  
  return serviceErrorPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Generate user-friendly error response
 */
function generateFallbackResponse(error, context = {}) {
  const { endpoint, operation } = context;
  
  if (isSupabaseDown(error)) {
    return {
      error: 'Service Temporarily Unavailable',
      message: 'Our booking system is currently experiencing technical difficulties. Please try again in a few minutes.',
      userMessage: 'We\'re experiencing temporary technical issues. Your request has been noted and we\'ll process it as soon as possible.',
      code: 'SERVICE_UNAVAILABLE',
      retryAfter: 300, // 5 minutes
      fallbackAction: getFallbackAction(operation),
      timestamp: new Date().toISOString()
    };
  }
  
  if (isServiceUnavailable(error, context.statusCode)) {
    return {
      error: 'System Maintenance',
      message: 'Our systems are currently undergoing maintenance. Please try again shortly.',
      userMessage: 'We\'re performing system maintenance to improve your experience. Please try again in a few minutes.',
      code: 'MAINTENANCE_MODE',
      retryAfter: 180, // 3 minutes
      fallbackAction: getFallbackAction(operation),
      timestamp: new Date().toISOString()
    };
  }
  
  // Generic fallback for unknown errors
  return {
    error: 'Temporary Issue',
    message: 'We\'re experiencing a temporary issue processing your request.',
    userMessage: 'Something went wrong on our end. Please try again, and if the problem persists, contact our support team.',
    code: 'TEMPORARY_ERROR',
    retryAfter: 60, // 1 minute
    fallbackAction: getFallbackAction(operation),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get fallback action suggestions based on operation
 */
function getFallbackAction(operation) {
  const fallbackActions = {
    quote: {
      suggestion: 'Email us directly at reservations@interlinetravel.com.au with your cruise preferences',
      alternativeContact: 'reservations@interlinetravel.com.au',
      phone: '+61 (0)2 9299 0777'
    },
    booking: {
      suggestion: 'Please call us directly to complete your booking',
      alternativeContact: 'reservations@interlinetravel.com.au',
      phone: '+61 (0)2 9299 0777',
      urgent: true
    },
    general: {
      suggestion: 'Please contact our support team for assistance',
      alternativeContact: 'admin@interlineasia.com',
      phone: '+61 (0)2 9299 0777'
    }
  };
  
  return fallbackActions[operation] || fallbackActions.general;
}

/**
 * Middleware to handle fallback responses
 */
function fallbackMiddleware(operation = 'general') {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    
    const fallbackResponse = generateFallbackResponse(error, {
      endpoint: req.url,
      operation,
      statusCode: res.statusCode
    });
    
    // Log the fallback response
    console.error(`FALLBACK: ${operation} operation failed, providing fallback response:`, {
      error: error.message,
      endpoint: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    });
    
    // Set appropriate status code
    const statusCode = fallbackResponse.code === 'SERVICE_UNAVAILABLE' ? 503 : 500;
    
    res.status(statusCode).json(fallbackResponse);
  };
}

/**
 * Wrap async functions with fallback handling
 */
function withFallback(asyncFn, operation = 'general') {
  return async (req, res, next) => {
    try {
      await asyncFn(req, res, next);
    } catch (error) {
      const fallbackResponse = generateFallbackResponse(error, {
        endpoint: req.url,
        operation
      });
      
      console.error(`FALLBACK: ${operation} operation failed:`, error);
      
      const statusCode = fallbackResponse.code === 'SERVICE_UNAVAILABLE' ? 503 : 500;
      res.status(statusCode).json(fallbackResponse);
    }
  };
}

/**
 * Health check for external services
 */
async function checkServiceHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  // Check Supabase (basic connectivity)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        timeout: 5000
      });
      health.services.supabase = {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - health.timestamp
      };
    }
  } catch (error) {
    health.services.supabase = {
      status: 'down',
      error: error.message
    };
  }
  
  // Check Brevo email service
  try {
    if (process.env.BREVO_API_KEY) {
      const response = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': process.env.BREVO_API_KEY
        },
        timeout: 5000
      });
      health.services.brevo = {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - health.timestamp
      };
    }
  } catch (error) {
    health.services.brevo = {
      status: 'down',
      error: error.message
    };
  }
  
  return health;
}

module.exports = {
  generateFallbackResponse,
  fallbackMiddleware,
  withFallback,
  isSupabaseDown,
  isServiceUnavailable,
  checkServiceHealth
};