/**
 * Enhanced CSV Loader - Complete Data Integrity System
 * Handles all CSV fields, auto-updates, and data validation
 */

class EnhancedCSVLoader {
    constructor() {
        this.allDeals = [];
        this.csvSources = [
            { file: '/public/data/twins.csv', type: 'Ocean Cruise', fallback: '/public/twins.csv' },
            { file: '/public/data/river.csv', type: 'River Cruise', fallback: '/public/river.csv' },
            { file: '/public/data/expeditions.csv', type: 'Expedition Cruise', fallback: null }
        ];
        this.lastLoadTime = null;
        this.loadPromise = null;
    }

    /**
     * Load all CSV data with complete field extraction
     */
    async loadAllDeals(forceReload = false) {
        // Return cached promise if already loading
        if (this.loadPromise && !forceReload) {
            return this.loadPromise;
        }

        this.loadPromise = this._performLoad();
        return this.loadPromise;
    }

    async _performLoad() {
        console.log('CSV_LOADER: Starting enhanced CSV load...');
        const startTime = Date.now();
        this.allDeals = [];

        for (const source of this.csvSources) {
            try {
                const deals = await this._loadCSVSource(source);
                this.allDeals = this.allDeals.concat(deals);
                console.log(`CSV_LOADER: Loaded ${deals.length} deals from ${source.type}`);
            } catch (error) {
                console.warn(`CSV_LOADER: Failed to load ${source.type}:`, error);
            }
        }

        this.lastLoadTime = Date.now();
        const loadTime = this.lastLoadTime - startTime;
        console.log(`CSV_LOADER: Complete! Loaded ${this.allDeals.length} total deals in ${loadTime}ms`);

        return this.allDeals;
    }

