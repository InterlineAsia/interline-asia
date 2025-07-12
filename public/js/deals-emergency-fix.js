// Emergency Fix for Deals Page - Ensures deals load properly
console.log('🚨 Emergency Deals Fix Loading...');

// Override the existing loadDeals function
window.loadDealsEmergencyFix = async function() {
    console.log('🔧 Emergency fix: Loading deals...');
    const container = document.getElementById('deals-container');
    
    if (!container) {
        console.error('❌ deals-container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p class="text-lg text-slate-600">Loading cruise deals...</p>
        </div>
    `;
    
    try {
        // Try legacy deals.json first for immediate fix
        console.log('📄 Loading legacy deals.json...');
        const response = await fetch('/deals.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load deals: ${response.status}`);
        }
        
        const dealsData = await response.json();
        console.log(`✅ Loaded ${dealsData.length} deals from legacy file`);
        
        // Format deals for display
        const formattedDeals = dealsData.map(deal => ({
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
            currency: 'USD',
            cruiseType: 'Ocean', // Legacy deals are Ocean cruises
            source: 'LEGACY'
        }));
        
        // Update global variables if they exist
        if (typeof window.allDeals !== 'undefined') {
            window.allDeals = formattedDeals;
            window.filteredDeals = [...formattedDeals];
        }
        
        // Render deals
        renderDealsEmergency(formattedDeals);
        
        // Setup filters
        setupFiltersEmergency();
        
        console.log(`🎉 Successfully displayed ${formattedDeals.length} cruise deals`);
        
    } catch (error) {
        console.error('❌ Emergency fix failed:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 text-xl mb-4">⚠️ Unable to load cruise deals</div>
                <p class="text-slate-600 mb-4">${error.message}</p>
                <button onclick="window.loadDealsEmergencyFix()" class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                    Try Again
                </button>
            </div>
        `;
    }
};

function renderDealsEmergency(deals) {
    const container = document.getElementById('deals-container');
    
    if (deals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600">No cruise deals found</p>
            </div>
        `;
        return;
    }
    
    const dealsHTML = deals.map(deal => {
        const bestPrice = getBestPriceEmergency(deal);
        const priceDisplay = bestPrice ? `From $${bestPrice.toLocaleString()}` : 'Quote Available';
        
        return `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-slate-800">${deal.shipName}</h3>
                            <p class="text-orange-600 font-semibold">${deal.cruiseLine}</p>
                        </div>
                        <div class="text-right">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${deal.cruiseType}</span>
                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs ml-1">${deal.source}</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-slate-600"><strong>Destination:</strong> ${deal.region}</p>
                        <p class="text-slate-600"><strong>Duration:</strong> ${deal.nights} nights</p>
                        <p class="text-slate-600"><strong>Departure:</strong> ${deal.departureDate}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
                        ${deal.insidePrice ? `<div class="text-center p-2 bg-slate-50 rounded"><span class="block text-slate-500 text-xs">Inside</span><span class="font-semibold">$${deal.insidePrice}</span></div>` : ''}
                        ${deal.oceanviewPrice ? `<div class="text-center p-2 bg-slate-50 rounded"><span class="block text-slate-500 text-xs">Oceanview</span><span class="font-semibold">$${deal.oceanviewPrice}</span></div>` : ''}
                        ${deal.balconyPrice ? `<div class="text-center p-2 bg-slate-50 rounded"><span class="block text-slate-500 text-xs">Balcony</span><span class="font-semibold">$${deal.balconyPrice}</span></div>` : ''}
                        ${deal.suitePrice ? `<div class="text-center p-2 bg-slate-50 rounded"><span class="block text-slate-500 text-xs">Suite</span><span class="font-semibold">$${deal.suitePrice}</span></div>` : ''}
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600 mb-2">${priceDisplay}</div>
                        <button class="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                            Request Quote
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${dealsHTML}</div>`;
}

function getBestPriceEmergency(deal) {
    const prices = [deal.insidePrice, deal.oceanviewPrice, deal.balconyPrice, deal.suitePrice]
        .filter(price => price && price !== 'Quote Available')
        .map(price => typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price)
        .filter(price => !isNaN(price) && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
}

function setupFiltersEmergency() {
    // Make sure cruising type filter works
    const cruisingTypeFilter = document.getElementById('cruisingTypeFilter');
    if (cruisingTypeFilter && !cruisingTypeFilter.hasAttribute('data-emergency-setup')) {
        cruisingTypeFilter.setAttribute('data-emergency-setup', 'true');
        cruisingTypeFilter.addEventListener('change', function() {
            console.log('🔍 Cruising type filter changed:', this.value);
            // For now, just log - full filtering will be implemented
        });
    }
}

// Auto-run emergency fix
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(window.loadDealsEmergencyFix, 500);
    });
} else {
    setTimeout(window.loadDealsEmergencyFix, 100);
}

console.log('✅ Emergency Deals Fix Ready');