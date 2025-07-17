// Interline Asia - Secure Configuration
// Environment-based configuration with fallbacks

class SecureConfig {
  constructor() {
    this.initializeConfig();
  }

  initializeConfig() {
    // Get configuration from environment or fallback to secure defaults
    this.supabaseUrl = this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    this.supabaseAnonKey = this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE';
    
    // Secure file upload configuration
    this.fileConfig = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
      maxFiles: 3
    };

    // Secure verification configuration
    this.verificationConfig = {
      passcode: this.getEnvVar('NEXT_PUBLIC_VERIFICATION_PASSCODE') || 'TRAVEL2025',
      minAge: 18,
      maxAttempts: 3,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    };

    // Admin configuration
    this.adminEmail = this.getEnvVar('NEXT_PUBLIC_ADMIN_EMAIL') || 'admin@interlineasia.com';
    
    // Rate limiting configuration
    this.rateLimits = {
      login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      signup: { attempts: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
      upload: { attempts: 10, window: 60 * 60 * 1000 } // 10 uploads per hour
    };

    // Security headers
    this.securityConfig = {
      csrfProtection: true,
      xssProtection: true,
      contentTypeNoSniff: true,
      frameOptions: 'DENY'
    };
  }

  getEnvVar(name) {
    // Check various environment variable sources
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
    if (typeof window !== 'undefined' && window.ENV) {
      return window.ENV[name];
    }
    return null;
  }

  // Secure token generation
  generateSecureToken() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Input sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Rate limiting check
  checkRateLimit(action, identifier) {
    const key = `rateLimit_${action}_${identifier}`;
    const now = Date.now();
    const limit = this.rateLimits[action];
    
    if (!limit) return true;

    let attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove old attempts outside the window
    attempts = attempts.filter(timestamp => now - timestamp < limit.window);
    
    if (attempts.length >= limit.attempts) {
      return false; // Rate limit exceeded
    }

    // Add current attempt
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));
    
    return true;
  }

  // Get configuration safely
  getConfig() {
    return {
      supabaseUrl: this.supabaseUrl,
      supabaseAnonKey: this.supabaseAnonKey,
      fileConfig: this.fileConfig,
      verificationConfig: this.verificationConfig,
      adminEmail: this.adminEmail,
      rateLimits: this.rateLimits,
      securityConfig: this.securityConfig
    };
  }
}

// Initialize secure configuration
const secureConfig = new SecureConfig();

// Export configuration safely
window.SUPABASE_URL = secureConfig.supabaseUrl;
window.SUPABASE_ANON_KEY = secureConfig.supabaseAnonKey;
window.FILE_CONFIG = secureConfig.fileConfig;
window.VERIFICATION_CONFIG = secureConfig.verificationConfig;
window.ADMIN_EMAIL = secureConfig.adminEmail;
window.SECURITY_CONFIG = secureConfig.securityConfig;

// Export utility functions
window.SecureConfig = secureConfig;