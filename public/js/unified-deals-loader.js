// Unified Deals Loader - Handles River, Ocean, and Legacy deals
// Integrates with new Supabase data sources

class UnifiedDealsLoader {
  constructor() {
    this.deals = [];
    this.filteredDeals = [];
    this.currentFilters = {
      destination: '',
      cruiseLine: '',
      month: '',
      type: '',
      source: ''
    };
    this.isLoading = false;
    this.apiEndpoint = '/api/unified-api?endpoint=cruise-data';
  }

  async initialize() {
    console.log('🚢 Initializing Unified Deals Loader...');
    
    // Show loading state
    this.showLoadingState();
    
    try {
      // Load unified deals from new data sources
      await this.loadUnifiedDeals();
      
      // Setup filters and UI
      this.setupFilters();
      this.setupUI();
      
      // Initial display
      this.displayDeals();
      
      console.log(`✅ Loaded ${this.deals.length} unified cruise deals`);
      
    } catch (error) {
      console.error('Failed to initialize deals loader:', error);
      this.showErrorState(error.message);
    }
  }

  async loadUnifiedDeals() {
    this.isLoading = true;
    
    try {
      const response = await fetch(this.apiEndpoint);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load cruise deals');
      }
      
      this.deals = result.deals || [];
      this.filteredDeals = [...this.deals];
      
      // Update summary info
      this.updateSummaryInfo(result.summary);
      
      console.log('📊 Deals loaded:', {
        total: result.summary.total,
        river: result.summary.river,
        ocean: result.summary.ocean,
        sources: result.summary.sources
      });
      
    } catch (error) {
      console.error('Error loading unified deals:', error);
      
      // Fallback to legacy deals.json if new system fails
      console.log('🔄 Falling back to legacy deals...');
      await this.loadLegacyDeals();
    } finally {
      this.isLoading = false;
    }
  }

  async loadLegacyDeals() {
    try {
      const response = await fetch('/deals.json');
      const legacyDeals = await response.json();
      
      // Convert legacy format to unified format
      this.deals = legacyDeals.map(deal => this.convertLegacyDeal(deal));
      this.filteredDeals = [...this.deals];
      
      console.log(`📋 Loaded ${this.deals.length} legacy deals as fallback`);
      
    } catch (error) {
      console.error('Failed to load legacy deals:', error);
      throw new Error('Unable to load any cruise deals');
    }
  }

  convertLegacyDeal(legacyDeal) {
    return {
      id: `legacy_${legacyDeal.seq}`,
      source: 'LEGACY',
      cruiseType: 'Ocean',
      
      // Basic info
      ship: legacyDeal.shipName || '',
      cruiseLine: legacyDeal.cruiseLine || '',
      itinerary: legacyDeal.itinerary || '',
      destination: legacyDeal.region || '',
      
      // Dates
      departureDate: this.convertLegacyDate(legacyDeal.departureDate),
      returnDate: null,
      duration: legacyDeal.nights || '',
      
      // Pricing
      pricing: {
        inside: this.parseLegacyPrice(legacyDeal.insidePrice),
        oceanview: this.parseLegacyPrice(legacyDeal.oceanviewPrice),
        balcony: this.parseLegacyPrice(legacyDeal.balconyPrice),
        suite: this.parseLegacyPrice(legacyDeal.suitePrice)
      },
      
      // Cabin mappings (empty for legacy)
      cabinTypes: {
        inside: [],
        oceanview: [],
        balcony: [],
        suite: []
      },
      
      // Additional info
      description: '',
      highlights: '',
      
      // Metadata
      originalData: legacyDeal,
      lastUpdated: new Date().toISOString()
    };
  }

  convertLegacyDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Handle DD-MMM-YY format like "28-Jun-25"
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = '20' + parts[2]; // Convert YY to YYYY
        
        const monthMap = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const monthNum = monthMap[month];
        if (monthNum) {
          return `${year}-${monthNum}-${day.padStart(2, '0')}`;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  parseLegacyPrice(priceStr) {
    if (!priceStr || priceStr === 'Quote Available') return null;
    
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    
    return isNaN(price) ? null : price;
  }

  setupFilters() {
    // Destination filter
    const destinationFilter = document.getElementById('destination-filter');
    if (destinationFilter) {
      const destinations = [...new Set(this.deals.map(deal => deal.destination).filter(Boolean))].sort();
      this.populateSelectFilter(destinationFilter, destinations, 'All Destinations');
      destinationFilter.addEventListener('change', (e) => {
        this.currentFilters.destination = e.target.value;
        this.applyFilters();
      });
    }

    // Cruise line filter
    const cruiseLineFilter = document.getElementById('cruise-line-filter');
    if (cruiseLineFilter) {
      const cruiseLines = [...new Set(this.deals.map(deal => deal.cruiseLine).filter(Boolean))].sort();
      this.populateSelectFilter(cruiseLineFilter, cruiseLines, 'All Cruise Lines');
      cruiseLineFilter.addEventListener('change', (e) => {
        this.currentFilters.cruiseLine = e.target.value;
        this.applyFilters();
      });
    }

    // Month filter
    const monthFilter = document.getElementById('month-filter');
    if (monthFilter) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      this.populateSelectFilter(monthFilter, months, 'All Months');
      monthFilter.addEventListener('change', (e) => {
        this.currentFilters.month = e.target.value ? (months.indexOf(e.target.value) + 1).toString() : '';
        this.applyFilters();
      });
    }

    // Cruise type filter (new)
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
      const types = [...new Set(this.deals.map(deal => deal.cruiseType).filter(Boolean))].sort();
      this.populateSelectFilter(typeFilter, types, 'All Types');
      typeFilter.addEventListener('change', (e) => {
        this.currentFilters.type = e.target.value;
        this.applyFilters();
      });
    }

    // Source filter (new)
    const sourceFilter = document.getElementById('source-filter');
    if (sourceFilter) {
      const sources = [...new Set(this.deals.map(deal => deal.source).filter(Boolean))].sort();
      this.populateSelectFilter(sourceFilter, sources, 'All Sources');
      sourceFilter.addEventListener('change', (e) => {
        this.currentFilters.source = e.target.value;
        this.applyFilters();
      });
    }
  }

  populateSelectFilter(selectElement, options, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      selectElement.appendChild(optionElement);
    });
  }

  applyFilters() {
    this.filteredDeals = this.deals.filter(deal => {
      // Destination filter
      if (this.currentFilters.destination && 
          !deal.destination.toLowerCase().includes(this.currentFilters.destination.toLowerCase())) {
        return false;
      }

      // Cruise line filter
      if (this.currentFilters.cruiseLine && 
          !deal.cruiseLine.toLowerCase().includes(this.currentFilters.cruiseLine.toLowerCase())) {
        return false;
      }

      // Month filter
      if (this.currentFilters.month && deal.departureDate) {
        const departureMonth = new Date(deal.departureDate).getMonth() + 1;
        if (departureMonth.toString() !== this.currentFilters.month) {
          return false;
        }
      }

      // Type filter
      if (this.currentFilters.type && 
          deal.cruiseType.toLowerCase() !== this.currentFilters.type.toLowerCase()) {
        return false;
      }

      // Source filter
      if (this.currentFilters.source && 
          deal.source.toLowerCase() !== this.currentFilters.source.toLowerCase()) {
        return false;
      }

      return true;
    });

    this.displayDeals();
    this.updateFilterInfo();
  }

  displayDeals() {
    const dealsContainer = document.getElementById('deals-container');
    if (!dealsContainer) return;

    if (this.filteredDeals.length === 0) {
      dealsContainer.innerHTML = this.getNoDealsHTML();
      return;
    }

    const dealsHTML = this.filteredDeals.map(deal => this.createDealHTML(deal)).join('');
    dealsContainer.innerHTML = dealsHTML;
  }

  createDealHTML(deal) {
    const departureDate = deal.departureDate ? new Date(deal.departureDate).toLocaleDateString() : 'TBA';
    const duration = deal.duration ? `${deal.duration} nights` : '';
    
    // Get best available price
    const bestPrice = this.getBestPrice(deal.pricing);
    const priceDisplay = bestPrice ? `From $${bestPrice.toLocaleString()}` : 'Quote Available';
    
    // Create cabin types display
    const cabinTypesHTML = this.createCabinTypesHTML(deal.cabinTypes);
    
    return `
      <div class="deal-tile" data-deal-id="${deal.id}">
        <div class="deal-header">
          <div class="cruise-line-info">
            <img src="${this.getCruiseLineLogo(deal.cruiseLine)}" 
                 alt="${deal.cruiseLine}" class="cruise-logo" 
                 onerror="this.src='/logos/cruiselines/placeholder.txt'">
            <div>
              <h3 class="ship-name">${deal.ship}</h3>
              <p class="cruise-line">${deal.cruiseLine}</p>
            </div>
          </div>
          <div class="source-badges">
            <span class="tag-badge source-${deal.source.toLowerCase()}">${deal.source}</span>
            <span class="tag-badge type-${deal.cruiseType.toLowerCase()}">${deal.cruiseType}</span>
          </div>
        </div>
        
        <div class="deal-content">
          <div class="itinerary-info">
            <h4 class="destination">${deal.destination}</h4>
            <p class="itinerary">${deal.itinerary || 'Itinerary details available upon booking'}</p>
          </div>
          
          <div class="cruise-details">
            <div class="detail-item">
              <i class="ri-calendar-line"></i>
              <span>Departure: ${departureDate}</span>
            </div>
            <div class="detail-item">
              <i class="ri-time-line"></i>
              <span>Duration: ${duration}</span>
            </div>
          </div>
          
          ${cabinTypesHTML}
          
          <div class="pricing-section">
            <div class="price-grid">
              ${this.createPricingHTML(deal.pricing)}
            </div>
            <div class="best-price">
              <span class="price-gradient">${priceDisplay}</span>
            </div>
          </div>
        </div>
        
        <div class="deal-actions">
          <button class="btn-primary" onclick="requestQuote('${deal.id}')">
            Request Quote
          </button>
          <button class="btn-secondary" onclick="viewDetails('${deal.id}')">
            View Details
          </button>
        </div>
      </div>
    `;
  }

  createCabinTypesHTML(cabinTypes) {
    if (!cabinTypes || Object.values(cabinTypes).every(arr => arr.length === 0)) {
      return '';
    }

    let html = '<div class="cabin-types-section"><h5>Available Cabin Types:</h5><div class="cabin-types-grid">';
    
    Object.entries(cabinTypes).forEach(([category, cabins]) => {
      if (cabins.length > 0) {
        html += `<div class="cabin-category">
          <strong>${category.charAt(0).toUpperCase() + category.slice(1)}:</strong>
          <ul>`;
        
        cabins.forEach(cabin => {
          html += `<li>${cabin.code} - ${cabin.description || cabin.category}</li>`;
        });
        
        html += '</ul></div>';
      }
    });
    
    html += '</div></div>';
    return html;
  }

  createPricingHTML(pricing) {
    const categories = [
      { key: 'inside', label: 'Inside' },
      { key: 'oceanview', label: 'Oceanview' },
      { key: 'balcony', label: 'Balcony' },
      { key: 'suite', label: 'Suite' }
    ];

    return categories.map(cat => {
      const price = pricing[cat.key];
      const priceText = price ? `$${price.toLocaleString()}` : 'Quote Available';
      
      return `
        <div class="price-item">
          <span class="cabin-type">${cat.label}</span>
          <span class="price">${priceText}</span>
        </div>
      `;
    }).join('');
  }

  getBestPrice(pricing) {
    const prices = Object.values(pricing).filter(price => price !== null && price > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  getNoDealsHTML() {
    return `
      <div class="no-deals-message">
        <i class="ri-ship-line"></i>
        <h3>No cruise deals found</h3>
        <p>Try adjusting your filters to see more options.</p>
        <button onclick="clearAllFilters()" class="btn-secondary">Clear All Filters</button>
      </div>
    `;
  }

  showLoadingState() {
    const dealsContainer = document.getElementById('deals-container');
    if (dealsContainer) {
      dealsContainer.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <h3>Loading cruise deals...</h3>
          <p>Fetching the latest deals from river and ocean cruises...</p>
        </div>
      `;
    }
  }

  showErrorState(errorMessage) {
    const dealsContainer = document.getElementById('deals-container');
    if (dealsContainer) {
      dealsContainer.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <h3>Unable to load cruise deals</h3>
          <p>${errorMessage}</p>
          <button onclick="location.reload()" class="btn-primary">Try Again</button>
        </div>
      `;
    }
  }

  updateSummaryInfo(summary) {
    if (!summary) return;

    // Update deals count
    const dealsCountElement = document.getElementById('deals-count');
    if (dealsCountElement) {
      dealsCountElement.textContent = summary.total || this.deals.length;
    }

    // Update source breakdown
    const sourceBreakdownElement = document.getElementById('source-breakdown');
    if (sourceBreakdownElement) {
      sourceBreakdownElement.innerHTML = `
        <span>River: ${summary.river || 0}</span>
        <span>Ocean: ${summary.ocean || 0}</span>
        <span>Total: ${summary.total || 0}</span>
      `;
    }
  }

  updateFilterInfo() {
    const filterInfoElement = document.getElementById('filter-info');
    if (filterInfoElement) {
      const activeFilters = Object.entries(this.currentFilters)
        .filter(([key, value]) => value)
        .length;
      
      filterInfoElement.textContent = activeFilters > 0 
        ? `Showing ${this.filteredDeals.length} of ${this.deals.length} deals (${activeFilters} filters active)`
        : `Showing all ${this.deals.length} deals`;
    }
  }

  // Get appropriate logo for cruise line
  getCruiseLineLogo(cruiseLine) {
    if (!cruiseLine) return '/logos/cruiselines/placeholder.txt';
    
    const logoMap = {
      'amawaterways': '/logos/cruiselines/amawaterways.png',
      'ama waterways': '/logos/cruiselines/amawaterways.png',
      'emerald cruises': '/logos/cruiselines/emerald-cruises.png',
      'emerald': '/logos/cruiselines/emerald-cruises.png',
      'scenic': '/logos/cruiselines/scenic.webp',
      'scenic river cruises': '/logos/cruiselines/scenic.webp',
      'scenic cruises': '/logos/cruiselines/scenic.webp'
    };
    
    const cruiseLineLower = cruiseLine.toLowerCase();
    
    // Check exact matches first
    if (logoMap[cruiseLineLower]) {
      return logoMap[cruiseLineLower];
    }
    
    // Check partial matches for river cruise lines
    for (const [key, logo] of Object.entries(logoMap)) {
      if (cruiseLineLower.includes(key) || key.includes(cruiseLineLower)) {
        return logo;
      }
    }
    
    // Default to standard naming convention
    const standardName = cruiseLine.toLowerCase().replace(/\s+/g, '-');
    return `/logos/cruiselines/${standardName}.png`;
  }

  // Public methods for external use
  clearAllFilters() {
    this.currentFilters = {
      destination: '',
      cruiseLine: '',
      month: '',
      type: '',
      source: ''
    };

    // Reset filter UI
    document.querySelectorAll('.filter-select').forEach(select => {
      select.value = '';
    });

    this.applyFilters();
  }

  async refreshDeals() {
    console.log('🔄 Refreshing cruise deals...');
    await this.loadUnifiedDeals();
    this.applyFilters();
  }
}

// Global functions for deal interactions
window.requestQuote = function(dealId) {
  console.log('Requesting quote for deal:', dealId);
  // Implement quote request logic
  alert('Quote request functionality will be implemented');
};

window.viewDetails = function(dealId) {
  console.log('Viewing details for deal:', dealId);
  // Implement deal details view
  alert('Deal details functionality will be implemented');
};

window.clearAllFilters = function() {
  if (window.dealsLoader) {
    window.dealsLoader.clearAllFilters();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚢 Initializing Unified Deals System...');
  
  window.dealsLoader = new UnifiedDealsLoader();
  await window.dealsLoader.initialize();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedDealsLoader;
}