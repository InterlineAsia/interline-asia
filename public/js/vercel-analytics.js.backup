// Vercel Web Analytics Integration
// Lightweight, privacy-friendly analytics

(function() {
  'use strict';

  // Vercel Analytics configuration
  const VERCEL_ANALYTICS_CONFIG = {
    // Auto-track page views
    autoTrack: true,
    // Debug mode (set to false in production)
    debug: false
  };

  // Initialize Vercel Analytics
  function initVercelAnalytics() {
    // Check if we're on Vercel domain or localhost
    const isVercelDomain = window.location.hostname.includes('vercel.app') || 
                          window.location.hostname.includes('interlineasia.com') ||
                          window.location.hostname === 'localhost';

    if (!isVercelDomain) {
      console.log('ℹ️ Vercel Analytics: Not on Vercel domain, skipping initialization');
      return;
    }

    // Load Vercel Analytics script
    const script = document.createElement('script');
    script.src = 'https://va.vercel-scripts.com/v1/script.js';
    script.defer = true;
    script.onload = function() {
      console.log('✅ Vercel Analytics loaded');
      
      // Initialize analytics
      if (window.va) {
        // Track page view
        window.va('track', 'pageview');
        
        if (VERCEL_ANALYTICS_CONFIG.debug) {
          console.log('📊 Vercel Analytics: Page view tracked');
        }
      }
    };
    
    script.onerror = function() {
      console.log('❌ Vercel Analytics: Failed to load');
    };

    document.head.appendChild(script);
  }

  // Custom event tracking helper
  window.vaTrack = function(eventName, properties = {}) {
    if (window.va) {
      try {
        window.va('track', eventName, properties);
        
        if (VERCEL_ANALYTICS_CONFIG.debug) {
          console.log('📊 Vercel Analytics Event:', eventName, properties);
        }
      } catch (error) {
        console.error('Vercel Analytics tracking error:', error);
      }
    } else {
      console.log('📊 Analytics (fallback):', eventName, properties);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVercelAnalytics);
  } else {
    initVercelAnalytics();
  }

})();