// Affiliate Link Click Tracker
// Privacy-friendly tracking using Vercel Analytics (no cookies, no personal data)

class AffiliateTracker {
  constructor() {
    this.isVercelAnalyticsAvailable = false;
    this.init();
  }

  init() {
    // Check if Vercel Analytics is available
    this.checkVercelAnalytics();
    
    // Initialize tracking on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.setupAffiliateTracking();
    });
  }

  checkVercelAnalytics() {
    // Check for Vercel Analytics (Web Analytics)
    if (typeof window !== 'undefined' && window.va) {
      this.isVercelAnalyticsAvailable = true;
      console.log('✅ Vercel Analytics detected');
    } else {
      console.log('ℹ️ Vercel Analytics not available - using console logging');
    }
  }

  /**
   * Track affiliate link click
   * @param {string} affiliateName - Name of the affiliate (e.g., "Trip.com")
   * @param {string} url - The affiliate URL being clicked
   */
  trackAffiliateClick(affiliateName, url) {
    const eventData = {
      name: 'Affiliate Click',
      value: affiliateName,
      url: url,
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    };

    // Track with Vercel Analytics if available
    if (this.isVercelAnalyticsAvailable && window.va) {
      try {
        window.va('track', 'Affiliate Click', {
          affiliate: affiliateName,
          url: url
        });
        console.log('📊 Vercel Analytics:', eventData);
      } catch (error) {
        console.error('Vercel Analytics error:', error);
        this.fallbackLogging(eventData);
      }
    } else {
      // Fallback to console logging
      this.fallbackLogging(eventData);
    }

    // Optional: Send to custom endpoint for additional tracking
    this.sendToCustomEndpoint(eventData);
  }

  fallbackLogging(eventData) {
    console.log('🔗 Affiliate Click Tracked:', eventData);
    
    // Store in localStorage for potential later analysis (optional)
    try {
      const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
      clicks.push(eventData);
      
      // Keep only last 100 clicks to avoid storage bloat
      if (clicks.length > 100) {
        clicks.splice(0, clicks.length - 100);
      }
      
      localStorage.setItem('affiliate_clicks', JSON.stringify(clicks));
    } catch (error) {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }

  async sendToCustomEndpoint(eventData) {
    // Optional: Send to your own analytics endpoint
    try {
      await fetch('/api/track-affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      // Silently fail - don't break user experience
    }
  }

  setupAffiliateTracking() {
    // Define affiliate mappings
    const affiliateMap = {
      'trip.tpk.mx': 'Trip.com',
      'kiwitaxi.tpk.mx': 'KiwiTaxi',
      'ektatraveling.tpk.mx': 'EKTA Insurance',
      'airalo.tpk.mx': 'Airalo eSIM',
      'getrentacar.tpk.mx': 'GetRentacar',
      'wise.com': 'WISE Currency'
    };

    // Find all affiliate links and add tracking
    document.querySelectorAll('a[href*="tpk.mx"], a[href*="wise.com"]').forEach(link => {
      const url = link.href;
      const domain = this.extractDomain(url);
      const affiliateName = affiliateMap[domain] || domain;

      // Add click tracking
      link.addEventListener('click', (event) => {
        this.trackAffiliateClick(affiliateName, url);
      });

      // Add visual indicator (optional)
      link.setAttribute('data-tracked', 'true');
    });

    console.log(`🎯 Affiliate tracking setup complete for ${document.querySelectorAll('a[data-tracked="true"]').length} links`);
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return url;
    }
  }

  // Public method to manually track clicks
  static track(affiliateName, url) {
    if (window.affiliateTracker) {
      window.affiliateTracker.trackAffiliateClick(affiliateName, url);
    } else {
      console.log('🔗 Manual track:', affiliateName, url);
    }
  }

  // Get tracking statistics (for debugging)
  getStats() {
    try {
      const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
      const stats = {};
      
      clicks.forEach(click => {
        stats[click.value] = (stats[click.value] || 0) + 1;
      });
      
      return {
        totalClicks: clicks.length,
        byAffiliate: stats,
        recentClicks: clicks.slice(-10)
      };
    } catch (error) {
      return { error: 'Unable to retrieve stats' };
    }
  }
}

// Initialize tracker
window.affiliateTracker = new AffiliateTracker();

// Export for manual use
window.trackAffiliateClick = (name, url) => AffiliateTracker.track(name, url);