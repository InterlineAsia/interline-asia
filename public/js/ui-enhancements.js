/* UI Enhancements v2 - JavaScript for Advanced Frontend Features */

(function() {
    'use strict';
    
    // ===========================================
    // STICKY NAVIGATION SCROLL EFFECTS
    // ===========================================
    
    function initStickyNavigation() {
        const mainNav = document.querySelector('.main-nav, .luxury-header');
        const toolsBar = document.querySelector('.luxury-tools-bar, .travel-tools-header');
        const body = document.body;
        
        if (!mainNav) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        function updateNavigation() {
            const scrollY = window.scrollY;
            const scrollThreshold = 50;
            
            // Add scrolled class for shadow effect
            if (scrollY > scrollThreshold) {
                mainNav.classList.add('scrolled');
                if (toolsBar) {
                    toolsBar.classList.add('scrolled');
                    body.classList.add('scrolled');
                }
            } else {
                mainNav.classList.remove('scrolled');
                if (toolsBar) {
                    toolsBar.classList.remove('scrolled');
                    body.classList.remove('scrolled');
                }
            }
            
            // Check if tools bar exists and add class to body
            if (toolsBar) {
                body.classList.add('has-tools-bar');
            }
            
            lastScrollY = scrollY;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateNavigation);
                ticking = true;
            }
        }
        
        // Throttled scroll listener
        window.addEventListener('scroll', requestTick, { passive: true });
        
        // Initial check
        updateNavigation();
    }
    
    // ===========================================
    // ENHANCED IMAGE LOADING
    // ===========================================
    
    function initLazyImageLoading() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Add loaded class when image loads
                        img.addEventListener('load', () => {
                            img.classList.add('loaded');
                        });
                        
                        // If image is already loaded (cached)
                        if (img.complete) {
                            img.classList.add('loaded');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                
                if (img.complete) {
                    img.classList.add('loaded');
                }
            });
        }
    }
    
    // ===========================================
    // ENHANCED CARD INTERACTIONS
    // ===========================================
    
    function initEnhancedCards() {
        const cards = document.querySelectorAll('.deal-card, .booking-card, .dashboard-card, .quote-card, .admin-card');
        
        cards.forEach(card => {
            card.classList.add('enhanced-card');
            
            // Add keyboard navigation support
            if (!card.hasAttribute('tabindex') && !card.querySelector('a, button')) {
                card.setAttribute('tabindex', '0');
            }
            
            // Enhanced focus handling
            card.addEventListener('focus', () => {
                card.classList.add('enhanced-focus');
            });
            
            card.addEventListener('blur', () => {
                card.classList.remove('enhanced-focus');
            });
        });
    }
    
    // ===========================================
    // BREADCRUMB NAVIGATION
    // ===========================================
    
    function initBreadcrumbs() {
        const breadcrumbContainer = document.querySelector('.breadcrumb-nav');
        if (!breadcrumbContainer) return;
        
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(segment => segment);
        
        // Generate breadcrumb structure
        const breadcrumbList = document.createElement('ol');
        
        // Home link
        const homeItem = document.createElement('li');
        homeItem.innerHTML = '<a href="/">Home</a>';
        breadcrumbList.appendChild(homeItem);
        
        // Path segments
        let currentUrl = '';
        pathSegments.forEach((segment, index) => {
            currentUrl += '/' + segment;
            const item = document.createElement('li');
            
            if (index < pathSegments.length - 1) {
                // Not the last item - make it a link
                const segmentName = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                item.innerHTML = `<span class="breadcrumb-separator">›</span><a href="${currentUrl}">${segmentName}</a>`;
            } else {
                // Last item - current page
                const segmentName = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                item.innerHTML = `<span class="breadcrumb-separator">›</span><span class="current">${segmentName}</span>`;
            }
            
            breadcrumbList.appendChild(item);
        });
        
        breadcrumbContainer.appendChild(breadcrumbList);
    }
    
    // ===========================================
    // INTERNAL LINK ENHANCEMENTS
    // ===========================================
    
    function initInternalLinks() {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="#"]');
        
        internalLinks.forEach(link => {
            // Skip if already has internal-link class
            if (link.classList.contains('internal-link')) return;
            
            // Skip navigation links and buttons
            if (link.closest('.nav-menu, .luxury-nav-links, .btn, button')) return;
            
            link.classList.add('internal-link');
            
            // Add icon for external-looking internal links
            if (link.href.includes('/')) {
                const icon = document.createElement('span');
                icon.className = 'internal-link-icon';
                icon.innerHTML = '→';
                link.appendChild(icon);
            }
        });
    }
    
    // ===========================================
    // PERFORMANCE OPTIMIZATIONS
    // ===========================================
    
    function initPerformanceOptimizations() {
        // Preload critical resources
        const criticalImages = document.querySelectorAll('img[data-preload="true"]');
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src;
            document.head.appendChild(link);
        });
        
        // Optimize font loading
        if ('fonts' in document) {
            document.fonts.ready.then(() => {
                document.body.classList.add('fonts-loaded');
            });
        }
    }
    
    // ===========================================
    // ACCESSIBILITY ENHANCEMENTS
    // ===========================================
    
    function initAccessibilityEnhancements() {
        // Enhanced focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Skip links functionality
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    // ===========================================
    // INITIALIZATION
    // ===========================================
    
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        try {
            initStickyNavigation();
            initLazyImageLoading();
            initEnhancedCards();
            initBreadcrumbs();
            initInternalLinks();
            initPerformanceOptimizations();
            initAccessibilityEnhancements();
            
            console.log('UI Enhancements v2 initialized successfully');
        } catch (error) {
            console.warn('UI Enhancements v2 initialization error:', error);
        }
    }
    
    // Start initialization
    init();
    
})();