    async _loadCSVSource(source) {
        let csvText = null;
        let sourceUsed = null;

        // Try primary source first, then fallback
        for (const url of [source.file, source.fallback].filter(Boolean)) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    csvText = await response.text();
                    sourceUsed = url;
                    break;
                }
            } catch (error) {
                console.warn(`CSV_LOADER: Failed to fetch ${url}:`, error);
            }
        }

        if (!csvText) {
            throw new Error(`No valid CSV source found for ${source.type}`);
        }

        console.log(`CSV_LOADER: Using ${sourceUsed} for ${source.type}`);
        return this._parseCSVWithAllFields(csvText, source.type);
    }

    /**
     * Parse CSV with complete field extraction - no data loss
     */
    _parseCSVWithAllFields(csvText, cruiseType) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = this._parseCSVLine(lines[0]);
        const deals = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this._parseCSVLine(lines[i]);
                if (values.length >= Math.min(headers.length, 5)) { // Minimum viable columns
                    const deal = this._createCompleteDeal(headers, values, cruiseType, i);
                    if (this._isValidDeal(deal)) {
                        deals.push(deal);
                    }
                }
            } catch (error) {
                console.warn(`CSV_LOADER: Skipping malformed row ${i + 1}:`, error);
            }
        }

        return deals;
    }

    _parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    /**
     * Create deal object with ALL CSV fields preserved
     */
    _createCompleteDeal(headers, values, cruiseType, rowIndex) {
        // Create base deal object with all CSV fields
        const rawDeal = {};
        headers.forEach((header, index) => {
            rawDeal[header] = values[index] || '';
        });

        // Determine actual cruise type based on content analysis
        const actualCruiseType = this._determineCruiseType(rawDeal, cruiseType);

        // Extract and normalize all fields
        const deal = {
            // Core identifiers
            id: this._generateDealId(rawDeal, actualCruiseType, rowIndex),
            cruiseType: actualCruiseType,
            
            // Basic cruise info
            cruiseLine: this._extractField(rawDeal, ['Cruise Line', 'CruiseLine', 'Line']),
            shipName: this._extractField(rawDeal, ['Ship', 'Ship Name', 'Vessel']),
            region: this._extractField(rawDeal, ['Region', 'Destination Region', 'Area']),
            
            // Dates and duration
            nights: this._parseNumber(this._extractField(rawDeal, ['Nights', 'Duration', 'Days'])),
            departureDate: this._parseDate(this._extractField(rawDeal, ['Date', 'Departure Date', 'Sail Date'])),
            saleEndDate: this._parseDate(this._extractField(rawDeal, ['Sale', 'Sale End', 'Booking Deadline'])),
            
            // Ports and itinerary
            departurePort: this._extractField(rawDeal, ['From', 'Departure Port', 'Embark']),
            arrivalPort: this._extractField(rawDeal, ['To', 'Arrival Port', 'Disembark']),
            itinerary: this._extractField(rawDeal, ['Itinerary', 'Route', 'Description']),
            
            // Pricing (all cabin types)
            insidePrice: this._parsePrice(this._extractField(rawDeal, ['Inside', 'Interior', 'Inside Cabin'])),
            oceanviewPrice: this._parsePrice(this._extractField(rawDeal, ['Oceanview', 'Ocean View', 'Outside'])),
            balconyPrice: this._parsePrice(this._extractField(rawDeal, ['Balcony', 'Verandah', 'Balcony Cabin'])),
            suitePrice: this._parsePrice(this._extractField(rawDeal, ['Suite', 'Premium Suite', 'Luxury Suite'])),
            
            // Visual assets (secured - no public URLs)
            mapImage: this._sanitizeImageField(this._extractField(rawDeal, ['Shipmap', 'Map', 'Route Map', 'Itinerary Map'])),
            shipImage: this._sanitizeImageField(this._extractField(rawDeal, ['Ship Image', 'Photo', 'Ship Photo'])),
            
            // Additional metadata (preserve all extra fields)
            metadata: this._extractMetadata(rawDeal, headers),
            
            // Computed fields
            cabinTypes: [],
            hasMap: false,
            isExpedition: actualCruiseType === 'Expedition Cruise',
            
            // Internal tracking
            _sourceRow: rowIndex,
            _loadTime: Date.now()
        };

        // Determine available cabin types
        deal.cabinTypes = this._determineCabinTypes(deal);
        deal.hasMap = Boolean(deal.mapImage);

        return deal;
    }

    _extractField(rawDeal, possibleKeys) {
        for (const key of possibleKeys) {
            if (rawDeal[key] && rawDeal[key].trim()) {
                return rawDeal[key].trim();
            }
        }
        return '';
    }

    _extractMetadata(rawDeal, headers) {
        const metadata = {};
        const coreFields = [
            'Cruise Line', 'Ship', 'Region', 'Nights', 'Date', 'Sale', 'From', 'To', 
            'Itinerary', 'Inside', 'Oceanview', 'Balcony', 'Suite', 'Shipmap'
        ];
        
        headers.forEach(header => {
            if (!coreFields.includes(header) && rawDeal[header]) {
                metadata[header] = rawDeal[header];
            }
        });
        
        return metadata;
    }

    _determineCruiseType(rawDeal, defaultType) {
        const region = (rawDeal.Region || '').toLowerCase();
        const itinerary = (rawDeal.Itinerary || '').toLowerCase();
        const ship = (rawDeal.Ship || '').toLowerCase();
        
        // Check for expedition indicators
        const expeditionKeywords = ['arctic', 'antarctic', 'expedition', 'polar', 'explorer', 'zodiac'];
        const isExpedition = expeditionKeywords.some(keyword => 
            region.includes(keyword) || itinerary.includes(keyword) || ship.includes(keyword)
        );
        
        if (isExpedition) {
            return 'Expedition Cruise';
        }
        
        // Check for river cruise indicators
        const riverKeywords = ['river', 'danube', 'rhine', 'seine', 'mekong', 'nile', 'volga'];
        const isRiver = riverKeywords.some(keyword => 
            region.includes(keyword) || itinerary.includes(keyword)
        );
        
        if (isRiver) {
            return 'River Cruise';
        }
        
        return defaultType;
    }

    _generateDealId(rawDeal, cruiseType, rowIndex) {
        const seq = rawDeal.SEQ || rawDeal.ID || rowIndex;
        const typeSlug = cruiseType.toLowerCase().replace(/\s+/g, '_');
        return `${typeSlug}_${seq}_${Date.now().toString(36)}`;
    }

    _parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Handle DD-MMM-YY format (e.g., "07-Jul-25")
        if (dateStr.includes('-') && dateStr.length <= 9) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const monthMap = {
                    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
                };
                const month = monthMap[parts[1].toLowerCase()];
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(year, month, day);
                }
            }
        }
        
        // Try standard date parsing
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }

    _parsePrice(priceStr) {
        if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
        const cleaned = priceStr.replace(/[$,]/g, '');
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
    }

    _parseNumber(numStr) {
        if (!numStr) return 0;
        const num = parseInt(numStr);
        return isNaN(num) ? 0 : num;
    }

    _sanitizeImageField(imageStr) {
        if (!imageStr) return '';
        
        // Remove any full URLs for security - only allow relative paths or filenames
        if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
            console.warn('CSV_LOADER: Removing external URL from image field for security');
            return '';
        }
        
        // Allow relative paths and filenames only
        return imageStr.replace(/[^a-zA-Z0-9._/-]/g, '');
    }

    _determineCabinTypes(deal) {
        const types = [];
        if (deal.insidePrice > 0) types.push('Interior');
        if (deal.oceanviewPrice > 0) types.push('Oceanview');
        if (deal.balconyPrice > 0) types.push('Balcony');
        if (deal.suitePrice > 0) types.push('Suite');
        return types;
    }

    _isValidDeal(deal) {
        return deal.cruiseLine && deal.shipName && (
            deal.insidePrice > 0 || 
            deal.oceanviewPrice > 0 || 
            deal.balconyPrice > 0 || 
            deal.suitePrice > 0 ||
            deal.itinerary
        );
    }

    /**
     * Get deals with optional filtering
     */
    getDeals(filters = {}) {
        let deals = [...this.allDeals];
        
        if (filters.cruiseType) {
            deals = deals.filter(d => d.cruiseType === filters.cruiseType);
        }
        
        if (filters.cruiseLine) {
            deals = deals.filter(d => d.cruiseLine === filters.cruiseLine);
        }
        
        if (filters.hasMap) {
            deals = deals.filter(d => d.hasMap);
        }
        
        return deals;
    }

    /**
     * Get deal by ID
     */
    getDealById(id) {
        return this.allDeals.find(d => d.id === id);
    }

    /**
     * Get unique values for filters
     */
    getUniqueValues(field) {
        return [...new Set(this.allDeals.map(d => d[field]).filter(Boolean))].sort();
    }

    /**
     * Check if data needs refresh (optional cache busting)
     */
    needsRefresh(maxAge = 5 * 60 * 1000) { // 5 minutes default
        return !this.lastLoadTime || (Date.now() - this.lastLoadTime) > maxAge;
    }

    /**
     * Force reload data
     */
    async refresh() {
        this.loadPromise = null;
        return this.loadAllDeals(true);
    }
}

// Global instance
window.csvLoader = new EnhancedCSVLoader();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('CSV_LOADER: Enhanced CSV loader initialized');
});