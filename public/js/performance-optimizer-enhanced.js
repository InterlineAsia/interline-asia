// Enhanced Performance Optimizer - Safe performance improvements
// Only additive optimizations, no breaking changes

class EnhancedPerformanceOptimizer {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.optimize());
    } else {
      this.optimize();
    }
    
    this.initialized = true;
  }

  optimize() {
    // Only run optimizations that are safe and additive
    this.addResourceHints();
    this.optimizeImages();
    this.preloadCriticalResources();
    this.setupIntersectionObserver();
    this.optimizeFonts();
    this.addPerformanceMonitoring();
    this.setupImageCompression();
    this.optimizeCSS();
  }

  // Add resource hints for better performance
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
      { rel: 'dns-prefetch', href: '//nxreyyxbuwxjfmtvdkji.supabase.co' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
      { rel: 'dns-prefetch', href: '//www.googletagmanager.com' }
    ];

    hints.forEach(hint => {
      // Only add if not already present
      const existing = document.querySelector(`link[href="${hint.href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
        document.head.appendChild(link);
      }
    });
  }

  // Enhanced image optimization
  optimizeImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // Mark as optimized to avoid double processing
      img.dataset.optimized = 'true';
      
      // Add loading="lazy" if not already present and not above fold
      if (!img.hasAttribute('loading') && !this.isAboveFold(img)) {
        img.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }
      
      // Add proper sizing attributes if missing
      if (!img.width && !img.height && !img.style.width && !img.style.height) {
        // Prevent layout shift by setting aspect ratio
        img.style.aspectRatio = 'auto';
      }
      
      // Add error handling with better fallback
      if (!img.onerror) {
        img.onerror = () => this.handleImageError(img);
      }
      
      // Optimize image loading based on connection
      this.optimizeImageForConnection(img);
    });
  }

  // Handle image loading errors gracefully
  handleImageError(img) {
    if (!img.dataset.fallbackApplied) {
      img.dataset.fallbackApplied = 'true';
      
      // Create a better fallback image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width || 300;
      canvas.height = img.height || 200;
      
      // Draw placeholder
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image unavailable', canvas.width / 2, canvas.height / 2);
      
      img.src = canvas.toDataURL();
      img.alt = 'Image not available';
    }
  }

  // Optimize images based on network connection
  optimizeImageForConnection(img) {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // For slow connections, add extra lazy loading buffer
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        img.loading = 'lazy';
        // Increase intersection observer margin for slow connections
        if (img.dataset.lazyMargin !== 'set') {
          img.dataset.lazyMargin = 'set';
          img.style.willChange = 'auto'; // Reduce memory usage
        }
      }
    }
  }

  // Check if element is above the fold
  isAboveFold(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  // Preload critical resources intelligently
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/css/main.css', as: 'style' },
      { href: '/css/mobile-enhancements.css', as: 'style' },
      { href: '/js/deals-loader-unified.js', as: 'script' },
      { href: '/config.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      // Check if resource exists before preloading
      fetch(resource.href, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            const existing = document.querySelector(`link[href="${resource.href}"][rel="preload"]`);
            if (!existing) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.href = resource.href;
              link.as = resource.as;
              document.head.appendChild(link);
            }
          }
        })
        .catch(() => {
          // Silently fail if resource doesn't exist
        });
    });
  }

  // Setup enhanced intersection observer
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    // Different margins based on connection speed
    let rootMargin = '50px';
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        rootMargin = '100px'; // Load earlier for slow connections
      } else if (connection.effectiveType === '4g') {
        rootMargin = '25px'; // Load later for fast connections
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Trigger lazy loading
          this.triggerLazyLoad(element);
          
          // Track visibility for analytics
          this.trackElementVisibility(element);
          
          // Unobserve after loading
          observer.unobserve(element);
        }
      });
    }, { rootMargin });

    // Observe important elements
    const elementsToObserve = document.querySelectorAll(
      '.deal-card, .cruise-card, .booking-form, .quote-form, [data-lazy], img[loading="lazy"]'
    );
    
    elementsToObserve.forEach(el => observer.observe(el));
  }

  // Enhanced lazy loading trigger
  triggerLazyLoad(element) {
    // Load any data-src images within the element
    const lazyImages = element.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        
        // Add fade-in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        img.onload = () => {
          img.style.opacity = '1';
        };
      }
    });

    // Load any lazy content
    if (element.dataset.lazy && !element.dataset.loaded) {
      element.dataset.loaded = 'true';
      element.dispatchEvent(new CustomEvent('lazyload'));
    }
  }

  // Track element visibility for analytics
  trackElementVisibility(element) {
    if (window.enhancedAnalytics && element.dataset.trackView) {
      window.enhancedAnalytics.trackCustomEvent('view_item', {
        event_category: 'engagement',
        event_label: element.dataset.trackView
      });
    }
  }

  // Enhanced font optimization
  optimizeFonts() {
    // Add font-display: swap to improve loading performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
      
      /* Ensure text remains visible during webfont load */
      .font-loading {
        font-display: swap;
      }
      
      /* Optimize font rendering */
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);

    // Preload critical fonts
    const fontPreloads = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
    ];

    fontPreloads.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'style';
      link.onload = function() { this.rel = 'stylesheet'; };
      document.head.appendChild(link);
    });
  }

  // Setup image compression hints
  setupImageCompression() {
    // Add compression hints for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add compression hints
      if (!img.dataset.compressionOptimized) {
        img.dataset.compressionOptimized = 'true';
        
        // For large images, suggest WebP format if supported
        if ('createImageBitmap' in window && img.src && !img.src.includes('.webp')) {
          this.suggestWebPFormat(img);
        }
      }
    });
  }

  // Suggest WebP format for better compression
  suggestWebPFormat(img) {
    // Check WebP support
    const webpSupported = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;
    
    if (webpSupported && img.src.match(/\.(jpg|jpeg|png)$/i)) {
      // Log suggestion for future optimization
      if (window.enhancedAnalytics) {
        window.enhancedAnalytics.trackCustomEvent('webp_opportunity', {
          event_category: 'performance',
          image_src: img.src
        });
      }
    }
  }

  // Optimize CSS delivery
  optimizeCSS() {
    // Add critical CSS inlining for above-the-fold content
    const criticalCSS = `
      /* Critical above-the-fold styles */
      body { margin: 0; font-family: Inter, sans-serif; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      .loading { display: flex; align-items: center; justify-content: center; min-height: 200px; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);

    // Load non-critical CSS asynchronously
    this.loadNonCriticalCSS();
  }

  // Load non-critical CSS asynchronously
  loadNonCriticalCSS() {
    const nonCriticalCSS = [
      '/css/mobile-enhancements.css'
    ];

    nonCriticalCSS.forEach(cssFile => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = cssFile;
      link.as = 'style';
      link.onload = function() { 
        this.rel = 'stylesheet';
        this.onload = null;
      };
      document.head.appendChild(link);
    });
  }

  // Enhanced performance monitoring
  addPerformanceMonitoring() {
    // Monitor Core Web Vitals with enhanced tracking
    this.monitorCoreWebVitals();
    
    // Monitor resource loading with detailed metrics
    this.monitorResourceLoading();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network conditions
    this.monitorNetworkConditions();
  }

  // Enhanced Core Web Vitals monitoring
  monitorCoreWebVitals() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (window.enhancedAnalytics) {
            window.enhancedAnalytics.trackCustomEvent('web_vital', {
              event_category: 'performance',
              event_label: 'LCP',
              value: Math.round(lastEntry.startTime),
              lcp_element: lastEntry.element?.tagName || 'unknown'
            });
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Silently fail if not supported
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          if (clsValue > 0 && window.enhancedAnalytics) {
            window.enhancedAnalytics.trackCustomEvent('web_vital', {
              event_category: 'performance',
              event_label: 'CLS',
              value: Math.round(clsValue * 1000) // Convert to milliseconds
            });
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Silently fail if not supported
      }
    }
  }

  // Monitor resource loading with detailed metrics
  monitorResourceLoading() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const resourceData = performance.getEntriesByType('resource');
        
        if (perfData && window.enhancedAnalytics) {
          // Track detailed timing metrics
          const metrics = {
            dns_lookup: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp_connect: perfData.connectEnd - perfData.connectStart,
            request_response: perfData.responseEnd - perfData.requestStart,
            dom_processing: perfData.domContentLoadedEventEnd - perfData.responseEnd,
            resource_count: resourceData.length
          };
          
          Object.entries(metrics).forEach(([metric, value]) => {
            window.enhancedAnalytics.trackCustomEvent('performance_detail', {
              event_category: 'performance',
              event_label: metric,
              value: Math.round(value)
            });
          });
        }
      }, 1000);
    });
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        
        if (window.enhancedAnalytics) {
          window.enhancedAnalytics.trackCustomEvent('memory_usage', {
            event_category: 'performance',
            used_heap: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
            total_heap: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
            heap_limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Monitor network conditions
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (window.enhancedAnalytics) {
        window.enhancedAnalytics.trackCustomEvent('network_info', {
          event_category: 'performance',
          effective_type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      }
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        if (window.enhancedAnalytics) {
          window.enhancedAnalytics.trackCustomEvent('network_change', {
            event_category: 'performance',
            new_effective_type: connection.effectiveType,
            new_downlink: connection.downlink
          });
        }
      });
    }
  }

  // Public method to manually optimize new content
  optimizeNewContent(container) {
    if (container) {
      this.optimizeImages();
      this.setupIntersectionObserver();
    }
  }
}

// Initialize enhanced performance optimizer
if (!window.enhancedPerformanceOptimizer) {
  window.enhancedPerformanceOptimizer = new EnhancedPerformanceOptimizer();
}