// Enhanced Rate Limiter - Abuse protection for public APIs
// Implements sliding window rate limiting with IP and user tracking

const rateLimitStore = new Map();

/**
 * Rate limiter configuration
 */
const RATE_LIMITS = {
  quote: { requests: 5, windowMs: 60000 }, // 5 requests per minute for quotes
  booking: { requests: 3, windowMs: 60000 }, // 3 requests per minute for bookings
  general: { requests: 10, windowMs: 60000 } // 10 requests per minute for other APIs
};

/**
 * Get client identifier (IP + User Agent for better tracking)
 */
function getClientId(req) {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = req.body?.userId || req.query?.userId || 'anonymous';
  
  // Create composite key for better tracking
  return `${ip}_${userId}_${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(clientId, limitType = 'general') {
  const now = Date.now();
  const limit = RATE_LIMITS[limitType];
  
  if (!limit) {
    console.warn(`Unknown rate limit type: ${limitType}`);
    return { allowed: true, remaining: 999 };
  }
  
  // Get or create client record
  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, {
      requests: [],
      blocked: false,
      blockUntil: 0
    });
  }
  
  const clientData = rateLimitStore.get(clientId);
  
  // Check if client is temporarily blocked
  if (clientData.blocked && now < clientData.blockUntil) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: clientData.blockUntil,
      reason: 'temporarily_blocked'
    };
  }
  
  // Remove old requests outside the window
  clientData.requests = clientData.requests.filter(
    timestamp => now - timestamp < limit.windowMs
  );
  
  // Check if limit exceeded
  if (clientData.requests.length >= limit.requests) {
    // Block client for additional time if they keep hitting limits
    clientData.blocked = true;
    clientData.blockUntil = now + (limit.windowMs * 2); // Block for 2x the window
    
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: clientData.blockUntil,
      reason: 'rate_limit_exceeded'
    };
  }
  
  // Add current request
  clientData.requests.push(now);
  clientData.blocked = false;
  
  return { 
    allowed: true, 
    remaining: limit.requests - clientData.requests.length,
    resetTime: now + limit.windowMs
  };
}

/**
 * Express middleware for rate limiting
 */
function rateLimitMiddleware(limitType = 'general') {
  return (req, res, next) => {
    try {
      const clientId = getClientId(req);
      const result = checkRateLimit(clientId, limitType);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', RATE_LIMITS[limitType].requests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      
      if (!result.allowed) {
        console.warn(`Rate limit exceeded for ${clientId} on ${limitType} endpoint`);
        
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait before making another request',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          type: result.reason
        });
      }
      
      // Log successful rate limit check
      console.log(`Rate limit OK: ${clientId} - ${result.remaining} remaining`);
      next();
      
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - don't block requests if rate limiter fails
      next();
    }
  };
}

/**
 * Clean up old entries periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = Math.max(...Object.values(RATE_LIMITS).map(l => l.windowMs)) * 3;
  
  for (const [clientId, data] of rateLimitStore.entries()) {
    const lastRequest = Math.max(...data.requests, data.blockUntil);
    if (now - lastRequest > maxAge) {
      rateLimitStore.delete(clientId);
    }
  }
  
  console.log(`Rate limiter cleanup: ${rateLimitStore.size} active clients`);
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

module.exports = {
  rateLimitMiddleware,
  checkRateLimit,
  getClientId,
  RATE_LIMITS
};