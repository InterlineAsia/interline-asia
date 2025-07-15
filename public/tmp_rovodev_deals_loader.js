// Cruise Deals Data Loader
class CruiseDealsLoader {
    constructor() {
        this.supabase = null;
        this.deals = [];
        this.filteredDeals = [];
        this.filters = {
            search: '',
            cruiseLine: '',
            cruiseType: '',
            destination: '',
            dateFrom: '',
            dateTo: ''
        };
        this.init();
    }

    async init() {
        // Initialize Supabase
        if (window.supabase) {
            this.supabase = window.supabase;
        } else if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
        
        await this.loadDeals();
        this.renderDeals();
        this.setupEventListeners();
    }

    async loadDeals() {
        try {
            // Try to load from Supabase first
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('cruise_deals')
                    .select('*')
                    .eq('is_active', true)
                    .order('departure_date', { ascending: true });

                if (!error && data && data.length > 0) {
                    this.deals = data.map(deal => this.formatDeal(deal));
                    this.filteredDeals = [...this.deals];
                    return;
                }
            }

            // Fallback to loading CSV data directly
            await this.loadFromCSV();
        } catch (error) {
            console.error('Error loading deals:', error);
            this.loadSampleDeals();
        }
    }

    async loadFromCSV() {
        try {
            // Load river cruise data
            const riverResponse = await fetch('/0807 Master Upload RIVER.csv');
            const riverCSV = await riverResponse.text();
            const riverDeals = this.parseCSV(riverCSV, 'River Cruise');

            // Load ocean cruise data
            const oceanResponse = await fetch('/1007 Master Upload Twins.csv');
            const oceanCSV = await oceanResponse.text();
            const oceanDeals = this.parseCSV(oceanCSV, 'Ocean Cruise');

            this.deals = [...riverDeals, ...oceanDeals];
            this.filteredDeals = [...this.deals];
        } catch (error) {
            console.error('Error loading CSV data:', error);
            this.loadSampleDeals();
        }
    }

    parseCSV(csvText, cruiseType) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const deals = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length - 5) { // Allow for some missing columns
                const deal = {};
                headers.forEach((header, index) => {
                    deal[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
                });

                const formattedDeal = {
                    id: `${cruiseType.toLowerCase().replace(' ', '_')}_${deal.SEQ || Math.random().toString(36).substr(2, 9)}`,
                    cruiseType: cruiseType,
                    cruiseLine: deal['Cruise Line'] || '',
                    shipName: deal.Ship || '',
                    region: deal.Region || '',
                    nights: parseInt(deal.Nights) || 0,
                    departureDate: this.parseDate(deal.Date),
                    departurePort: deal.From || '',
                    arrivalPort: deal.To || '',
                    itinerary: deal.Itinerary || '',
                    insidePrice: this.parsePrice(deal.Inside),
                    oceanviewPrice: this.parsePrice(deal.Oceanview),
                    balconyPrice: this.parsePrice(deal.Balcony),
                    suitePrice: this.parsePrice(deal.Suite),
                    shipMap: deal.Shipmap || '',
                    offerUrl: deal['Cruise Offer URL'] || '',
                    rawData: deal
                };

                if (formattedDeal.cruiseLine && formattedDeal.shipName) {
                    deals.push(formattedDeal);
                }
            }
        }

        return deals;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Handle DD-MMM-YY format
        if (dateStr.includes('-') && dateStr.length <= 9) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const day = parts[0];
                const month = parts[1];
                const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                
                const monthMap = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                
                const monthNum = monthMap[month] || month;
                return `${year}-${monthNum.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return null;
    }

    parsePrice(priceStr) {
        if (!priceStr || priceStr.toLowerCase().includes('quote')) {
            return 0;
        }
        
        const cleaned = priceStr.replace(/[$,]/g, '');
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
    }

    formatDeal(deal) {
        return {
            id: deal.id,
            cruiseType: deal.cruise_type || 'Ocean Cruise',
            cruiseLine: deal.cruise_line,
            shipName: deal.ship_name,
            region: deal.region,
            nights: deal.nights,
            departureDate: deal.departure_date,
            departurePort: deal.departure_port,
            arrivalPort: deal.arrival_port,
            itinerary: deal.itinerary,
            insidePrice: parseFloat(deal.inside_price) || 0,
            oceanviewPrice: parseFloat(deal.oceanview_price) || 0,
            balconyPrice: parseFloat(deal.balcony_price) || 0,
            suitePrice: parseFloat(deal.suite_price) || 0,
            shipMap: deal.ship_map,
            offerUrl: deal.offer_url
        };
    }

    loadSampleDeals() {
        this.deals = [
            {
                id: 'sample_1',
                cruiseType: 'River Cruise',
                cruiseLine: 'AmaWaterways',
                shipName: 'AmaBella',
                region: 'Europe',
                nights: 7,
                departureDate: '2025-07-07',
                departurePort: 'Budapest, Hungary',
                arrivalPort: 'Vilshofen, Germany',
                itinerary: 'Melodies of the Danube 2025',
                insidePrice: 3440,
                oceanviewPrice: 4040,
                balconyPrice: 4640,
                suitePrice: 0
            },
            {
                id: 'sample_2',
                cruiseType: 'Ocean Cruise',
                cruiseLine: 'Crystal',
                shipName: 'Crystal Symphony',
                region: 'Europe',
                nights: 8,
                departureDate: '2025-07-10',
                departurePort: 'Thessaloniki',
                arrivalPort: 'Civitavecchia (Rome)',
                itinerary: 'Greek Isles & Italy',
                insidePrice: 3340,
                oceanviewPrice: 5090,
                balconyPrice: 6290,
                suitePrice: 0
            }
        ];
        this.filteredDeals = [...this.deals];
    }

    getCruiseLineLogo(cruiseLine) {
        if (!cruiseLine) return '/logos/cruiselines/placeholder.txt';
        
        const slug = cruiseLine.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        
        return `/logos/cruiselines/${slug}.txt`;
    }

    formatPrice(price) {
        if (!price || price === 0) {
            return 'Quote Available';
        }
        return `From $${price.toLocaleString()} per person`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return date.toLocaleDateString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getLowestPrice(deal) {
        const prices = [deal.insidePrice, deal.oceanviewPrice, deal.balconyPrice, deal.suitePrice]
            .filter(p => p && p > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
    }

    applyFilters() {
        this.filteredDeals = this.deals.filter(deal => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${deal.cruiseLine} ${deal.shipName} ${deal.region} ${deal.itinerary}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }

            // Cruise line filter
            if (this.filters.cruiseLine && deal.cruiseLine !== this.filters.cruiseLine) {
                return false;
            }

            // Cruise type filter
            if (this.filters.cruiseType && deal.cruiseType !== this.filters.cruiseType) {
                return false;
            }

            // Destination filter
            if (this.filters.destination) {
                const destTerm = this.filters.destination.toLowerCase();
                if (!deal.region.toLowerCase().includes(destTerm)) return false;
            }

            // Date filters
            if (this.filters.dateFrom && deal.departureDate < this.filters.dateFrom) {
                return false;
            }
            if (this.filters.dateTo && deal.departureDate > this.filters.dateTo) {
                return false;
            }

            return true;
        });

        this.renderDeals();
    }

    renderDeals() {
        const container = document.getElementById('deals-container');
        const summaryElement = document.getElementById('deals-summary');
        
        if (!container) return;

        // Update summary
        if (summaryElement) {
            summaryElement.textContent = `Showing ${this.filteredDeals.length} of ${this.deals.length} deals`;
        }

        if (this.filteredDeals.length === 0) {
            container.innerHTML = `
                <div class="no-deals">
                    <i class="ri-ship-line"></i>
                    <h3>No deals found</h3>
                    <p>Try adjusting your filters to see more results.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredDeals.map(deal => `
            <div class="deal-card" data-deal-id="${deal.id}">
                <div class="deal-header">
                    <img src="${this.getCruiseLineLogo(deal.cruiseLine)}" 
                         alt="${deal.cruiseLine}" 
                         class="cruise-logo"
                         onerror="this.src='/logos/cruiselines/placeholder.txt'">
                    <div class="cruise-type-badge ${deal.cruiseType.toLowerCase().replace(' ', '-')}">${deal.cruiseType}</div>
                </div>
                
                <div class="deal-content">
                    <h3 class="ship-name">${deal.shipName}</h3>
                    <p class="cruise-line">${deal.cruiseLine}</p>
                    
                    <div class="deal-details">
                        <div class="detail-item">
                            <i class="ri-map-pin-line"></i>
                            <span>${deal.region || deal.departurePort}</span>
                        </div>
                        <div class="detail-item">
                            <i class="ri-calendar-line"></i>
                            <span>${this.formatDate(deal.departureDate)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="ri-time-line"></i>
                            <span>${deal.nights} nights</span>
                        </div>
                    </div>
                    
                    ${deal.itinerary ? `<p class="itinerary">${deal.itinerary}</p>` : ''}
                    
                    <div class="pricing">
                        <span class="price ${this.getLowestPrice(deal) > 0 ? 'has-price' : 'quote-only'}">
                            ${this.formatPrice(this.getLowestPrice(deal))}
                        </span>
                    </div>
                </div>
                
                <div class="deal-actions">
                    <button class="btn-view-details" onclick="window.location.href='/deal-details.html?id=${deal.id}'">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const cruiseLineFilter = document.getElementById('cruise-line-filter');
        if (cruiseLineFilter) {
            // Populate cruise line options
            const cruiseLines = [...new Set(this.deals.map(d => d.cruiseLine))].sort();
            cruiseLineFilter.innerHTML = '<option value="">All Cruise Lines</option>' +
                cruiseLines.map(line => `<option value="${line}">${line}</option>`).join('');
            
            cruiseLineFilter.addEventListener('change', (e) => {
                this.filters.cruiseLine = e.target.value;
                this.applyFilters();
            });
        }

        const cruiseTypeFilter = document.getElementById('cruise-type-filter');
        if (cruiseTypeFilter) {
            cruiseTypeFilter.addEventListener('change', (e) => {
                this.filters.cruiseType = e.target.value;
                this.applyFilters();
            });
        }

        const destinationFilter = document.getElementById('destination-filter');
        if (destinationFilter) {
            destinationFilter.addEventListener('input', (e) => {
                this.filters.destination = e.target.value;
                this.applyFilters();
            });
        }

        const dateFromFilter = document.getElementById('date-from-filter');
        if (dateFromFilter) {
            dateFromFilter.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }

        const dateToFilter = document.getElementById('date-to-filter');
        if (dateToFilter) {
            dateToFilter.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.applyFilters();
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cruiseDealsLoader = new CruiseDealsLoader();
});