// Advanced Caching System for Cruise Data
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 100;
        this.init();
    }

    init() {
        // Clean expired entries every minute
        setInterval(() => this.cleanExpired(), 60000);
        
        // Preload critical data
        this.preloadCriticalData();
    }

    // Set cache with TTL
    set(key, value, ttl = this.defaultTTL) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.delete(oldestKey);
        }

        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttl);
        
        console.log(`Cache SET: ${key} (TTL: ${ttl}ms)`);
    }

    // Get from cache
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const expiry = this.ttl.get(key);
        if (Date.now() > expiry) {
            this.delete(key);
            return null;
        }

        console.log(`Cache HIT: ${key}`);
        return this.cache.get(key);
    }

    // Delete from cache
    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
        console.log(`Cache DELETE: ${key}`);
    }

    // Clean expired entries
    cleanExpired() {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.delete(key);
            }
        }
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        this.ttl.clear();
        console.log('Cache CLEARED');
    }

    // Get cache stats
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }

    // Preload critical data
    async preloadCriticalData() {
        try {
            // Cache cruise regions
            const regions = await this.fetchCruiseRegions();
            this.set('cruise_regions', regions, 30 * 60 * 1000); // 30 minutes

            // Cache cruise lines
            const cruiseLines = await this.fetchCruiseLines();
            this.set('cruise_lines', cruiseLines, 30 * 60 * 1000);

            // Cache popular destinations
            const destinations = await this.fetchPopularDestinations();
            this.set('popular_destinations', destinations, 15 * 60 * 1000);

        } catch (error) {
            console.error('Failed to preload critical data:', error);
        }
    }

    // Fetch cruise regions
    async fetchCruiseRegions() {
        const cached = this.get('cruise_regions');
        if (cached) return cached;

        // Extract unique regions from cruise data
        const regions = [...new Set(window.cruiseData?.map(cruise => cruise.region).filter(Boolean))];
        return regions.sort();
    }

    // Fetch cruise lines
    async fetchCruiseLines() {
        const cached = this.get('cruise_lines');
        if (cached) return cached;

        // Extract unique cruise lines from cruise data
        const cruiseLines = [...new Set(window.cruiseData?.map(cruise => cruise.cruiseLine).filter(Boolean))];
        return cruiseLines.sort();
    }

    // Fetch popular destinations
    async fetchPopularDestinations() {
        const cached = this.get('popular_destinations');
        if (cached) return cached;

        // Get top destinations by frequency
        const destinationCounts = {};
        window.cruiseData?.forEach(cruise => {
            if (cruise.arrivalPort) {
                destinationCounts[cruise.arrivalPort] = (destinationCounts[cruise.arrivalPort] || 0) + 1;
            }
        });

        const popular = Object.entries(destinationCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([destination]) => destination);

        return popular;
    }

    // Advanced query caching with filters
    cacheQuery(filters, results) {
        const key = this.generateQueryKey(filters);
        this.set(key, results, 10 * 60 * 1000); // 10 minutes for search results
    }

    // Get cached query results
    getCachedQuery(filters) {
        const key = this.generateQueryKey(filters);
        return this.get(key);
    }

    // Generate cache key from filters
    generateQueryKey(filters) {
        const sortedFilters = Object.keys(filters)
            .sort()
            .reduce((result, key) => {
                result[key] = filters[key];
                return result;
            }, {});
        
        return `query_${btoa(JSON.stringify(sortedFilters))}`;
    }

    // Cache cruise search with pagination
    cachePaginatedResults(filters, page, results) {
        const key = `${this.generateQueryKey(filters)}_page_${page}`;
        this.set(key, results, 5 * 60 * 1000); // 5 minutes for paginated results
    }

    // Get cached paginated results
    getCachedPaginatedResults(filters, page) {
        const key = `${this.generateQueryKey(filters)}_page_${page}`;
        return this.get(key);
    }
}

// Initialize global cache manager
window.CacheManager = new CacheManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}