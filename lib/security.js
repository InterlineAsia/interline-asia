// Security Enhancement System
// Provides CSRF protection, security headers, and audit logging

const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.csrfTokens = new Map();
    this.auditLog = [];
  }
  
  // CSRF Protection
  generateCSRFToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + (60 * 60 * 1000); // 1 hour
    
    this.csrfTokens.set(sessionId, {
      token,
      expiry,
      used: false
    });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }
  
  validateCSRFToken(sessionId, providedToken) {
    const tokenData = this.csrfTokens.get(sessionId);
    
    if (!tokenData) {
      this.logSecurityEvent('CSRF_TOKEN_NOT_FOUND', { sessionId });
      return false;
    }
    
    if (Date.now() > tokenData.expiry) {
      this.csrfTokens.delete(sessionId);
      this.logSecurityEvent('CSRF_TOKEN_EXPIRED', { sessionId });
      return false;
    }
    
    if (tokenData.used) {
      this.logSecurityEvent('CSRF_TOKEN_REUSE_ATTEMPT', { sessionId });
      return false;
    }
    
    if (tokenData.token !== providedToken) {
      this.logSecurityEvent('CSRF_TOKEN_MISMATCH', { sessionId });
      return false;
    }
    
    // Mark token as used (one-time use)
    tokenData.used = true;
    this.logSecurityEvent('CSRF_TOKEN_VALIDATED', { sessionId });
    
    return true;
  }
  
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
      if (now > tokenData.expiry) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }
  
  // Security Headers Middleware
  setSecurityHeaders(res) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://nxreyyxbuwxjfmtvdkji.supabase.co https://generativelanguage.googleapis.com",
      "frame-src https://challenges.cloudflare.com"
    ].join('; '));
    
    // HSTS (if HTTPS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()'
    ].join(', '));
  }
  
  // Input Sanitization
  sanitizeInput(input, type = 'string') {
    if (typeof input !== 'string') {
      return '';
    }
    
    switch (type) {
      case 'email':
        return input.toLowerCase().trim().replace(/[^\w@.-]/g, '');
      
      case 'phone':
        return input.replace(/[^\d+\-\s()]/g, '');
      
      case 'alphanumeric':
        return input.replace(/[^\w\s]/g, '');
      
      case 'html':
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      
      default:
        return input.trim().substring(0, 1000);
    }
  }
  
  // Rate Limiting with IP tracking
  createAdvancedRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;
    
    const requests = new Map();
    const suspiciousIPs = new Set();
    
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const now = Date.now();
      
      // Check if IP is flagged as suspicious
      if (suspiciousIPs.has(ip)) {
        this.logSecurityEvent('SUSPICIOUS_IP_BLOCKED', { ip, url: req.url });
        return res.status(429).json({
          error: 'Access temporarily restricted',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      if (!requests.has(ip)) {
        requests.set(ip, []);
      }
      
      const userRequests = requests.get(ip);
      const recentRequests = userRequests.filter(time => now - time < windowMs);
      
      if (recentRequests.length >= maxRequests) {
        // Flag IP as suspicious after multiple rate limit hits
        const rateLimitHits = userRequests.filter(time => now - time < windowMs * 4).length;
        if (rateLimitHits >= maxRequests * 2) {
          suspiciousIPs.add(ip);
          setTimeout(() => suspiciousIPs.delete(ip), windowMs * 4);
        }
        
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
          ip, 
          url: req.url, 
          requestCount: recentRequests.length 
        });
        
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      recentRequests.push(now);
      requests.set(ip, recentRequests);
      
      next();
    };
  }
  
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           'unknown';
  }
  
  // Audit Logging
  logSecurityEvent(eventType, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      severity: this.getEventSeverity(eventType)
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
    
    // Log to console with appropriate level
    const logLevel = logEntry.severity === 'high' ? 'error' : 
                    logEntry.severity === 'medium' ? 'warn' : 'info';
    
    console[logLevel]('SECURITY_EVENT:', logEntry);
    
    // Send to external monitoring if configured
    if (process.env.SECURITY_WEBHOOK_URL && logEntry.severity === 'high') {
      this.sendSecurityAlert(logEntry);
    }
  }
  
  getEventSeverity(eventType) {
    const highSeverityEvents = [
      'SUSPICIOUS_IP_BLOCKED',
      'CSRF_TOKEN_REUSE_ATTEMPT',
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT'
    ];
    
    const mediumSeverityEvents = [
      'RATE_LIMIT_EXCEEDED',
      'CSRF_TOKEN_MISMATCH',
      'INVALID_AUTH_ATTEMPT'
    ];
    
    if (highSeverityEvents.includes(eventType)) return 'high';
    if (mediumSeverityEvents.includes(eventType)) return 'medium';
    return 'low';
  }
  
  async sendSecurityAlert(logEntry) {
    try {
      // This would send to your security monitoring service
      console.log('SECURITY_ALERT:', logEntry);
      
      // Example: Send to webhook
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: 'Security Event',
            severity: logEntry.severity,
            event: logEntry
          })
        });
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
  
  // API Key Security
  validateAPIKey(providedKey, expectedKey) {
    if (!providedKey || !expectedKey) {
      this.logSecurityEvent('API_KEY_MISSING');
      return false;
    }
    
    // Use constant-time comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedKey);
    const expectedBuffer = Buffer.from(expectedKey);
    
    if (providedBuffer.length !== expectedBuffer.length) {
      this.logSecurityEvent('API_KEY_INVALID_LENGTH');
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    
    if (!isValid) {
      this.logSecurityEvent('API_KEY_MISMATCH');
    }
    
    return isValid;
  }
  
  // Generate secure session ID
  generateSecureSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;
    
    return {
      isValid: score >= 4,
      score: score,
      feedback: this.getPasswordFeedback(password, {
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
        minLength: password.length >= minLength
      })
    };
  }
  
  getPasswordFeedback(password, checks) {
    const feedback = [];
    
    if (!checks.minLength) feedback.push('Password must be at least 8 characters long');
    if (!checks.hasUpperCase) feedback.push('Add at least one uppercase letter');
    if (!checks.hasLowerCase) feedback.push('Add at least one lowercase letter');
    if (!checks.hasNumbers) feedback.push('Add at least one number');
    if (!checks.hasSpecialChar) feedback.push('Add at least one special character');
    
    return feedback;
  }
}

// Export singleton instance
const securityManager = new SecurityManager();
module.exports = { SecurityManager, securityManager };