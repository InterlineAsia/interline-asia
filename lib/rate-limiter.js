// Rate Limiting Middleware for API endpoints
// Prevents abuse and DDoS attacks

const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req, res, next) => {
    const ip = getClientIP(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }

    // Get or create rate limit data for this IP
    let rateLimitData = rateLimitMap.get(ip);
    if (!rateLimitData || rateLimitData.resetTime < now) {
      rateLimitData = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now,
      };
      rateLimitMap.set(ip, rateLimitData);
    }

    // Check if request should be counted
    const shouldCount = !skipSuccessfulRequests || !skipFailedRequests;
    
    if (shouldCount) {
      rateLimitData.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - rateLimitData.count);
    const resetTime = Math.ceil(rateLimitData.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Check if rate limit exceeded
    if (rateLimitData.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((rateLimitData.resetTime - now) / 1000));
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000),
      });
    }

    // Continue to next middleware
    if (typeof next === 'function') {
      next();
    }
  };
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

// Predefined rate limiters for different endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
  message: 'Too many requests to this endpoint. Please try again in 15 minutes.',
});

export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes
  message: 'Rate limit exceeded. Please try again later.',
});

export const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes
  message: 'Too many requests. Please slow down.',
});