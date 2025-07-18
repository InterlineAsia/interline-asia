// Unified Error Handler - Centralized error management and user feedback
// Replaces scattered error handling throughout the site

class UnifiedErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.initializeGlobalErrorHandling();
    this.setupUserFeedback();
  }

  // Initialize global error handling
  initializeGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection', 'system');
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'JavaScript Error', 'system', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle fetch errors globally
    this.interceptFetch();
  }

  // Intercept fetch requests for automatic error handling
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          error.url = args[0];
          
          this.handleError(error, 'Network Error', 'api');
        }
        
        return response;
      } catch (error) {
        error.url = args[0];
        this.handleError(error, 'Network Error', 'api');
        throw error;
      }
    };
  }

  // Main error handling method
  handleError(error, context = 'Unknown', category = 'general', metadata = {}) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      context,
      category,
      metadata,
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId()
    };

    // Log error
    this.logError(errorInfo);

    // Show user-friendly message
    this.showUserFeedback(errorInfo);

    // Report to monitoring service (if available)
    this.reportError(errorInfo);

    // Handle specific error types
    this.handleSpecificError(errorInfo);

    return errorInfo.id;
  }

  // Handle specific error types with custom logic
  handleSpecificError(errorInfo) {
    switch (errorInfo.category) {
      case 'auth':
        this.handleAuthError(errorInfo);
        break;
      case 'api':
        this.handleApiError(errorInfo);
        break;
      case 'upload':
        this.handleUploadError(errorInfo);
        break;
      case 'payment':
        this.handlePaymentError(errorInfo);
        break;
      default:
        this.handleGenericError(errorInfo);
    }
  }

  // Authentication error handling
  handleAuthError(errorInfo) {
    if (errorInfo.message.includes('Invalid login') || errorInfo.message.includes('Unauthorized')) {
      this.showMessage('Please check your login credentials and try again.', 'error');
      
      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 3000);
    }
  }

  // API error handling with retry logic
  async handleApiError(errorInfo) {
    const url = errorInfo.metadata.url || errorInfo.url;
    const retryKey = `${url}_${errorInfo.context}`;
    
    const currentRetries = this.retryAttempts.get(retryKey) || 0;
    
    if (currentRetries < this.maxRetries && this.shouldRetry(errorInfo)) {
      this.retryAttempts.set(retryKey, currentRetries + 1);
      
      this.showMessage(`Request failed. Retrying... (${currentRetries + 1}/${this.maxRetries})`, 'warning');
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, currentRetries);
      await this.delay(delay);
      
      return true; // Indicate retry should happen
    } else {
      this.retryAttempts.delete(retryKey);
      
      if (errorInfo.message.includes('413')) {
        this.showMessage('File too large. Please reduce file size and try again.', 'error');
      } else if (errorInfo.message.includes('429')) {
        this.showMessage('Too many requests. Please wait a moment and try again.', 'error');
      } else if (errorInfo.message.includes('500')) {
        this.showMessage('Server error. Our team has been notified. Please try again later.', 'error');
      } else {
        this.showMessage('Request failed. Please check your connection and try again.', 'error');
      }
    }
    
    return false;
  }

  // Upload error handling
  handleUploadError(errorInfo) {
    if (errorInfo.message.includes('size')) {
      this.showMessage('File is too large. Maximum size is 10MB.', 'error');
    } else if (errorInfo.message.includes('type')) {
      this.showMessage('File type not supported. Please use PDF, PNG, or JPG files.', 'error');
    } else {
      this.showMessage('Upload failed. Please try again or contact support.', 'error');
    }
  }

  // Payment error handling
  handlePaymentError(errorInfo) {
    this.showMessage('Payment processing failed. Please check your payment details and try again.', 'error');
    
    // Log payment errors with high priority
    this.reportError({...errorInfo, priority: 'high'});
  }

  // Generic error handling
  handleGenericError(errorInfo) {
    this.showMessage('Something went wrong. Please try again or contact support if the problem persists.', 'error');
  }

  // Determine if error should be retried
  shouldRetry(errorInfo) {
    const retryableErrors = [
      'Network Error',
      'timeout',
      'ECONNRESET',
      'ENOTFOUND',
      '502',
      '503',
      '504'
    ];
    
    return retryableErrors.some(pattern => 
      errorInfo.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Setup user feedback system
  setupUserFeedback() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('error-notifications')) {
      const container = document.createElement('div');
      container.id = 'error-notifications';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
  }

  // Show user-friendly feedback
  showUserFeedback(errorInfo) {
    // Don't show system errors to users
    if (errorInfo.category === 'system' && !this.isDevelopment()) {
      return;
    }

    const message = this.getUserFriendlyMessage(errorInfo);
    const type = this.getMessageType(errorInfo);
    
    this.showMessage(message, type);
  }

  // Get user-friendly error message
  getUserFriendlyMessage(errorInfo) {
    const friendlyMessages = {
      'Network Error': 'Connection problem. Please check your internet and try again.',
      'Unauthorized': 'Please log in to continue.',
      'Forbidden': 'You don\'t have permission to access this resource.',
      'Not Found': 'The requested resource was not found.',
      'Internal Server Error': 'Server error. Our team has been notified.',
      'Bad Request': 'Invalid request. Please check your input and try again.',
      'Timeout': 'Request timed out. Please try again.',
      'Rate Limited': 'Too many requests. Please wait a moment and try again.'
    };

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(friendlyMessages)) {
      if (errorInfo.message.includes(pattern)) {
        return message;
      }
    }

    return 'Something went wrong. Please try again or contact support.';
  }

  // Get message type based on error
  getMessageType(errorInfo) {
    if (errorInfo.category === 'auth') return 'warning';
    if (errorInfo.message.includes('413') || errorInfo.message.includes('size')) return 'warning';
    if (errorInfo.message.includes('429')) return 'info';
    return 'error';
  }

  // Show notification message
  showMessage(message, type = 'info', duration = 5000) {
    const container = document.getElementById('error-notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${this.getTypeColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      transform: translateX(100%);
      opacity: 0;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="ri-${this.getTypeIcon(type)}" style="font-size: 18px;"></i>
        <span>${message}</span>
        <i class="ri-close-line" style="margin-left: auto; cursor: pointer; opacity: 0.7;"></i>
      </div>
    `;

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);

    // Auto remove
    const removeNotification = () => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    // Remove on click
    notification.addEventListener('click', removeNotification);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(removeNotification, duration);
    }
  }

  // Get color for message type
  getTypeColor(type) {
    const colors = {
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      success: '#10b981'
    };
    return colors[type] || colors.info;
  }

  // Get icon for message type
  getTypeIcon(type) {
    const icons = {
      error: 'error-warning-line',
      warning: 'alert-line',
      info: 'information-line',
      success: 'checkbox-circle-line'
    };
    return icons[type] || icons.info;
  }

  // Log error to internal log
  logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console log in development
    if (this.isDevelopment()) {
      console.error('Error logged:', errorInfo);
    }
  }

  // Report error to external monitoring service
  reportError(errorInfo) {
    // Report to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(new Error(errorInfo.message), {
        tags: {
          category: errorInfo.category,
          context: errorInfo.context
        },
        extra: errorInfo.metadata
      });
    }

    // Report to custom analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: errorInfo.category === 'system'
      });
    }
  }

  // Utility methods
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentUserId() {
    return window.supabaseClient?.currentUser?.id || 'anonymous';
  }

  isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname.includes('dev');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  getErrorLog() {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  // Wrapper for async operations with error handling
  async withErrorHandling(operation, context = 'Operation', category = 'general') {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context, category);
      throw error;
    }
  }
}

// Initialize global error handler
window.errorHandler = new UnifiedErrorHandler();

// Export for use in other modules
window.handleError = (error, context, category, metadata) => 
  window.errorHandler.handleError(error, context, category, metadata);

window.showMessage = (message, type, duration) => 
  window.errorHandler.showMessage(message, type, duration);

console.log('✅ Unified Error Handler initialized');