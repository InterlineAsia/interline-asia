// Unified Deals Loader - Loads both Ocean and River cruises
console.log('🚢 Unified Deals Loader Starting...');

async function loadUnifiedDeals() {
    console.log('📄 Loading unified cruise data...');
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
        // Try unified API first
        console.log('🌊 Trying unified cruise data API...');
        let response = await fetch('/api/unified-api?endpoint=cruise-data');
        
        let allDeals = [];
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.deals && result.deals.length > 0) {
                allDeals = result.deals.map(deal => formatUnifiedDeal(deal));
                console.log(`✅ Loaded ${allDeals.length} deals from unified API (${result.summary?.river || 0} river + ${result.summary?.ocean || 0} ocean)`);
            } else {
                throw new Error('Unified API returned no deals');
            }
        } else {
            throw new Error(`Unified API failed: ${response.status}`);
        }
        
        // Fallback to legacy deals if unified fails
        if (allDeals.length === 0) {
            console.log('🔄 Falling back to legacy deals.json...');
            response = await fetch('/deals.json');
            if (response.ok) {
                const legacyDeals = await response.json();
                allDeals = legacyDeals.map(deal => formatLegacyDeal(deal));
                console.log(`✅ Loaded ${allDeals.length} legacy deals`);
            } else {
                throw new Error('Both unified API and legacy deals failed');
            }
        }
        
        // Update global variables
        window.allDeals = allDeals;
        window.filteredDeals = [...allDeals];
        
        // Render deals
        renderUnifiedDealsGrid(allDeals);
        
        // Setup filters with actual data
        setupUnifiedFilters(allDeals);
        
        // Update summary
        updateDealsSummary(allDeals);
        
    } catch (error) {
        console.error('❌ Failed to load unified deals:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">⚠️ Unable to load cruise deals</div>
                <p class="text-slate-600 mb-4">${error.message}</p>
                <button onclick="loadUnifiedDeals()" class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                    Try Again
                </button>
            </div>
        `;
    }
}

function formatUnifiedDeal(deal) {
    return {
        id: deal.id,
        cruiseLine: deal.cruiseLine || '',
        shipName: deal.ship || '',
        departureDate: deal.departureDate || '',
        region: deal.destination || 'Other',
        nights: deal.duration || '',
        from: 'Various Ports',
        to: 'Round Trip',
        itinerary: deal.itinerary || '',
        insidePrice: deal.pricing?.inside || null,
        oceanviewPrice: deal.pricing?.oceanview || null,
        balconyPrice: deal.pricing?.balcony || null,
        suitePrice: deal.pricing?.suite || null,
        cruiseType: deal.cruiseType || 'Ocean',
        source: deal.source || 'UNIFIED',
        cabinTypes: deal.cabinTypes || {}
    };
}

function formatLegacyDeal(deal) {
    return {
        id: deal.seq || Math.random().toString(36).substr(2, 9),
        cruiseLine: deal.cruiseLine || '',
        shipName: deal.shipName || '',
        departureDate: deal.departureDate || '',
        region: deal.region || 'Other',
        nights: deal.nights || '',
        from: deal.from || 'Various Ports',
        to: deal.to || 'Round Trip',
        itinerary: deal.itinerary || '',
        insidePrice: deal.insidePrice && deal.insidePrice !== 'Quote Available' ? deal.insidePrice : null,
        oceanviewPrice: deal.oceanviewPrice && deal.oceanviewPrice !== 'Quote Available' ? deal.oceanviewPrice : null,
        balconyPrice: deal.balconyPrice && deal.balconyPrice !== 'Quote Available' ? deal.balconyPrice : null,
        suitePrice: deal.suitePrice && deal.suitePrice !== 'Quote Available' ? deal.suitePrice : null,
        cruiseType: 'Ocean',
        source: 'LEGACY',
        cabinTypes: {}
    };
}

function renderUnifiedDealsGrid(deals) {
    const container = document.getElementById('deals-container');
    
    if (deals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600">No cruise deals found matching your filters</p>
                <button onclick="clearAllFilters()" class="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }
    
    const dealsHTML = deals.map(deal => {
        const bestPrice = getBestPriceUnified(deal);
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
                            <span class="bg-${deal.cruiseType === 'River' ? 'green' : 'blue'}-100 text-${deal.cruiseType === 'River' ? 'green' : 'blue'}-800 px-2 py-1 rounded-full text-xs">${deal.cruiseType}</span>
                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs ml-1">${deal.source}</span>
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
                        ${deal.itinerary ? `
                        <div class="flex items-start text-slate-600">
                            <i class="ri-route-line mr-2 text-orange-500 mt-1"></i>
                            <span><strong>Itinerary:</strong> ${deal.itinerary}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Cabin Types (if available) -->
                    ${renderCabinTypes(deal.cabinTypes)}
                    
                    <!-- Pricing Grid -->
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        ${createPriceCardUnified('Inside', deal.insidePrice)}
                        ${createPriceCardUnified('Oceanview', deal.oceanviewPrice)}
                        ${createPriceCardUnified('Balcony', deal.balconyPrice)}
                        ${createPriceCardUnified('Suite', deal.suitePrice)}
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
}

function renderCabinTypes(cabinTypes) {
    if (!cabinTypes || Object.values(cabinTypes).every(arr => !arr || arr.length === 0)) {
        return '';
    }
    
    let html = '<div class="mb-4 p-3 bg-slate-50 rounded-lg"><h5 class="font-semibold text-slate-700 mb-2">Available Cabins:</h5><div class="grid grid-cols-2 gap-2 text-xs">';
    
    Object.entries(cabinTypes).forEach(([category, cabins]) => {
        if (cabins && cabins.length > 0) {
            html += `<div><strong>${category.charAt(0).toUpperCase() + category.slice(1)}:</strong> ${cabins.map(c => c.code).join(', ')}</div>`;
        }
    });
    
    html += '</div></div>';
    return html;
}

function createPriceCardUnified(category, price) {
    const isAvailable = price && price !== 'Quote Available' && price > 0;
    const displayPrice = isAvailable ? `$${typeof price === 'number' ? price.toLocaleString() : price}` : 'Quote';
    
    return `
        <div class="text-center p-3 bg-slate-50 rounded-lg">
            <div class="text-xs text-slate-500 mb-1">${category}</div>
            <div class="font-semibold text-slate-800">${displayPrice}</div>
        </div>
    `;
}

function getBestPriceUnified(deal) {
    const prices = [deal.insidePrice, deal.oceanviewPrice, deal.balconyPrice, deal.suitePrice]
        .filter(price => price && price !== 'Quote Available')
        .map(price => typeof price === 'number' ? price : parseFloat(price.toString().replace(/[^0-9.]/g, '')))
        .filter(price => !isNaN(price) && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
}

function setupUnifiedFilters(allDeals) {
    // Setup cruising type filter
    const cruisingTypeFilter = document.getElementById('cruisingTypeFilter');
    if (cruisingTypeFilter) {
        cruisingTypeFilter.addEventListener('change', function() {
            console.log('🔍 Cruising type filter:', this.value);
            applyUnifiedFilters();
        });
    }
    
    // Setup other filters
    const filters = ['cruiseLineFilter', 'regionFilter', 'dateFromFilter', 'dateToFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applyUnifiedFilters);
        }
    });
    
    // Populate filter options
    populateFilterOptions(allDeals);
    
    console.log('✅ Unified filters setup complete');
}

