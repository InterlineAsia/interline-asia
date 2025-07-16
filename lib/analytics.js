// Analytics & Performance Monitoring System
// Provides comprehensive tracking and performance insights

class AnalyticsManager {
  constructor() {
    this.events = [];
    this.performanceMetrics = new Map();
    this.userSessions = new Map();
    this.init();
  }
  
  init() {
    this.setupPerformanceMonitoring();
    this.setupUserTracking();
    this.setupErrorTracking();
  }
  
  // Performance Monitoring
  setupPerformanceMonitoring() {
    // Page load performance
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = this.getPagePerformanceData();
          this.trackEvent('page_performance', perfData);
        }, 0);
      });
    }
    
    // API response time tracking
    this.originalFetch = window.fetch;
    window.fetch = (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      return this.originalFetch(...args)
        .then(response => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.trackEvent('api_call', {
            url: url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: Math.round(duration),
            success: response.ok
          });
          
          return response;
        })
        .catch(error => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.trackEvent('api_error', {
            url: url,
            method: args[1]?.method || 'GET',
            duration: Math.round(duration),
            error: error.message
          });
          
          throw error;
        });
    };
  }
  
  getPagePerformanceData() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      page: window.location.pathname,
      loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize
    };
  }
  
  // User Behavior Tracking
  setupUserTracking() {
    // Session tracking
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    
    // Page views
    this.trackPageView();
    
    // User interactions
    this.setupInteractionTracking();
    
    // Session duration
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
    
    // Visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });
  }
  
  setupInteractionTracking() {
    // Click tracking
    document.addEventListener('click', (e) => {
      const element = e.target;
      const tagName = element.tagName.toLowerCase();
      
      // Track important clicks
      if (['button', 'a', 'input'].includes(tagName) || element.closest('[data-track]')) {
        this.trackEvent('click', {
          element: tagName,
          text: element.textContent?.substring(0, 50) || '',
          id: element.id || '',
          className: element.className || '',
          href: element.href || '',
          page: window.location.pathname
        });
      }
    });
    
    // Form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      this.trackEvent('form_submit', {
        formId: form.id || '',
        formAction: form.action || '',
        formMethod: form.method || 'GET',
        page: window.location.pathname
      });
    });
    
    // Scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', this.debounce(() => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90].includes(scrollDepth)) {
          this.trackEvent('scroll_depth', {
            depth: scrollDepth,
            page: window.location.pathname
          });
        }
      }
    }, 250));
  }
  
  // Error Tracking
  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack?.substring(0, 500) || '',
        page: window.location.pathname,
        userAgent: navigator.userAgent
      });
    });
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('promise_rejection', {
        reason: e.reason?.toString()?.substring(0, 500) || 'Unknown',
        page: window.location.pathname
      });
    });
    
    // Resource loading errors
    window.addEventListener('error', (e) => {
      if (e.target !== window) {
        this.trackEvent('resource_error', {
          type: e.target.tagName?.toLowerCase() || 'unknown',
          src: e.target.src || e.target.href || '',
          page: window.location.pathname
        });
      }
    }, true);
  }
  
  // Core Tracking Methods
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      }
    };
    
    this.events.push(event);
    
    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events.shift();
    }
    
    // Send to analytics service
    this.sendToAnalytics(event);
    
    // Log important events
    if (this.isImportantEvent(eventName)) {
      console.log('ANALYTICS:', eventName, properties);
    }
  }
  
  trackPageView() {
    this.trackEvent('page_view', {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
  }
  
  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStart;
    this.trackEvent('session_end', {
      duration: sessionDuration,
      pageViews: this.events.filter(e => e.name === 'page_view').length,
      interactions: this.events.filter(e => ['click', 'form_submit'].includes(e.name)).length
    });
  }
  
  // Business Metrics
  trackConversion(conversionType, value = null) {
    this.trackEvent('conversion', {
      type: conversionType,
      value: value,
      page: window.location.pathname
    });
  }
  
  trackBookingStep(step, cruiseId = null) {
    this.trackEvent('booking_funnel', {
      step: step,
      cruiseId: cruiseId,
      page: window.location.pathname
    });
  }
  
  trackSearchQuery(query, resultsCount = null) {
    this.trackEvent('search', {
      query: query.substring(0, 100),
      resultsCount: resultsCount,
      page: window.location.pathname
    });
  }
  
  // Performance Metrics
  measurePerformance(name, fn) {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.trackEvent('performance_measure', {
      name: name,
      duration: Math.round(endTime - startTime),
      page: window.location.pathname
    });
    
    return result;
  }
  
  async measureAsyncPerformance(name, asyncFn) {
    const startTime = performance.now();
    try {
      const result = await asyncFn();
      const endTime = performance.now();
      
      this.trackEvent('async_performance_measure', {
        name: name,
        duration: Math.round(endTime - startTime),
        success: true,
        page: window.location.pathname
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.trackEvent('async_performance_measure', {
        name: name,
        duration: Math.round(endTime - startTime),
        success: false,
        error: error.message,
        page: window.location.pathname
      });
      
      throw error;
    }
  }
  
  // Analytics Reporting
  generateReport() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.properties.timestamp > last24Hours);
    
    return {
      summary: {
        totalEvents: recentEvents.length,
        uniquePages: new Set(recentEvents.map(e => e.properties.page)).size,
        sessionDuration: now - this.sessionStart,
        errorCount: recentEvents.filter(e => e.name.includes('error')).length
      },
      topEvents: this.getTopEvents(recentEvents),
      performanceMetrics: this.getPerformanceMetrics(recentEvents),
      errorSummary: this.getErrorSummary(recentEvents)
    };
  }
  
  getTopEvents(events) {
    const eventCounts = {};
    events.forEach(e => {
      eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
    });
    
    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }
  
  getPerformanceMetrics(events) {
    const perfEvents = events.filter(e => e.name === 'page_performance');
    if (perfEvents.length === 0) return null;
    
    const loadTimes = perfEvents.map(e => e.properties.loadTime);
    return {
      averageLoadTime: Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length),
      minLoadTime: Math.min(...loadTimes),
      maxLoadTime: Math.max(...loadTimes)
    };
  }
  
  getErrorSummary(events) {
    const errorEvents = events.filter(e => e.name.includes('error'));
    const errorTypes = {};
    
    errorEvents.forEach(e => {
      errorTypes[e.name] = (errorTypes[e.name] || 0) + 1;
    });
    
    return errorTypes;
  }
  
  // Utility Methods
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  isImportantEvent(eventName) {
    return ['conversion', 'booking_funnel', 'javascript_error', 'api_error'].includes(eventName);
  }
  
  async sendToAnalytics(event) {
    // Send to your analytics service (Google Analytics, Mixpanel, etc.)
    try {
      // Example: Send to Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', event.name, event.properties);
      }
      
      // Example: Send to custom analytics endpoint
      if (process.env.ANALYTICS_ENDPOINT) {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.warn('Analytics sending failed:', error);
    }
  }
}

// Initialize analytics
const analytics = new AnalyticsManager();

// Global analytics functions
window.trackEvent = (name, properties) => analytics.trackEvent(name, properties);
window.trackConversion = (type, value) => analytics.trackConversion(type, value);
window.trackBookingStep = (step, cruiseId) => analytics.trackBookingStep(step, cruiseId);
window.trackSearchQuery = (query, count) => analytics.trackSearchQuery(query, count);

module.exports = { AnalyticsManager, analytics };