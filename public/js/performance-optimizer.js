// Performance Optimization for Interline Asia
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCriticalResourcePreloading();
        this.setupServiceWorker();
        this.monitorPerformance();
    }

    // Lazy loading for images and iframes
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src], iframe[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    // Optimize images with WebP support detection
    setupImageOptimization() {
        const supportsWebP = this.checkWebPSupport();
        if (supportsWebP) {
            document.documentElement.classList.add('webp-support');
        }
    }

    checkWebPSupport() {
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Preload critical resources based on page context
    setupCriticalResourcePreloading() {
        const currentPage = window.location.pathname;
        let criticalResources = [];

        // Only preload resources that will be used on the current page
        if (currentPage.includes('deals') || currentPage.includes('index')) {
            criticalResources.push('/js/cruise-helper-bot.js');
            criticalResources.push('/cruise-ship.png');
        }
        
        // Always preload main CSS if not already loaded
        if (!document.querySelector('link[href*="complete-redesign.css"]')) {
            criticalResources.push('/css/complete-redesign.css');
        }

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            
            if (resource.endsWith('.css')) {
                link.as = 'style';
            } else if (resource.endsWith('.js')) {
                link.as = 'script';
            } else if (resource.match(/\.(png|jpg|jpeg|webp)$/)) {
                link.as = 'image';
            }
            
            document.head.appendChild(link);
        });
    }

    // Setup service worker for caching
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // Monitor performance metrics
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Monitor First Input Delay
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Monitor Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((entryList) => {
                let clsValue = 0;
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                console.log('CLS:', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    // Optimize font loading
    optimizeFontLoading() {
        const fontFaces = [
            {
                family: 'Inter',
                src: 'url(https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900)',
                display: 'swap'
            },
            {
                family: 'Playfair Display',
                src: 'url(https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900)',
                display: 'swap'
            }
        ];

        fontFaces.forEach(font => {
            const fontFace = new FontFace(font.family, font.src, { display: font.display });
            fontFace.load().then(loadedFont => {
                document.fonts.add(loadedFont);
            });
        });
    }

    // Debounce utility for performance-sensitive events
    static debounce(func, wait) {
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

    // Throttle utility for performance-sensitive events
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceOptimizer();
});

// Export for use in other modules
window.PerformanceOptimizer = PerformanceOptimizer;