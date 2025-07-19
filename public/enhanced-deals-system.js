// Enhanced Deals UI System - Production Ready
// Renders beautiful cruise deal tiles with responsive design

class EnhancedDealsSystem {
  constructor() {
    this.loader = new EnhancedDealsLoader();
    this.currentDeals = [];
    this.currentFilters = {};
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loader.initialize();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('DEALS SYSTEM: Initialized successfully');
    } catch (error) {
      console.error('DEALS SYSTEM: Initialization failed:', error);
      throw error;
    }
  }

  async loadAndDisplayDeals() {
    try {
      this.showLoading();
      
      const deals = await this.loader.loadAllDeals();
      this.currentDeals = deals;
      
      this.populateFilters(deals);
      this.renderDeals(deals);
      this.updateStats(deals);
      
      this.hideLoading();
      
    } catch (error) {
      console.error('DEALS SYSTEM: Error loading deals:', error);
      this.showError('Failed to load cruise deals. Please try again later.');
    }
  }

  renderDeals(deals) {
    const container = document.getElementById('deals-container');
    if (!container) {
      console.error('DEALS SYSTEM: Container not found');
      return;
    }

    if (!deals || deals.length === 0) {
      this.showNoResults();
      return;
    }

    const dealsHTML = deals.map(deal => this.createDealTile(deal)).join('');
    container.innerHTML = `
      <div class="deals-grid">
        ${dealsHTML}
      </div>
    `;

    // Add lazy loading for images
    this.setupLazyLoading();
  }

  createDealTile(deal) {
    const logoPath = this.getCruiseLineLogo(deal.cruise_line_normalized);
    const badgeColor = this.getCruiseTypeBadgeColor(deal.cruise_type);
    const priceDisplay = deal.from_price ? `From $${deal.from_price.toLocaleString()}` : 'Price TBA';
    
    return `
      <div class="deal-tile" data-deal-id="${deal.id}">
        <div class="deal-header">
          <img class="cruise-logo" 
               src="${logoPath}" 
               alt="${deal.cruise_line} logo"
               onerror="this.src='/logos/cruiselines/placeholder.png'"
               loading="lazy">
          <span class="cruise-badge" style="background-color: ${badgeColor}">
            ${deal.cruise_type}
          </span>
        </div>
        
        <div class="deal-content">
          <h3 class="ship-name">${deal.ship || 'Cruise Ship'}</h3>
          <p class="cruise-line">${deal.cruise_line || 'Cruise Line'}</p>
          
          <div class="deal-details">
            <div class="detail-item">
              <i class="ri-map-pin-line"></i>
              <span>${deal.destination || 'Destination TBA'}</span>
            </div>
            
            <div class="detail-item">
              <i class="ri-calendar-line"></i>
              <span>${deal.departure_date_formatted}</span>
            </div>
            
            ${deal.duration_nights ? `
              <div class="detail-item">
                <i class="ri-time-line"></i>
                <span>${deal.duration_nights} nights</span>
              </div>
            ` : ''}
          </div>
          
          ${deal.itinerary ? `
            <div class="itinerary">
              <i class="ri-route-line"></i>
              <span>${this.truncateText(deal.itinerary, 80)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="deal-footer">
          <div class="price-section">
            <span class="price">${priceDisplay}</span>
            ${deal.from_price ? '<span class="price-note">per person</span>' : ''}
          </div>
          
          <button class="view-details-btn" onclick="window.dealsSystem.viewDealDetails('${deal.id}')">
            <i class="ri-eye-line"></i>
            View Details
          </button>
        </div>
      </div>
    `;
  }

  getCruiseLineLogo(cruiseLineNormalized) {
    // Map common cruise line variations to logo filenames
    const logoMap = {
      'amawaterways': 'amawaterways.png',
      'atlas-ocean-voyages': 'atlas.png',
      'azamara': 'azamara.png',
      'carnival': 'carnival.png',
      'celebrity': 'celebrity.png',
      'coral-expeditions': 'coral-expeditions.png',
      'crystal': 'crystal.png',
      'cunard': 'cunard.png',
      'emerald-cruises': 'emerald-cruises.png',
      'explora-journeys': 'explora-journeys.png',
      'heritage-expeditions': 'heritage-expeditions.png',
      'holland-america': 'holland-america.png',
      'hx-hurtigruten-expeditions': 'hx-hurtigruten-expeditions.png',
      'msc': 'msc.png',
      'norwegian': 'norwegian.png',
      'oceania': 'oceania.png',
      'princess': 'princess.png',
      'regent-seven-seas-cruises': 'regent.png',
      'royal-caribbean': 'royal-caribbean.png',
      'scenic': 'scenic.png',
      'seabourn': 'seabourn.png',
      'silversea': 'silversea.png',
      'quark-expeditions': 'QUARK EXPEDITIONS.png'
    };

    const logoFile = logoMap[cruiseLineNormalized] || `${cruiseLineNormalized}.png`;
    return `/logos/cruiselines/${logoFile}`;
  }

  getCruiseTypeBadgeColor(cruiseType) {
    const colorMap = {
      'Ocean Cruise': '#3b82f6',
      'River Cruise': '#10b981',
      'Expedition Cruise': '#f59e0b',
      'Luxury Cruise': '#8b5cf6',
      'Adventure Cruise': '#ef4444'
    };
    return colorMap[cruiseType] || '#6b7280';
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  populateFilters(deals) {
    const options = this.loader.getFilterOptions(deals);
    
    this.populateSelect('cruise-line-filter', options.cruiseLines, 'All Cruise Lines');
    this.populateSelect('cruise-type-filter', options.cruiseTypes, 'All Cruise Types');
    this.populateSelect('destination-filter', options.destinations, 'All Destinations');
  }

  populateSelect(selectId, options, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="all">${defaultText}</option>`;
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.applyFilters(), 300);
      });
    }

    // Filter dropdowns
    const filterIds = ['cruise-line-filter', 'cruise-type-filter', 'destination-filter'];
    filterIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.applyFilters());
      }
    });

    // Date filters
    const dateFromInput = document.getElementById('date-from-filter');
    const dateToInput = document.getElementById('date-to-filter');
    
    if (dateFromInput) {
      dateFromInput.addEventListener('change', () => this.applyFilters());
    }
    if (dateToInput) {
      dateToInput.addEventListener('change', () => this.applyFilters());
    }

    // Clear filters button
    const clearButton = document.getElementById('clear-filters-btn');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearFilters());
    }
  }

  async applyFilters() {
    const filters = {
      search: document.getElementById('search-input')?.value || '',
      cruiseLine: document.getElementById('cruise-line-filter')?.value || 'all',
      cruiseType: document.getElementById('cruise-type-filter')?.value || 'all',
      destination: document.getElementById('destination-filter')?.value || 'all',
      dateFrom: document.getElementById('date-from-filter')?.value || '',
      dateTo: document.getElementById('date-to-filter')?.value || ''
    };

    this.currentFilters = filters;
    
    try {
      this.showLoading();
      const filteredDeals = await this.loader.filterDeals(filters);
      this.renderDeals(filteredDeals);
      this.updateStats(filteredDeals, this.currentDeals.length);
      this.hideLoading();
    } catch (error) {
      console.error('DEALS SYSTEM: Error applying filters:', error);
      this.showError('Error applying filters. Please try again.');
    }
  }

  clearFilters() {
    // Clear all filter inputs
    const inputs = ['search-input', 'date-from-filter', 'date-to-filter'];
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });

    const selects = ['cruise-line-filter', 'cruise-type-filter', 'destination-filter'];
    selects.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = 'all';
    });

    // Reset to show all deals
    this.renderDeals(this.currentDeals);
    this.updateStats(this.currentDeals);
  }

  updateStats(displayedDeals, totalDeals = null) {
    const statsElement = document.getElementById('deals-stats');
    if (!statsElement) return;

    const total = totalDeals || displayedDeals.length;
    const displayed = displayedDeals.length;
    const lastUpdated = this.loader.getLastUpdated();
    
    let statsHTML = `
      <div class="stats-item">
        <span class="stats-label">Showing:</span>
        <span class="stats-value">${displayed.toLocaleString()} of ${total.toLocaleString()} deals</span>
      </div>
    `;

    if (lastUpdated) {
      const updateTime = new Date(lastUpdated).toLocaleString();
      statsHTML += `
        <div class="stats-item">
          <span class="stats-label">Last Updated:</span>
          <span class="stats-value">${updateTime}</span>
        </div>
      `;
    }

    statsElement.innerHTML = statsHTML;
  }

  viewDealDetails(dealId) {
    window.open(`/deal-details.html?id=${dealId}`, '_blank');
  }

  showLoading() {
    const container = document.getElementById('deals-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <h3>Loading amazing cruise deals...</h3>
          <p>Please wait while we fetch the latest offers</p>
        </div>
      `;
    }
  }

  hideLoading() {
    // Loading will be hidden when deals are rendered
  }

  showError(message) {
    const container = document.getElementById('deals-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <h3>Oops! Something went wrong</h3>
          <p>${message}</p>
          <button class="retry-btn" onclick="window.dealsSystem.loadAndDisplayDeals()">
            <i class="ri-refresh-line"></i>
            Try Again
          </button>
        </div>
      `;
    }
  }

  showNoResults() {
    const container = document.getElementById('deals-container');
    if (container) {
      container.innerHTML = `
        <div class="no-results-state">
          <i class="ri-ship-line"></i>
          <h3>No cruise deals found</h3>
          <p>Try adjusting your search criteria or filters to find more deals.</p>
          <button class="clear-filters-btn" onclick="window.dealsSystem.clearFilters()">
            <i class="ri-filter-off-line"></i>
            Clear All Filters
          </button>
        </div>
      `;
    }
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img.cruise-logo').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}

// Export for global use
window.EnhancedDealsSystem = EnhancedDealsSystem;