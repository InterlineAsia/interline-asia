// Advanced Cruise Query Service with Filtering and Pagination
class CruiseQueryService {
    constructor() {
        this.cache = window.CacheManager;
        this.cruiseData = [];
        this.indexes = {};
        this.init();
    }

    async init() {
        await this.loadCruiseData();
        this.buildIndexes();
    }

    // Load cruise data from multiple sources
    async loadCruiseData() {
        try {
            // Check cache first
            const cachedData = this.cache.get('all_cruise_data');
            if (cachedData) {
                this.cruiseData = cachedData;
                return;
            }

            console.log('Loading fresh cruise data...');
            this.cruiseData = [];

            // Load from CSV files
            await this.loadFromCSV('/river.csv', 'River Cruise');
            await this.loadFromCSV('/twins.csv', 'Ocean Cruise');

            // Cache the loaded data
            this.cache.set('all_cruise_data', this.cruiseData, 30 * 60 * 1000); // 30 minutes

            console.log(`Loaded ${this.cruiseData.length} total cruises`);

        } catch (error) {
            console.error('Failed to load cruise data:', error);
        }
    }

    // Load data from CSV file
    async loadFromCSV(filename, cruiseType) {
        try {
            const response = await fetch(filename);
            if (!response.ok) return;

            const csvText = await response.text();
            const cruises = this.parseCSV(csvText, cruiseType);
            this.cruiseData = this.cruiseData.concat(cruises);

        } catch (error) {
            console.warn(`Failed to load ${filename}:`, error);
        }
    }

