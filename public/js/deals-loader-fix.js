// Deals Loader Fix - Ensures unified cruise data loads properly
// This script enhances the existing deals page functionality

(function() {
    console.log('🚢 Deals Loader Fix - Initializing...');
    
    // Override the loadDeals function to use unified API
    window.loadUnifiedDeals = async function() {
        console.log('🌊 Loading unified cruise deals...');
        const container = document.getElementById('deals-container');
        
        try {
            // Show loading state
            if (container) {
                container.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div><p class="text-lg text-slate-600 mt-4">Loading cruise deals...</p></div>';
            }
            
            // Try unified API first
            console.log('📡 Fetching from unified API...');
            let response = await fetch('/api/unified-api?endpoint=cruise-data');
            
            let dealsData = [];
            let isUnified = false;
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.deals && result.deals.length > 0) {
                    dealsData = result.deals;
                    isUnified = true;
                    console.log(`✅ Loaded ${dealsData.length} deals from unified API (${result.summary?.river || 0} river + ${result.summary?.ocean || 0} ocean)`);
                } else {
                    console.log('⚠️ Unified API returned no deals, falling back...');
                }
            } else {
                console.log(`⚠️ Unified API failed (${response.status}), falling back...`);
            }
            
            // Fallback to legacy deals.json
            if (!isUnified) {
                console.log('🔄 Loading legacy deals...');
                response = await fetch('/deals.json');
                if (response.ok) {
                    dealsData = await response.json();
                    console.log(`✅ Loaded ${dealsData.length} legacy deals`);
                } else {
                    throw new Error('Both unified API and legacy deals failed');
                }
            }
            
            // Format deals for display
            const formattedDeals = isUnified ? formatUnifiedDeals(dealsData) : formatLegacyDeals(dealsData);
            
            // Update global variables if they exist
            if (window.allDeals !== undefined) {
                window.allDeals = formattedDeals;
                window.filteredDeals = [...formattedDeals];
            }
            
            // Render deals using existing function or create simple display
            if (typeof window.renderDeals === 'function') {
                window.renderDeals(formattedDeals);
            } else {
                renderDealsSimple(formattedDeals);
            }
            
            // Update filter options
            if (typeof window.populateFilters === 'function') {
                window.populateFilters();
            }
            
            console.log(`🎉 Successfully displayed ${formattedDeals.length} cruise deals`);
            
        } catch (error) {
            console.error('❌ Error loading deals:', error);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-red-500 text-lg mb-4">Unable to load cruise deals</div>
                        <p class="text-slate-600">${error.message}</p>
                        <button onclick="window.loadUnifiedDeals()" class="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                            Try Again
                        </button>
                    </div>
                `;
            }
        }
    };
    
    // Format unified deals
    function formatUnifiedDeals(deals) {
        return deals.map(deal => ({
            id: deal.id || generateId(),
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
            currency: 'USD',
            cruiseType: deal.cruiseType || 'Ocean',
            source: deal.source || 'UNIFIED',
            cabinTypes: deal.cabinTypes || {},
            seq: deal.id,
            year: '2025'
        }));
    }
    
    // Format legacy deals
    function formatLegacyDeals(deals) {
        return deals.map(deal => ({
            id: deal.seq || generateId(),
            cruiseLine: deal.cruiseLine || '',
            shipName: deal.shipName || '',
            departureDate: deal.departureDate || '',
            region: deal.region || 'Other',
            nights: deal.nights || '',
            from: deal.from || 'Various Ports',
            to: deal.to || 'Round Trip',
            itinerary: deal.itinerary || '',
            insidePrice: parsePrice(deal.insidePrice),
            oceanviewPrice: parsePrice(deal.oceanviewPrice),
            balconyPrice: parsePrice(deal.balconyPrice),
            suitePrice: parsePrice(deal.suitePrice),
            currency: 'USD',
            cruiseType: 'Ocean',
            source: 'LEGACY',
            cabinTypes: {},
            seq: deal.seq || '',
            year: deal.year || '2025'
        }));
    }

    function parsePrice(priceStr) {
        if (!priceStr || priceStr === 'Quote Available') {
            return null;
        }
        // Remove any non-numeric characters except for the decimal point
        const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        return isNaN(numericPrice) ? null : numericPrice;
    }
    
    // Simple deals renderer if main one doesn't exist
    function renderDealsSimple(deals) {
        const container = document.getElementById('deals-container');
        if (!container) return;
        
        if (deals.length === 0) {
            container.innerHTML = '<div class="text-center py-8"><p class="text-lg text-slate-600">No cruise deals found</p></div>';
            return;
        }
        
        const dealsHTML = deals.map(deal => `
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
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        ${formatPriceForDisplay(deal.insidePrice, 'Inside')}
                        ${formatPriceForDisplay(deal.oceanviewPrice, 'Oceanview')}
                        ${formatPriceForDisplay(deal.balconyPrice, 'Balcony')}
                        ${formatPriceForDisplay(deal.suitePrice, 'Suite')}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${dealsHTML}</div>`;
    }

    function formatPriceForDisplay(price, label) {
        if (price === null) {
            return '';
        }
        return `
            <div class="text-center">
                <span class="block text-slate-500">${label}</span>
                <span class="font-semibold">$${price.toLocaleString('en-US')}</span>
            </div>
        `;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.loadUnifiedDeals);
    } else {
        // DOM is already ready
        setTimeout(window.loadUnifiedDeals, 100);
    }
    
    console.log('✅ Deals Loader Fix - Ready');
})();