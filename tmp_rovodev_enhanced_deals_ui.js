// Enhanced Deals UI - Improved Visual Design and Individual Deal Pages
// Handles cruise type badges, logos, and enhanced styling

class EnhancedDealsUI {
    constructor() {
        this.cruiseTypeColors = {
            'Ocean Cruise': { bg: '#e0f2fe', color: '#0277bd', border: '#81d4fa' },
            'River Cruise': { bg: '#e8f5e8', color: '#2e7d32', border: '#a5d6a7' },
            'Expedition Cruise': { bg: '#fff3e0', color: '#f57c00', border: '#ffcc02' }
        };
    }

    // Enhanced deal card rendering
    renderDealCard(deal, index) {
        const shipName = deal.ship_name || 'Cruise Ship';
        const cruiseLine = deal.cruise_line || 'Cruise Line';
        const destination = deal.destination || 'Destination';
        const duration = deal.duration || '7';
        const cruiseType = deal.cruise_type || 'Ocean Cruise';
        const price = deal.inside_price || deal.price || 'TBA';
        const departureDate = deal.departure_date || '';
        const itinerary = deal.itinerary || '';
        
        // Get cruise type styling
        const typeStyle = this.cruiseTypeColors[cruiseType] || this.cruiseTypeColors['Ocean Cruise'];
        
        // Format date
        let dateDisplay = '';
        if (departureDate) {
            try {
                const date = new Date(departureDate);
                if (!isNaN(date.getTime())) {
                    dateDisplay = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                }
            } catch (e) {
                dateDisplay = departureDate;
            }
        }
        
        // Format price
        let priceDisplay = 'Price TBA';
        if (price && price !== 'TBA' && !isNaN(parseFloat(price))) {
            priceDisplay = `From $${parseFloat(price).toLocaleString()}`;
        }
        
        // Get cruise line logo
        const logoUrl = this.getCruiseLineLogo(cruiseLine);
        
        return `
            <div class="enhanced-deal-card" onclick="openIndividualDealPage('${deal.id || index}')" 
                 style="cursor: pointer; transition: all 0.3s ease;">
                <div class="deal-card-content">
                    <!-- Header with Logo and Type Badge -->
                    <div class="deal-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div class="logo-section" style="display: flex; align-items: center; gap: 0.75rem;">
                            <img src="${logoUrl}" alt="${cruiseLine}" class="cruise-logo" 
                                 style="width: 60px; height: 40px; object-fit: contain; border-radius: 4px; border: 1px solid #e5e7eb;"
                                 onerror="this.src='/logos/cruiselines/placeholder.png'">
                            <div>
                                <h3 style="margin: 0; color: #1e293b; font-size: 1.25rem; font-weight: 600; line-height: 1.2;">${shipName}</h3>
                                <p style="margin: 0; color: #6b7280; font-size: 0.9rem; font-weight: 500;">${cruiseLine}</p>
                            </div>
                        </div>
                        <span class="cruise-type-badge" style="
                            background: ${typeStyle.bg}; 
                            color: ${typeStyle.color}; 
                            border: 1px solid ${typeStyle.border};
                            padding: 0.25rem 0.75rem; 
                            border-radius: 20px; 
                            font-size: 0.75rem; 
                            font-weight: 600;
                            white-space: nowrap;
                        ">${cruiseType}</span>
                    </div>
                    
                    <!-- Destination and Itinerary -->
                    <div class="destination-section" style="margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0 0 0.5rem 0; color: #374151; font-weight: 500; display: flex; align-items: center;">
                            <i class="ri-map-pin-line" style="color: #3b82f6; margin-right: 0.5rem; font-size: 1.1rem;"></i>
                            ${destination}
                        </p>
                        ${itinerary ? `<p style="margin: 0; color: #6b7280; font-size: 0.85rem; line-height: 1.4;">${itinerary}</p>` : ''}
                    </div>
                    
                    <!-- Trip Details -->
                    <div class="trip-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        ${dateDisplay ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="ri-calendar-line" style="color: #059669; font-size: 1.1rem;"></i>
                                <span style="color: #374151; font-size: 0.9rem;">${dateDisplay}</span>
                            </div>
                        ` : ''}
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="ri-time-line" style="color: #7c3aed; font-size: 1.1rem;"></i>
                            <span style="color: #374151; font-size: 0.9rem;">${duration} nights</span>
                        </div>
                    </div>
                    