function populateFilterOptions(deals) {
    // Populate cruise lines
    const cruiseLines = [...new Set(deals.map(d => d.cruiseLine).filter(Boolean))].sort();
    const cruiseLineFilter = document.getElementById('cruiseLineFilter');
    if (cruiseLineFilter) {
        cruiseLineFilter.innerHTML = '<option value="">All Cruise Lines</option>' + 
            cruiseLines.map(line => `<option value="${line}">${line}</option>`).join('');
    }
    
    // Populate regions
    const regions = [...new Set(deals.map(d => d.region).filter(Boolean))].sort();
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.innerHTML = '<option value="">All Destinations</option>' + 
            regions.map(region => `<option value="${region}">${region}</option>`).join('');
    }
}

function applyUnifiedFilters() {
    if (!window.allDeals) return;
    
    const cruisingType = document.getElementById('cruisingTypeFilter')?.value || '';
    const cruiseLine = document.getElementById('cruiseLineFilter')?.value || '';
    const region = document.getElementById('regionFilter')?.value || '';
    
    let filtered = window.allDeals.filter(deal => {
        // Cruising type filter
        if (cruisingType && deal.cruiseType !== cruisingType) {
            return false;
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
    renderUnifiedDealsGrid(filtered);
    updateDealsSummary(filtered);
    
    console.log(`🔍 Filtered to ${filtered.length} deals`);
}

function updateDealsSummary(deals) {
    const riverCount = deals.filter(d => d.cruiseType === 'River').length;
    const oceanCount = deals.filter(d => d.cruiseType === 'Ocean').length;
    
    const summaryElement = document.getElementById('deals-summary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <span class="text-slate-600">
                ${deals.length} deals found 
                (${oceanCount} Ocean, ${riverCount} River)
            </span>
        `;
    }
}

function clearAllFilters() {
    document.getElementById('cruisingTypeFilter').value = '';
    document.getElementById('cruiseLineFilter').value = '';
    document.getElementById('regionFilter').value = '';
    applyUnifiedFilters();
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUnifiedDeals);
} else {
    setTimeout(loadUnifiedDeals, 100);
}

// Make functions globally available
window.loadUnifiedDeals = loadUnifiedDeals;
window.clearAllFilters = clearAllFilters;

console.log('✅ Unified Deals Loader Ready');