/**
 * UI Enhancements JavaScript
 * Handles scroll behavior, lazy loading, and other visual enhancements
 * Frontend-only - no backend logic modifications
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all enhancements
  initStickyNavigation();
  initScrollAnimations();
  enhanceImageLoading();
  setupBreadcrumbNavigation();
  
  console.log('UI Enhancements initialized');
});

/**
 * Makes navigation sticky on scroll with visual feedback
 */
function initStickyNavigation() {
  const nav = document.querySelector('.main-nav') || document.querySelector('.luxury-header');
  const toolsBar = document.querySelector('.luxury-tools-bar') || document.querySelector('.travel-tools-header');
  
  if (nav) {
    // Add appropriate body class based on tools bar presence
    if (toolsBar) {
      document.body.classList.add('has-tools-bar');
    }
    
    // Handle scroll events
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Add scrolled class when scrolling down
      if (scrollTop > 10) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      
      lastScrollTop = scrollTop;
    });
    
    console.log('Sticky navigation initialized');
  }
}

/**
 * Adds scroll animations to elements
 */
function initScrollAnimations() {
  // Find all elements with animation classes
  const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
  
  if (animatedElements.length > 0) {
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing after animation
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe each element
    animatedElements.forEach(element => {
      observer.observe(element);
    });
    
    console.log('Scroll animations initialized');
  }
}

/**
 * Enhances image loading with lazy loading and responsive handling
 */
function enhanceImageLoading() {
  // Find all images that don't already have loading="lazy"
  const images = document.querySelectorAll('img:not([loading])');
  
  images.forEach(img => {
    // Skip small images and logos
    const skipLazy = img.classList.contains('logo') || 
                    img.width < 100 || 
                    img.height < 100;
    
    if (!skipLazy) {
      img.setAttribute('loading', 'lazy');
      img.classList.add('js-lazy-load');
      
      // Add load event listener
      img.addEventListener('load', function() {
        this.classList.add('is-loaded');
      });
    }
  });
  
  console.log('Image loading enhancements applied');
}

/**
 * Sets up breadcrumb navigation based on page context
 */
function setupBreadcrumbNavigation() {
  // Only add breadcrumbs to specific pages
  const pagePath = window.location.pathname;
  const breadcrumbContainer = document.querySelector('.breadcrumb-nav');
  
  // If container exists, it's already set up
  if (breadcrumbContainer) return;
  
  // Pages that should have breadcrumbs
  const breadcrumbPages = [
    '/booking.html',
    '/quote.html',
    '/track-booking.html',
    '/deals.html',
    '/partners.html'
  ];
  
  // Check if current page should have breadcrumbs
  const shouldHaveBreadcrumbs = breadcrumbPages.some(page => pagePath.includes(page));
  
  if (shouldHaveBreadcrumbs) {
    createBreadcrumbs();
  }
}

/**
 * Creates breadcrumb navigation based on current page
 */
function createBreadcrumbs() {
  const pagePath = window.location.pathname;
  const pageTitle = document.title.split(' - ')[0] || 'Current Page';
  
  // Create breadcrumb container
  const breadcrumbNav = document.createElement('div');
  breadcrumbNav.className = 'breadcrumb-nav';
  
  // Always start with home
  breadcrumbNav.innerHTML = `
    <a href="/">Home</a>
    <span class="breadcrumb-separator">›</span>
  `;
  
  // Add intermediate paths based on current page
  if (pagePath.includes('/deals.html')) {
    breadcrumbNav.innerHTML += `<span>${pageTitle}</span>`;
  } 
  else if (pagePath.includes('/booking.html')) {
    breadcrumbNav.innerHTML += `
      <a href="/deals.html">Cruise Deals</a>
      <span class="breadcrumb-separator">›</span>
      <span>${pageTitle}</span>
    `;
  }
  else if (pagePath.includes('/quote.html')) {
    breadcrumbNav.innerHTML += `
      <a href="/deals.html">Cruise Deals</a>
      <span class="breadcrumb-separator">›</span>
      <span>${pageTitle}</span>
    `;
  }
  else if (pagePath.includes('/track-booking.html')) {
    breadcrumbNav.innerHTML += `
      <a href="/dashboard.html">Dashboard</a>
      <span class="breadcrumb-separator">›</span>
      <span>${pageTitle}</span>
    `;
  }
  else {
    breadcrumbNav.innerHTML += `<span>${pageTitle}</span>`;
  }
  
  // Find where to insert breadcrumbs
  const mainContent = document.querySelector('.main-content') || 
                     document.querySelector('main') ||
                     document.querySelector('.booking-container') ||
                     document.querySelector('.track-container');
  
  if (mainContent) {
    // Insert at the beginning of main content
    mainContent.insertBefore(breadcrumbNav, mainContent.firstChild);
    console.log('Breadcrumb navigation created');
  }
}