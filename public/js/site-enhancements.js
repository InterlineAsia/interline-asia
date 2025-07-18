// Site Enhancements - Final polish and user experience improvements
// Integrates all the new systems and adds finishing touches

class SiteEnhancements {
  constructor() {
    this.initializeEnhancements();
    this.setupProgressiveWebApp();
    this.enhanceNavigation();
    this.addAccessibilityFeatures();
    this.setupPerformanceOptimizations();
  }

  // Initialize all enhancements
  initializeEnhancements() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.enhanceFormsWithValidation();
    this.addSmartSearch();
    this.setupOfflineSupport();
    this.enhanceImageLoading();
    this.addKeyboardShortcuts();
    this.setupAnalytics();
    
    console.log('✅ Site enhancements initialized');
  }

  // Progressive Web App features
  setupProgressiveWebApp() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered');
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          });
        })
        .catch(error => console.warn('Service Worker registration failed:', error));
    }

    // Add to home screen prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPrompt(deferredPrompt);
    });
  }

  // Show app update notification
  showUpdateAvailable() {
    if (window.showMessage) {
      window.showMessage(
        'A new version is available! <button onclick="window.location.reload()" style="margin-left: 8px; padding: 4px 8px; background: white; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer;">Update Now</button>',
        'info',
        0 // Don't auto-hide
      );
    }
  }

  // Show install app prompt
  showInstallPrompt(deferredPrompt) {
    // Only show on mobile or after user has visited multiple times
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0') + 1;
    localStorage.setItem('visitCount', visitCount.toString());

    if (visitCount >= 3 && window.showMessage) {
      window.showMessage(
        'Install Interline Asia app for faster access! <button onclick="window.siteEnhancements.installApp()" style="margin-left: 8px; padding: 4px 8px; background: white; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer;">Install</button>',
        'info',
        10000
      );
    }

    this.deferredPrompt = deferredPrompt;
  }

  // Install PWA
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installed');
      }
      
      this.deferredPrompt = null;
    }
  }

  // Enhance navigation with smart features
  enhanceNavigation() {
    // Add breadcrumb navigation
    this.addBreadcrumbs();
    
    // Add back button functionality
    this.enhanceBackButton();
    
    // Add page transition effects
    this.addPageTransitions();
    
    // Remember scroll position
    this.rememberScrollPosition();
  }

  // Add breadcrumb navigation
  addBreadcrumbs() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment);
    
    if (segments.length <= 1) return; // Don't show breadcrumbs on home page
    
    const breadcrumbContainer = document.createElement('nav');
    breadcrumbContainer.className = 'breadcrumbs';
    breadcrumbContainer.style.cssText = `
      padding: 1rem 2rem;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    `;
    
    let breadcrumbHTML = '<a href="/" style="color: #6b7280; text-decoration: none;">Home</a>';
    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      const isLast = index === segments.length - 1;
      const displayName = segment.replace(/-/g, ' ').replace(/\.html$/, '');
      const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      breadcrumbHTML += ' <span style="color: #d1d5db; margin: 0 8px;">/</span> ';
      
      if (isLast) {
        breadcrumbHTML += `<span style="color: #374151; font-weight: 500;">${capitalizedName}</span>`;
      } else {
        breadcrumbHTML += `<a href="${currentPath}" style="color: #6b7280; text-decoration: none;">${capitalizedName}</a>`;
      }
    });
    
    breadcrumbContainer.innerHTML = breadcrumbHTML;
    
    // Insert after header or at top of main content
    const header = document.querySelector('header');
    const main = document.querySelector('main') || document.body;
    
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(breadcrumbContainer, header.nextSibling);
    } else {
      main.insertBefore(breadcrumbContainer, main.firstChild);
    }
  }

  // Enhance forms with real-time validation
  enhanceFormsWithValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        // Add real-time validation
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
        
        // Add accessibility attributes
        if (input.required && !input.getAttribute('aria-required')) {
          input.setAttribute('aria-required', 'true');
        }
      });
      
      // Enhance form submission
      form.addEventListener('submit', (e) => this.handleFormSubmit(e, form));
    });
  }

  // Validate individual form field
  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value && !window.SecureConfig?.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
    
    // Password validation
    if (field.type === 'password' && value && value.length < 8) {
      isValid = false;
      errorMessage = 'Password must be at least 8 characters';
    }
    
    // File validation
    if (field.type === 'file' && field.files.length > 0) {
      const file = field.files[0];
      const maxSize = window.FILE_CONFIG?.maxSize || 5 * 1024 * 1024;
      const allowedTypes = window.FILE_CONFIG?.allowedTypes || [];
      
      if (file.size > maxSize) {
        isValid = false;
        errorMessage = `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
      } else if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        isValid = false;
        errorMessage = 'File type not supported';
      }
    }
    
    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  // Show field validation result
  showFieldValidation(field, isValid, errorMessage) {
    // Remove existing error
    this.clearFieldError(field);
    
    if (!isValid) {
      field.classList.add('field-error');
      field.style.borderColor = '#ef4444';
      
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error-message';
      errorEl.style.cssText = `
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
      errorEl.innerHTML = `<i class="ri-error-warning-line"></i>${errorMessage}`;
      
      field.parentNode.insertBefore(errorEl, field.nextSibling);
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorEl.id = `error-${Date.now()}`);
    } else {
      field.classList.remove('field-error');
      field.style.borderColor = '#10b981';
      field.setAttribute('aria-invalid', 'false');
    }
  }

  // Clear field error
  clearFieldError(field) {
    field.classList.remove('field-error');
    field.style.borderColor = '';
    field.removeAttribute('aria-invalid');
    
    const errorEl = field.parentNode.querySelector('.field-error-message');
    if (errorEl) {
      errorEl.remove();
    }
  }

  // Handle form submission with validation
  async handleFormSubmit(event, form) {
    event.preventDefault();
    
    // Validate all fields
    const inputs = form.querySelectorAll('input, textarea, select');
    let isFormValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });
    
    if (!isFormValid) {
      window.showMessage?.('Please fix the errors above', 'error');
      return;
    }
    
    // Check rate limiting
    const action = form.dataset.action || 'form_submit';
    const identifier = window.SecureConfig?.getCurrentUserId?.() || 'anonymous';
    
    if (window.SecureConfig?.checkRateLimit && !window.SecureConfig.checkRateLimit(action, identifier)) {
      window.showMessage?.('Too many attempts. Please wait before trying again.', 'error');
      return;
    }
    
    // Submit form with loading state
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    
    try {
      await window.loadingManager?.withLoading(
        () => this.submitForm(form),
        { type: 'button', element: submitBtn, message: 'Submitting...' }
      );
    } catch (error) {
      window.handleError?.(error, 'Form Submission', 'form');
    }
  }

  // Submit form (override this method for custom handling)
  async submitForm(form) {
    // Default form submission
    const formData = new FormData(form);
    const action = form.action || window.location.href;
    const method = form.method || 'POST';
    
    const response = await fetch(action, {
      method: method,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Form submission failed: ${response.status}`);
    }
    
    window.showMessage?.('Form submitted successfully!', 'success');
    form.reset();
  }

  // Add smart search functionality
  addSmartSearch() {
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
    
    searchInputs.forEach(input => {
      let searchTimeout;
      
      input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(e.target.value, input);
        }, 300); // Debounce search
      });
      
      // Add search suggestions
      this.addSearchSuggestions(input);
    });
  }

  // Perform search with smart features
  async performSearch(query, inputElement) {
    if (query.length < 2) return;
    
    try {
      // Sanitize input
      const sanitizedQuery = window.SecureConfig?.sanitizeInput?.(query) || query;
      
      // Perform search based on page context
      const results = await this.getSearchResults(sanitizedQuery);
      
      // Show search results
      this.displaySearchResults(results, inputElement);
      
    } catch (error) {
      console.warn('Search failed:', error);
    }
  }

  // Get search results based on context
  async getSearchResults(query) {
    // Override this method for page-specific search logic
    return [];
  }

  // Add accessibility features
  addAccessibilityFeatures() {
    // Add skip to main content link
    this.addSkipLink();
    
    // Enhance keyboard navigation
    this.enhanceKeyboardNavigation();
    
    // Add ARIA labels where missing
    this.addAriaLabels();
    
    // Add focus indicators
    this.addFocusIndicators();
  }

  // Add skip to main content link
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Add keyboard shortcuts
  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + H = Home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
      }
      
      // Alt + S = Search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape = Close modals/overlays
      if (e.key === 'Escape') {
        window.loadingManager?.hideAll?.();
        // Close any open modals
        const modals = document.querySelectorAll('.modal, .overlay');
        modals.forEach(modal => {
          if (modal.style.display !== 'none') {
            modal.style.display = 'none';
          }
        });
      }
    });
  }

  // Setup performance optimizations
  setupPerformanceOptimizations() {
    // Lazy load images
    this.setupLazyLoading();
    
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup resource hints
    this.addResourceHints();
  }

  // Setup lazy loading for images
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

  // Add resource hints for better performance
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
      { rel: 'preconnect', href: 'https://nxreyyxbuwxjfmtvdkji.supabase.co' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      document.head.appendChild(link);
    });
  }

  // Setup analytics and monitoring
  setupAnalytics() {
    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.trackInteractions();
    
    // Monitor performance
    this.monitorPerformance();
  }

  // Track page view
  trackPageView() {
    if (window.gtag) {
      window.gtag('config', 'G-FYGT92WCXC', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }

  // Track user interactions
  trackInteractions() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, .btn, a[href]')) {
        const element = e.target;
        const action = element.textContent?.trim() || 'click';
        const category = element.className || 'button';
        
        if (window.gtag) {
          window.gtag('event', 'click', {
            event_category: category,
            event_label: action
          });
        }
      }
    });
  }

  // Monitor performance
  monitorPerformance() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (window.gtag && perfData) {
          window.gtag('event', 'timing_complete', {
            name: 'page_load',
            value: Math.round(perfData.loadEventEnd - perfData.fetchStart)
          });
        }
      }, 0);
    });
  }
}

// Initialize site enhancements
window.siteEnhancements = new SiteEnhancements();

console.log('✅ Site Enhancements loaded');