                    <!-- Price and Action -->
                    <div class="deal-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <div class="price-section">
                            <span style="color: #059669; font-weight: 700; font-size: 1.2rem;">${priceDisplay}</span>
                            ${price && price !== 'TBA' ? '<p style="margin: 0; color: #6b7280; font-size: 0.75rem;">per person</p>' : ''}
                        </div>
                        <button class="view-details-btn" style="
                            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                            color: white; 
                            border: none; 
                            padding: 0.75rem 1.5rem; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-size: 0.9rem; 
                            font-weight: 600;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
                            View Details
                            <i class="ri-arrow-right-line" style="margin-left: 0.5rem;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Get cruise line logo with comprehensive mapping
    getCruiseLineLogo(cruiseLine) {
        const logoMap = {
            'amawaterways': '/logos/cruiselines/amawaterways.png',
            'ama waterways': '/logos/cruiselines/amawaterways.png',
            'emerald cruises': '/logos/cruiselines/emerald-cruises.png',
            'scenic cruises': '/logos/cruiselines/scenic.png',
            'scenic': '/logos/cruiselines/scenic.png',
            'regent seven seas cruises': '/logos/cruiselines/regent.png',
            'royal caribbean': '/logos/cruiselines/royal-caribbean.png',
            'princess cruises': '/logos/cruiselines/princess.png',
            'celebrity cruises': '/logos/cruiselines/celebrity.png',
            'norwegian cruise line': '/logos/cruiselines/norwegian.png',
            'msc cruises': '/logos/cruiselines/msc.png',
            'carnival cruise line': '/logos/cruiselines/carnival.png',
            'holland america line': '/logos/cruiselines/holland-america.png',
            'cunard line': '/logos/cruiselines/cunard.png',
            'seabourn cruise line': '/logos/cruiselines/seabourn.png',
            'silversea cruises': '/logos/cruiselines/silversea.png',
            'oceania cruises': '/logos/cruiselines/oceania.png',
            'azamara': '/logos/cruiselines/azamara.png',
            'crystal cruises': '/logos/cruiselines/crystal.png',
            'atlas ocean voyages': '/logos/cruiselines/atlas.png',
            'coral expeditions': '/logos/cruiselines/coral-expeditions.png',
            'heritage expeditions': '/logos/cruiselines/heritage-expeditions.png',
            'hx hurtigruten expeditions': '/logos/cruiselines/hx-hurtigruten-expeditions.png',
            'explora journeys': '/logos/cruiselines/explora-journeys.png',
            'amadeus': '/logos/cruiselines/amadeus.png'
        };
        
        const key = cruiseLine.toLowerCase().trim();
        return logoMap[key] || '/logos/cruiselines/placeholder.png';
    }

    // Enhanced CSS styles
    getEnhancedStyles() {
        return `
            <style>
                .enhanced-deal-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    transition: all 0.3s ease;
                    border: 1px solid #e5e7eb;
                    margin-bottom: 1.5rem;
                }
                
                .enhanced-deal-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06);
                    border-color: #3b82f6;
                }
                
                .deal-card-content {
                    padding: 1.5rem;
                }
                
                .deals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                
                @media (max-width: 768px) {
                    .deals-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    
                    .enhanced-deal-card .deal-header {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .enhanced-deal-card .trip-details {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }
                }
                
                .filter-section {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    margin-bottom: 2rem;
                    border: 1px solid #e5e7eb;
                }
                
                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .filter-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #374151;
                    font-size: 0.9rem;
                }
                
                .filter-group input,
                .filter-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: border-color 0.3s ease;
                }
                
                .filter-group input:focus,
                .filter-group select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .page-header {
                    text-align: center;
                    padding: 3rem 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin-bottom: 2rem;
                }
                
                .page-header h1 {
                    font-size: 3rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .page-header p {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    max-width: 600px;
                    margin: 0 auto;
                }
            </style>
        `;
    }
}

// Individual Deal Page Functions
function openIndividualDealPage(dealId) {
    // Find the deal
    const deal = window.allCruiseDeals?.find(d => (d.id || d.seq) == dealId) || 
                 window.filteredDeals?.find(d => (d.id || d.seq) == dealId);
    
    if (!deal) {
        console.error('Deal not found:', dealId);
        return;
    }
    
    // Create URL-friendly parameters
    const params = new URLSearchParams({
        id: dealId,
        ship: deal.ship_name || '',
        cruise_line: deal.cruise_line || '',
        destination: deal.destination || '',
        departure_date: deal.departure_date || '',
        duration: deal.duration || '',
        cruise_type: deal.cruise_type || 'Ocean Cruise'
    });
    
    // Open individual deal page
    window.open(`/deal-details.html?${params.toString()}`, '_blank');
}

// Export for use
window.EnhancedDealsUI = EnhancedDealsUI;