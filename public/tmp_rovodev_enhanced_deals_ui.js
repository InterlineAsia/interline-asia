// tmp_rovodev_enhanced_deals_ui.js
// Renders deals on the page and connects UI interactions

function createDealTile(deal) {
  const logoPath = `/logos/cruiselines/${deal.cruise_line.toLowerCase().replace(/\s+/g, '-')}.png`;
  const fallbackLogo = '/logos/cruiselines/placeholder.png';
  const badgeColor = {
    'Ocean Cruise': '#3b82f6',
    'River Cruise': '#10b981', 
    'Expedition Cruise': '#f59e0b'
  }[deal.cruise_type] || '#6b7280';

  return `
    <div class="deal-tile">
      <div class="deal-header">
        <img class="cruise-logo" src="${logoPath}" alt="${deal.cruise_line} logo" 
             onerror="this.src='${fallbackLogo}'" loading="lazy" />
        <span class="cruise-badge" style="background-color:${badgeColor}">${deal.cruise_type}</span>
      </div>
      <div class="deal-content">
        <h3 class="ship-name">${deal.ship}</h3>
        <p class="destination"><i class="ri-map-pin-line"></i> ${deal.destination}</p>
        <p class="departure-date"><i class="ri-calendar-line"></i> ${new Date(deal.departure_date).toLocaleDateString()}</p>
        <p class="duration"><i class="ri-time-line"></i> ${deal.nights || 'N/A'} nights</p>
        <p class="price"><i class="ri-price-tag-line"></i> ${deal.price || 'Price TBA'}</p>
      </div>
      <div class="deal-actions">
        <button class="view-details-btn" onclick="viewDealDetails('${deal.id}')">
          <i class="ri-eye-line"></i> View Details
        </button>
      </div>
    </div>
  `;
}

function renderDeals(deals) {
  const container = document.getElementById('deals-container');
  if (!container) {
    console.error('Deals container not found');
    return;
  }
  
  if (!deals || deals.length === 0) {
    container.innerHTML = `
      <div class="no-deals">
        <i class="ri-ship-line"></i>
        <h3>No deals found</h3>
        <p>Try adjusting your search filters</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = deals.map(createDealTile).join('');
}

function viewDealDetails(id) {
  window.location.href = `deal-details.html?id=${id}`;
}

function showLoading() {
  const container = document.getElementById('deals-container');
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="ri-loader-4-line"></i>
        <p>Loading amazing cruise deals...</p>
      </div>
    `;
  }
}

function hideLoading() {
  // Loading will be hidden when renderDeals is called
}

async function initializeDealsPage() {
  // Show loading initially
  showLoading();
  
  // Set up search functionality - use actual filter IDs from deals.html
  const searchInput = document.getElementById('search-input');
  const cruiseLineFilter = document.getElementById('cruise-line-filter');
  const destinationFilter = document.getElementById('destination-filter');
  const cruiseTypeFilter = document.getElementById('cruise-type-filter');
  const durationFilter = document.getElementById('duration-filter');
  const fromDateFilter = document.getElementById('from-date-filter');
  const toDateFilter = document.getElementById('to-date-filter');
  
  // Set up real-time filtering
  function applyFilters() {
    showLoading();
    const filters = {
      search: searchInput?.value || '',
      cruiseType: cruiseTypeFilter?.value || '',
      cruiseLine: cruiseLineFilter?.value || '',
      destination: destinationFilter?.value || '',
      duration: durationFilter?.value || '',
      startDate: fromDateFilter?.value || '',
      endDate: toDateFilter?.value || '',
    };
      
    try {
      const deals = await fetchDealsFromSupabase(filters);
      renderDeals(deals);
    } catch (error) {
      console.error('Error fetching filtered deals:', error);
      const container = document.getElementById('deals-container');
      if (container) {
        container.innerHTML = `
          <div class="error-message">
            <i class="ri-error-warning-line"></i>
            <h3>Error loading deals</h3>
            <p>Please try again later</p>
          </div>
        `;
      }
    }
  }
  
  // Add event listeners for real-time filtering
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });
  }
  
  [cruiseLineFilter, destinationFilter, cruiseTypeFilter, durationFilter, fromDateFilter, toDateFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', applyFilters);
    }
  });

  // Load all deals initially
  try {
    const deals = await fetchDealsFromSupabase();
    renderDeals(deals);
  } catch (error) {
    console.error('Error loading initial deals:', error);
    const container = document.getElementById('deals-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="ri-error-warning-line"></i>
          <h3>Error loading deals</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDealsPage);