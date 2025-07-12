// Simple Deals Loader - Guaranteed to work
console.log('🚢 Simple Deals Loader Starting...');

async function loadDealsSimple() {
    console.log('📄 Loading deals from deals.json...');
    const container = document.getElementById('deals-container');
    
    if (!container) {
        console.error('❌ deals-container element not found');
        return;
    }
    
    // Show loading
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span class="ml-4 text-lg text-slate-600">Loading cruise deals...</span>
        </div>
    `;
    
    try {
        const response = await fetch('/deals.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const deals = await response.json();
        console.log(`✅ Loaded ${deals.length} deals successfully`);
        
        // Update global variables
        window.allDeals = deals;
        window.filteredDeals = [...deals];
        
        // Render deals
        renderDealsGrid(deals);
        
        // Setup filters
        setupSimpleFilters();
        
    } catch (error) {
        console.error('❌ Failed to load deals:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">⚠️ Unable to load cruise deals</div>
                <p class="text-slate-600 mb-4">${error.message}</p>
                <button onclick="loadDealsSimple()" class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                    Try Again
                </button>
            </div>
        `;
    }
}

function renderDealsGrid(deals) {
    const container = document.getElementById('deals-container');
    
    if (deals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600">No cruise deals found matching your filters</p>
            </div>
        `;
        return;
    }
    
    const dealsHTML = deals.map(deal => {
        const bestPrice = getBestPrice(deal);
        const priceDisplay = bestPrice ? `From $${bestPrice.toLocaleString()}` : 'Quote Available';
        
        return `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 mb-1">${deal.shipName || 'Ship Name'}</h3>
                            <p class="text-orange-600 font-semibold">${deal.cruiseLine || 'Cruise Line'}</p>
                        </div>
                        <div class="text-right">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Ocean</span>
                        </div>
                    </div>
                    
                    <!-- Details -->
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-slate-600">
                            <i class="ri-map-pin-line mr-2 text-orange-500"></i>
                            <span><strong>Destination:</strong> ${deal.region || 'Various'}</span>
                        </div>
                        <div class="flex items-center text-slate-600">
                            <i class="ri-time-line mr-2 text-orange-500"></i>
                            <span><strong>Duration:</strong> ${deal.nights || 'N/A'} nights</span>
                        </div>
                        <div class="flex items-center text-slate-600">
                            <i class="ri-calendar-line mr-2 text-orange-500"></i>
                            <span><strong>Departure:</strong> ${deal.departureDate || 'TBA'}</span>
                        </div>
                        <div class="flex items-center text-slate-600">
                            <i class="ri-ship-line mr-2 text-orange-500"></i>
                            <span><strong>Route:</strong> ${deal.from || 'Various'} to ${deal.to || 'Various'}</span>
                        </div>
                    </div>
                    
                    <!-- Pricing Grid -->
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        ${createPriceCard('Inside', deal.insidePrice)}
                        ${createPriceCard('Oceanview', deal.oceanviewPrice)}
                        ${createPriceCard('Balcony', deal.balconyPrice)}
                        ${createPriceCard('Suite', deal.suitePrice)}
                    </div>
                    
                    <!-- Best Price & CTA -->
                    <div class="text-center pt-4 border-t border-slate-100">
                        <div class="text-2xl font-bold text-orange-600 mb-3">${priceDisplay}</div>
                        <button class="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                            Request Quote
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${dealsHTML}
        </div>
    `;
    
    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${deals.length} cruise deals found`;
    }
}

function createPriceCard(category, price) {
    const isAvailable = price && price !== 'Quote Available';
    const displayPrice = isAvailable ? `$${price}` : 'Quote';
    
    return `
        <div class="text-center p-3 bg-slate-50 rounded-lg">
            <div class="text-xs text-slate-500 mb-1">${category}</div>
            <div class="font-semibold text-slate-800">${displayPrice}</div>
        </div>
    `;
}

function getBestPrice(deal) {
    const prices = [deal.insidePrice, deal.oceanviewPrice, deal.balconyPrice, deal.suitePrice]
        .filter(price => price && price !== 'Quote Available')
        .map(price => {
            if (typeof price === 'string') {
                const cleaned = price.replace(/[^0-9.]/g, '');
                return parseFloat(cleaned);
            }
            return parseFloat(price);
        })
        .filter(price => !isNaN(price) && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
}

function setupSimpleFilters() {
    // Setup cruising type filter
    const cruisingTypeFilter = document.getElementById('cruisingTypeFilter');
    if (cruisingTypeFilter) {
        cruisingTypeFilter.addEventListener('change', function() {
            console.log('🔍 Cruising type filter:', this.value);
            applySimpleFilters();
        });
    }
    
    // Setup other filters
    const filters = ['cruiseLineFilter', 'regionFilter', 'dateFromFilter', 'dateToFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applySimpleFilters);
        }
    });
    
    console.log('✅ Simple filters setup complete');
}

function applySimpleFilters() {
    if (!window.allDeals) return;
    
    const cruisingType = document.getElementById('cruisingTypeFilter')?.value || '';
    const cruiseLine = document.getElementById('cruiseLineFilter')?.value || '';
    const region = document.getElementById('regionFilter')?.value || '';
    
    let filtered = window.allDeals.filter(deal => {
        // Cruising type filter (for now, all legacy deals are Ocean)
        if (cruisingType === 'River') {
            return false; // No river cruises in legacy data
        }
        
        // Cruise line filter
        if (cruiseLine && !deal.cruiseLine?.toLowerCase().includes(cruiseLine.toLowerCase())) {
            return false;
        }
        
        // Region filter
        if (region && !deal.region?.toLowerCase().includes(region.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    window.filteredDeals = filtered;
    renderDealsGrid(filtered);
    
    console.log(`🔍 Filtered to ${filtered.length} deals`);
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDealsSimple);
} else {
    setTimeout(loadDealsSimple, 100);
}

// Make function globally available
window.loadDealsSimple = loadDealsSimple;

console.log('✅ Simple Deals Loader Ready');