    // Parse CSV data
    parseCSV(csvText, cruiseType) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const cruises = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                const cruise = this.createCruiseObject(headers, values, cruiseType);
                if (cruise && cruise.cruiseLine && cruise.shipName) {
                    cruises.push(cruise);
                }
            } catch (error) {
                console.warn(`Skipping row ${i}:`, error);
            }
        }

        return cruises;
    }

    // Parse CSV line handling quotes
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/"/g, ''));
        return result;
    }

    // Create cruise object from CSV data
    createCruiseObject(headers, values, cruiseType) {
        const cruise = {};
        headers.forEach((header, index) => {
            cruise[header] = values[index] || '';
        });

        return {
            id: `${cruiseType}_${Date.now()}_${Math.random()}`,
            cruiseType: cruiseType,
            cruiseLine: cruise['Cruise Line'] || '',
            shipName: cruise.Ship || '',
            region: cruise.Region || '',
            nights: parseInt(cruise.Nights || 0),
            departureDate: cruise.Date || '',
            departurePort: cruise.From || '',
            arrivalPort: cruise.To || '',
            itinerary: cruise.Itinerary || '',
            insidePrice: this.parsePrice(cruise.Inside),
            oceanviewPrice: this.parsePrice(cruise.Oceanview),
            balconyPrice: this.parsePrice(cruise.Balcony),
            suitePrice: this.parsePrice(cruise.Suite),
            source: 'csv'
        };
    }

    // Parse price string to number
    parsePrice(priceStr) {
        if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
        const cleaned = priceStr.replace(/[$,]/g, '');
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
    }

    // Build search indexes for fast filtering
    buildIndexes() {
        console.log('Building search indexes...');
        
        this.indexes = {
            byRegion: {},
            byCruiseLine: {},
            byDeparturePort: {},
            byArrivalPort: {},
            byMonth: {},
            byPriceRange: {
                budget: [],      // Under $1000
                moderate: [],    // $1000-2500
                luxury: [],      // $2500-5000
                premium: []      // Over $5000
            },
            byNights: {}
        };

        this.cruiseData.forEach((cruise, index) => {
            // Index by region
            this.addToIndex(this.indexes.byRegion, cruise.region?.toLowerCase() || 'other', index);

            // Index by cruise line
            this.addToIndex(this.indexes.byCruiseLine, cruise.cruiseLine?.toLowerCase() || 'unknown', index);

            // Index by departure port
            this.addToIndex(this.indexes.byDeparturePort, cruise.departurePort?.toLowerCase() || 'unknown', index);

            // Index by arrival port
            this.addToIndex(this.indexes.byArrivalPort, cruise.arrivalPort?.toLowerCase() || 'unknown', index);

            // Index by month
            if (cruise.departureDate) {
                const month = new Date(cruise.departureDate).getMonth();
                this.addToIndex(this.indexes.byMonth, month, index);
            }

            // Index by nights
            if (cruise.nights > 0) {
                this.addToIndex(this.indexes.byNights, cruise.nights, index);
            }

            // Index by price range
            const lowestPrice = this.getLowestPrice(cruise);
            if (lowestPrice < 1000) {
                this.indexes.byPriceRange.budget.push(index);
            } else if (lowestPrice < 2500) {
                this.indexes.byPriceRange.moderate.push(index);
            } else if (lowestPrice < 5000) {
                this.indexes.byPriceRange.luxury.push(index);
            } else if (lowestPrice < Infinity) {
                this.indexes.byPriceRange.premium.push(index);
            }
        });

        console.log('Search indexes built successfully');
    }

    // Helper to add to index
    addToIndex(index, key, value) {
        if (!index[key]) {
            index[key] = [];
        }
        index[key].push(value);
    }

    // Get lowest price for a cruise
    getLowestPrice(cruise) {
        const prices = [
            cruise.insidePrice,
            cruise.oceanviewPrice,
            cruise.balconyPrice,
            cruise.suitePrice
        ].filter(price => price && price > 0);

        return prices.length > 0 ? Math.min(...prices) : Infinity;
    }

    // Advanced cruise search with multiple filters
    async searchCruises(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'price',
            sortOrder = 'asc'
        } = options;

        // Check cache first
        const cacheKey = { ...filters, page, limit, sortBy, sortOrder };
        const cached = this.cache.getCachedQuery(cacheKey);
        if (cached) {
            console.log('Returning cached search results');
            return cached;
        }

        console.log('Performing fresh search with filters:', filters);

        let candidateIndexes = new Set();
        let hasFilters = false;

        // Apply region filter
        if (filters.region) {
            const regionKey = filters.region.toLowerCase();
            if (this.indexes.byRegion[regionKey]) {
                this.indexes.byRegion[regionKey].forEach(idx => candidateIndexes.add(idx));
                hasFilters = true;
            }
        }

        // Apply cruise line filter
        if (filters.cruiseLine) {
            const lineKey = filters.cruiseLine.toLowerCase();
            if (this.indexes.byCruiseLine[lineKey]) {
                if (hasFilters) {
                    candidateIndexes = new Set([...candidateIndexes].filter(idx => 
                        this.indexes.byCruiseLine[lineKey].includes(idx)
                    ));
                } else {
                    this.indexes.byCruiseLine[lineKey].forEach(idx => candidateIndexes.add(idx));
                    hasFilters = true;
                }
            }
        }

        // Apply departure port filter
        if (filters.departurePort) {
            const portKey = filters.departurePort.toLowerCase();
            if (this.indexes.byDeparturePort[portKey]) {
                if (hasFilters) {
                    candidateIndexes = new Set([...candidateIndexes].filter(idx => 
                        this.indexes.byDeparturePort[portKey].includes(idx)
                    ));
                } else {
                    this.indexes.byDeparturePort[portKey].forEach(idx => candidateIndexes.add(idx));
                    hasFilters = true;
                }
            }
        }

        // Apply price range filter
        if (filters.priceRange) {
            const priceIndexes = this.indexes.byPriceRange[filters.priceRange] || [];
            if (hasFilters) {
                candidateIndexes = new Set([...candidateIndexes].filter(idx => 
                    priceIndexes.includes(idx)
                ));
            } else {
                priceIndexes.forEach(idx => candidateIndexes.add(idx));
                hasFilters = true;
            }
        }

        // Apply nights filter
        if (filters.nights) {
            const nightsIndexes = this.indexes.byNights[filters.nights] || [];
            if (hasFilters) {
                candidateIndexes = new Set([...candidateIndexes].filter(idx => 
                    nightsIndexes.includes(idx)
                ));
            } else {
                nightsIndexes.forEach(idx => candidateIndexes.add(idx));
                hasFilters = true;
            }
        }

        // If no filters, use all cruises
        if (!hasFilters) {
            candidateIndexes = new Set(this.cruiseData.map((_, idx) => idx));
        }

        // Convert indexes to cruise objects
        let results = Array.from(candidateIndexes).map(idx => this.cruiseData[idx]);

        // Apply additional filters that can't be indexed
        if (filters.minPrice || filters.maxPrice) {
            results = results.filter(cruise => {
                const price = this.getLowestPrice(cruise);
                if (filters.minPrice && price < filters.minPrice) return false;
                if (filters.maxPrice && price > filters.maxPrice) return false;
                return true;
            });
        }

        if (filters.dateFrom || filters.dateTo) {
            results = results.filter(cruise => {
                if (!cruise.departureDate) return false;
                const cruiseDate = new Date(cruise.departureDate);
                if (filters.dateFrom && cruiseDate < new Date(filters.dateFrom)) return false;
                if (filters.dateTo && cruiseDate > new Date(filters.dateTo)) return false;
                return true;
            });
        }

        // Sort results
        results = this.sortResults(results, sortBy, sortOrder);

        // Calculate pagination
        const total = results.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedResults = results.slice(offset, offset + limit);

        const searchResult = {
            results: paginatedResults,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: filters,
            timestamp: Date.now()
        };

        // Cache the results
        this.cache.cacheQuery(cacheKey, searchResult);

        return searchResult;
    }

    // Sort results by various criteria
    sortResults(results, sortBy, sortOrder) {
        const direction = sortOrder === 'desc' ? -1 : 1;

        return results.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'price':
                    aValue = this.getLowestPrice(a);
                    bValue = this.getLowestPrice(b);
                    break;
                case 'date':
                    aValue = new Date(a.departureDate || 0);
                    bValue = new Date(b.departureDate || 0);
                    break;
                case 'nights':
                    aValue = a.nights || 0;
                    bValue = b.nights || 0;
                    break;
                case 'cruiseLine':
                    aValue = a.cruiseLine || '';
                    bValue = b.cruiseLine || '';
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return -1 * direction;
            if (aValue > bValue) return 1 * direction;
            return 0;
        });
    }

    // Get cruise by ID
    getCruiseById(id) {
        return this.cruiseData.find(cruise => cruise.id === id);
    }

    // Get cruise statistics
    getStatistics() {
        const stats = {
            totalCruises: this.cruiseData.length,
            regions: Object.keys(this.indexes.byRegion).length,
            cruiseLines: Object.keys(this.indexes.byCruiseLine).length,
            departurePorts: Object.keys(this.indexes.byDeparturePort).length,
            priceRanges: {
                budget: this.indexes.byPriceRange.budget.length,
                moderate: this.indexes.byPriceRange.moderate.length,
                luxury: this.indexes.byPriceRange.luxury.length,
                premium: this.indexes.byPriceRange.premium.length
            }
        };

        return stats;
    }

    // Refresh data
    async refreshData() {
        this.cache.delete('all_cruise_data');
        await this.loadCruiseData();
        this.buildIndexes();
        console.log('Cruise data refreshed');
    }
}

// Initialize global cruise query service
window.CruiseQueryService = new CruiseQueryService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CruiseQueryService;
}