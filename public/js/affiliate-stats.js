// Affiliate Click Statistics Dashboard
// For admin/debugging purposes

class AffiliateStats {
  constructor() {
    this.init();
  }

  init() {
    // Add stats to console for debugging
    if (window.location.search.includes('debug=affiliate')) {
      this.showDebugInfo();
    }
  }

  showDebugInfo() {
    console.log('🔍 Affiliate Tracking Debug Mode');
    
    // Show current stats
    setTimeout(() => {
      if (window.affiliateTracker) {
        const stats = window.affiliateTracker.getStats();
        console.table(stats.byAffiliate);
        console.log('📊 Total clicks tracked:', stats.totalClicks);
        console.log('🕒 Recent clicks:', stats.recentClicks);
      }
    }, 1000);

    // Add debug panel to page
    this.createDebugPanel();
  }

  createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'affiliate-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #000;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    panel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">🔍 Affiliate Debug</div>
      <div id="debug-stats">Loading...</div>
      <button onclick="affiliateStats.refreshStats()" style="margin-top: 10px; padding: 5px 10px; background: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Refresh</button>
      <button onclick="affiliateStats.clearStats()" style="margin-left: 5px; padding: 5px 10px; background: #d32f2f; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Clear</button>
    `;

    document.body.appendChild(panel);

    // Update stats every 5 seconds
    this.refreshStats();
    setInterval(() => this.refreshStats(), 5000);
  }

  refreshStats() {
    const statsDiv = document.getElementById('debug-stats');
    if (!statsDiv) return;

    if (window.affiliateTracker) {
      const stats = window.affiliateTracker.getStats();
      
      let html = `<div>Total: ${stats.totalClicks}</div>`;
      
      Object.entries(stats.byAffiliate || {}).forEach(([affiliate, count]) => {
        html += `<div>${affiliate}: ${count}</div>`;
      });

      if (stats.recentClicks && stats.recentClicks.length > 0) {
        const latest = stats.recentClicks[stats.recentClicks.length - 1];
        html += `<div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">Latest: ${latest.value} (${new Date(latest.timestamp).toLocaleTimeString()})</div>`;
      }

      statsDiv.innerHTML = html;
    } else {
      statsDiv.innerHTML = 'Tracker not ready';
    }
  }

  clearStats() {
    if (confirm('Clear all affiliate click stats?')) {
      localStorage.removeItem('affiliate_clicks');
      this.refreshStats();
      console.log('🗑️ Affiliate stats cleared');
    }
  }

  // Test function to simulate clicks
  testTracking() {
    const testLinks = [
      { name: 'Trip.com', url: 'https://trip.tpk.mx/test' },
      { name: 'EKTA Insurance', url: 'https://ektatraveling.tpk.mx/test' },
      { name: 'Airalo eSIM', url: 'https://airalo.tpk.mx/test' }
    ];

    testLinks.forEach((link, index) => {
      setTimeout(() => {
        window.trackAffiliateClick(link.name, link.url);
        console.log(`🧪 Test click: ${link.name}`);
      }, index * 1000);
    });
  }
}

// Initialize stats
window.affiliateStats = new AffiliateStats();

// Add global test function
window.testAffiliateTracking = () => window.affiliateStats.testTracking();