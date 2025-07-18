// Enhanced Analytics - Safe conversion tracking and insights
// Only tracks data, doesn't modify functionality

class EnhancedAnalytics {
  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0
    };
    
    this.init();
  }

  init() {
    // Only initialize if analytics is available
    if (typeof gtag === 'undefined') {
      return;
    }

    this.setupConversionTracking();
    this.setupUserBehaviorTracking();
    this.setupPerformanceTracking();
    this.setupErrorTracking();
    this.setupEngagementTracking();
  }

  // Track conversion funnel
  setupConversionTracking() {
    // Track page views with funnel context
    this.trackPageView();
    
    // Track form interactions
    this.trackFormInteractions();
    
    // Track booking funnel
    this.trackBookingFunnel();
    
    // Track quote requests
    this.trackQuoteRequests();
  }

  // Track current page view with context
  trackPageView() {
    const page = window.location.pathname;
    const title = document.title;
    
    // Determine page type for funnel analysis
    let pageType = 'other';
    if (page === '/' || page === '/index.html') pageType = 'home';
    else if (page.includes('deals')) pageType = 'deals';
    else if (page.includes('deal-details')) pageType = 'deal_details';
    else if (page.includes('quote')) pageType = 'quote';
    else if (page.includes('booking')) pageType = 'booking';
    else if (page.includes('login')) pageType = 'login';
    else if (page.includes('signup')) pageType = 'signup';

    gtag('event', 'page_view', {
      page_title: title,
      page_location: window.location.href,
      page_type: pageType,
      user_type: this.getUserType()
    });

    this.sessionData.pageViews++;
  }

  // Track form interactions for conversion optimization
  trackFormInteractions() {
    // Track form starts
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input, textarea, select')) {
        const form = e.target.closest('form');
        if (form && !form.dataset.tracked) {
          form.dataset.tracked = 'true';
          
          const formType = this.getFormType(form);
          gtag('event', 'form_start', {
            event_category: 'engagement',
            event_label: formType,
            form_id: form.id || 'unknown'
          });
        }
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const formType = this.getFormType(form);
      
      gtag('event', 'form_submit', {
        event_category: 'conversion',
        event_label: formType,
        form_id: form.id || 'unknown'
      });
    });

    // Track form abandonment
    this.trackFormAbandonment();
  }

  // Track booking funnel steps
  trackBookingFunnel() {
    // Track when user views deal details
    if (window.location.pathname.includes('deal-details')) {
      const urlParams = new URLSearchParams(window.location.search);
      const dealId = urlParams.get('id');
      
      gtag('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: 'cruise_deal',
        item_id: dealId || 'unknown'
      });
    }

    // Track quote button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quote-btn, [data-action="quote"]')) {
        gtag('event', 'begin_checkout', {
          event_category: 'ecommerce',
          event_label: 'quote_request'
        });
      }
    });

    // Track booking button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.book-btn, [data-action="book"]')) {
        gtag('event', 'add_to_cart', {
          event_category: 'ecommerce',
          event_label: 'booking_intent'
        });
      }
    });
  }

  // Track quote requests
  trackQuoteRequests() {
    // Track quote form completion
    if (window.location.pathname.includes('quote')) {
      gtag('event', 'generate_lead', {
        event_category: 'conversion',
        event_label: 'quote_form_view'
      });
    }
  }

  // Track user behavior patterns
  setupUserBehaviorTracking() {
    // Track scroll depth
    this.trackScrollDepth();
    
    // Track time on page
    this.trackTimeOnPage();
    
    // Track click patterns
    this.trackClickPatterns();
    
    // Track search behavior
    this.trackSearchBehavior();
  }

  // Track scroll depth for engagement measurement
  trackScrollDepth() {
    const scrollDepths = [25, 50, 75, 90];
    const tracked = new Set();
    
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !tracked.has(depth)) {
          tracked.add(depth);
          
          gtag('event', 'scroll', {
            event_category: 'engagement',
            event_label: `${depth}%`,
            value: depth
          });
        }
      });
    }, { passive: true });
  }

  // Track time spent on page
  trackTimeOnPage() {
    const startTime = Date.now();
    
    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      gtag('event', 'timing_complete', {
        name: 'page_engagement',
        value: timeSpent
      });
    });

    // Track engagement milestones
    [30, 60, 120, 300].forEach(seconds => {
      setTimeout(() => {
        gtag('event', 'engagement_time', {
          event_category: 'engagement',
          event_label: `${seconds}s`,
          value: seconds
        });
      }, seconds * 1000);
    });
  }

  // Track click patterns for UX optimization
  trackClickPatterns() {
    document.addEventListener('click', (e) => {
      const element = e.target;
      
      // Track navigation clicks
      if (element.matches('a[href], .nav-link')) {
        gtag('event', 'click', {
          event_category: 'navigation',
          event_label: element.textContent?.trim() || element.href,
          link_url: element.href
        });
      }
      
      // Track button clicks
      if (element.matches('button, .btn')) {
        gtag('event', 'click', {
          event_category: 'interaction',
          event_label: element.textContent?.trim() || element.className,
          button_type: element.type || 'button'
        });
      }
      
      // Track deal card clicks
      if (element.closest('.deal-card, .cruise-card')) {
        gtag('event', 'select_content', {
          event_category: 'engagement',
          event_label: 'deal_card',
          content_type: 'cruise_deal'
        });
      }
      
      this.sessionData.interactions++;
    });
  }

  // Track search behavior
  trackSearchBehavior() {
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
    
    searchInputs.forEach(input => {
      let searchTimeout;
      
      input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.trim();
          
          if (query.length >= 3) {
            gtag('event', 'search', {
              event_category: 'engagement',
              search_term: query,
              search_length: query.length
            });
          }
        }, 1000);
      });
    });
  }

  // Track performance metrics
  setupPerformanceTracking() {
    // Already handled by performance-optimizer.js
    // This just adds conversion-specific performance tracking
    
    window.addEventListener('load', () => {
      // Track if page loaded successfully
      gtag('event', 'page_load_success', {
        event_category: 'performance',
        page_type: this.getPageType()
      });
    });
  }

  // Track errors for debugging
  setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (e) => {
      gtag('event', 'exception', {
        description: e.message,
        fatal: false,
        error_type: 'javascript'
      });
      
      this.sessionData.errors++;
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      gtag('event', 'exception', {
        description: e.reason?.message || 'Unhandled promise rejection',
        fatal: false,
        error_type: 'promise'
      });
      
      this.sessionData.errors++;
    });
  }

  // Track user engagement metrics
  setupEngagementTracking() {
    // Track session quality on page unload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.sessionData.startTime;
      const engagementScore = this.calculateEngagementScore();
      
      gtag('event', 'session_end', {
        event_category: 'engagement',
        session_duration: Math.round(sessionDuration / 1000),
        page_views: this.sessionData.pageViews,
        interactions: this.sessionData.interactions,
        errors: this.sessionData.errors,
        engagement_score: engagementScore
      });
    });
  }

  // Helper methods
  getFormType(form) {
    if (form.action.includes('login')) return 'login';
    if (form.action.includes('signup')) return 'signup';
    if (form.action.includes('quote')) return 'quote';
    if (form.action.includes('booking')) return 'booking';
    if (form.classList.contains('search')) return 'search';
    return 'other';
  }

  getUserType() {
    // Determine if user is logged in
    if (window.supabaseClient?.currentUser) return 'logged_in';
    if (localStorage.getItem('currentUser')) return 'logged_in';
    return 'anonymous';
  }

  getPageType() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('deals')) return 'deals';
    if (path.includes('quote')) return 'quote';
    if (path.includes('booking')) return 'booking';
    return 'other';
  }

  calculateEngagementScore() {
    const duration = Date.now() - this.sessionData.startTime;
    const durationScore = Math.min(duration / 60000, 10); // Max 10 points for 1+ minutes
    const interactionScore = Math.min(this.sessionData.interactions / 5, 10); // Max 10 points for 5+ interactions
    const pageViewScore = Math.min(this.sessionData.pageViews * 2, 10); // Max 10 points for 5+ pages
    const errorPenalty = this.sessionData.errors * 2; // -2 points per error
    
    return Math.max(0, Math.round(durationScore + interactionScore + pageViewScore - errorPenalty));
  }

  // Track form abandonment
  trackFormAbandonment() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      let hasStarted = false;
      let hasCompleted = false;
      
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          if (!hasStarted) {
            hasStarted = true;
            
            // Track abandonment after 30 seconds of inactivity
            setTimeout(() => {
              if (hasStarted && !hasCompleted && document.contains(form)) {
                gtag('event', 'form_abandon', {
                  event_category: 'conversion',
                  event_label: this.getFormType(form),
                  form_id: form.id || 'unknown'
                });
              }
            }, 30000);
          }
        });
      });
      
      form.addEventListener('submit', () => {
        hasCompleted = true;
      });
    });
  }

  // Public API for manual tracking
  trackCustomEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }

  trackConversion(conversionType, value = null) {
    const eventData = {
      event_category: 'conversion',
      event_label: conversionType
    };
    
    if (value !== null) {
      eventData.value = value;
    }
    
    this.trackCustomEvent('conversion', eventData);
  }
}

// Initialize enhanced analytics
if (typeof gtag !== 'undefined' && !window.enhancedAnalytics) {
  window.enhancedAnalytics = new EnhancedAnalytics();
}