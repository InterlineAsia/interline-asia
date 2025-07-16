// Frontend Enhancement System
// Provides loading states, offline support, and accessibility improvements

class AppEnhancements {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupLoadingStates();
    this.setupOfflineSupport();
    this.setupAccessibilityFeatures();
    this.setupPerformanceOptimizations();
  }
  
  // Loading States Management
  setupLoadingStates() {
    // Create global loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'global-loading';
    loadingOverlay.innerHTML = `
      <div class="loading-backdrop">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p class="loading-text">Loading...</p>
        </div>
      </div>
    `;
    
    const styles = document.createElement('style');
    styles.textContent = `
      #global-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: none;
      }
      
      .loading-backdrop {
        background: rgba(0, 0, 0, 0.7);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .loading-spinner {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        margin: 0;
        color: #374151;
        font-weight: 500;
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(loadingOverlay);
    
    // Global loading functions
    window.showLoading = (text = 'Loading...') => {
      const overlay = document.getElementById('global-loading');
      const textElement = overlay.querySelector('.loading-text');
      textElement.textContent = text;
      overlay.style.display = 'block';
    };
    
    window.hideLoading = () => {
      const overlay = document.getElementById('global-loading');
      overlay.style.display = 'none';
    };
    
    // Auto-hide loading after 30 seconds (safety)
    window.showLoadingWithTimeout = (text = 'Loading...', timeout = 30000) => {
      window.showLoading(text);
      setTimeout(() => {
        window.hideLoading();
      }, timeout);
    };
  }
  
  // Offline Support
  setupOfflineSupport() {
    // Check online status
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      const statusIndicator = document.getElementById('connection-status') || this.createConnectionStatus();
      
      if (isOnline) {
        statusIndicator.style.display = 'none';
      } else {
        statusIndicator.style.display = 'block';
        statusIndicator.innerHTML = `
          <div class="offline-banner">
            <i class="ri-wifi-off-line"></i>
            <span>You're offline. Some features may not work.</span>
          </div>
        `;
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Cache critical resources
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
  }
  
  createConnectionStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1000;
      display: none;
    `;
    
    const styles = document.createElement('style');
    styles.textContent = `
      .offline-banner {
        background: #ef4444;
        color: white;
        padding: 0.75rem 1rem;
        text-align: center;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(statusDiv);
    return statusDiv;
  }
  
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
  
  // Accessibility Features
  setupAccessibilityFeatures() {
    // Keyboard navigation enhancement
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
    
    // Focus management for modals
    this.setupFocusManagement();
    
    // Screen reader announcements
    this.setupScreenReaderSupport();
  }
  
  setupFocusManagement() {
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  setupScreenReaderSupport() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    // Global function to announce to screen readers
    window.announceToScreenReader = (message) => {
      const liveRegion = document.getElementById('live-region');
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    };
  }
  
  // Performance Optimizations
  setupPerformanceOptimizations() {
    // Lazy loading for images
    this.setupLazyLoading();
    
    // Debounced search
    this.setupDebouncedSearch();
    
    // Memory leak prevention
    this.setupMemoryManagement();
  }
  
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  setupDebouncedSearch() {
    window.debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
  }
  
  setupMemoryManagement() {
    // Clean up event listeners on page unload
    window.addEventListener('beforeunload', () => {
      // Remove any global event listeners
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });
  }
}

// Initialize enhancements when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AppEnhancements();
  });
} else {
  new AppEnhancements();
}