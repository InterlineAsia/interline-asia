// Cache Manager - Interline Asia Enterprise
// Basic caching system using localStorage with TTL support

class CacheManager {
  constructor() {
    this.defaultTTL = 30 * 60 * 1000; // 30 minutes
    this.maxCacheSize = 50; // Maximum number of cached items
    this.cachePrefix = 'interline_cache_';
    
    // Initialize cleanup
    this.setupPeriodicCleanup();
  }

  // Set cache item with TTL
  set(key, data, ttl = this.defaultTTL) {
    try {
      const cacheItem = {
        data: data,
        timestamp: Date.now(),
        ttl: ttl,
        expires: Date.now() + ttl
      };

      const cacheKey = this.cachePrefix + key;
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));

      // Cleanup old items if cache is getting too large
      this.cleanupIfNeeded();

      return true;
    } catch (error) {
      console.warn('Cache set failed:', error.message);
      return false;
    }
  }

  // Get cache item (returns null if expired or not found)
  get(key) {
    try {
      const cacheKey = this.cachePrefix + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expires) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get failed:', error.message);
      return null;
    }
  }

  // Delete cache item
  delete(key) {
    try {
      const cacheKey = this.cachePrefix + key;
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn('Cache delete failed:', error.message);
      return false;
    }
  }

  // Check if cache item exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear all cache items
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Cache clear failed:', error.message);
      return false;
    }
  }

  // Get cache statistics
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      let validItems = 0;
      let expiredItems = 0;

      cacheKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          totalSize += item.length;
          
          const cacheItem = JSON.parse(item);
          if (Date.now() > cacheItem.expires) {
            expiredItems++;
          } else {
            validItems++;
          }
        } catch (error) {
          // Invalid cache item
          expiredItems++;
        }
      });

      return {
        totalItems: cacheKeys.length,
        validItems,
        expiredItems,
        totalSize,
        maxSize: this.maxCacheSize
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Cleanup expired items
  cleanup() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      let cleanedCount = 0;

      cacheKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          const cacheItem = JSON.parse(item);
          
          if (Date.now() > cacheItem.expires) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove invalid cache items
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      console.log(`Cache cleanup: removed ${cleanedCount} expired items`);
      return cleanedCount;
    } catch (error) {
      console.warn('Cache cleanup failed:', error.message);
      return 0;
    }
  }

  // Cleanup if cache is getting too large
  cleanupIfNeeded() {
    const stats = this.getStats();
    
    if (stats.totalItems > this.maxCacheSize) {
      // Remove expired items first
      this.cleanup();
      
      // If still too large, remove oldest items
      const updatedStats = this.getStats();
      if (updatedStats.validItems > this.maxCacheSize) {
        this.removeOldestItems(updatedStats.validItems - this.maxCacheSize);
      }
    }
  }

  // Remove oldest cache items
  removeOldestItems(count) {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      // Get items with timestamps
      const items = cacheKeys.map(key => {
        try {
          const item = localStorage.getItem(key);
          const cacheItem = JSON.parse(item);
          return {
            key,
            timestamp: cacheItem.timestamp
          };
        } catch (error) {
          return { key, timestamp: 0 };
        }
      });

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest items
      for (let i = 0; i < Math.min(count, items.length); i++) {
        localStorage.removeItem(items[i].key);
      }

      console.log(`Removed ${Math.min(count, items.length)} oldest cache items`);
    } catch (error) {
      console.warn('Failed to remove oldest items:', error.message);
    }
  }

  // Setup periodic cleanup (every 5 minutes)
  setupPeriodicCleanup() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  // Cache search results
  cacheSearchResults(filters, results) {
    const cacheKey = this.generateSearchCacheKey(filters);
    return this.set(cacheKey, {
      filters,
      results,
      count: results.length,
      cachedAt: new Date().toISOString()
    }, 30 * 60 * 1000); // 30 minutes TTL
  }

  // Get cached search results
  getCachedSearchResults(filters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    return this.get(cacheKey);
  }

  // Generate cache key for search filters
  generateSearchCacheKey(filters) {
    // Create a consistent key from filter values
    const filterString = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    // Create hash of filter string for shorter key
    let hash = 0;
    for (let i = 0; i < filterString.length; i++) {
      const char = filterString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `search_${Math.abs(hash)}`;
  }

  // Cache user preferences
  cacheUserPreferences(userId, preferences) {
    return this.set(`user_prefs_${userId}`, preferences, 60 * 60 * 1000); // 1 hour TTL
  }

  // Get cached user preferences
  getCachedUserPreferences(userId) {
    return this.get(`user_prefs_${userId}`);
  }

  // Cache cruise details
  cacheCruiseDetails(cruiseId, details) {
    return this.set(`cruise_${cruiseId}`, details, 60 * 60 * 1000); // 1 hour TTL
  }

  // Get cached cruise details
  getCachedCruiseDetails(cruiseId) {
    return this.get(`cruise_${cruiseId}`);
  }

  // Cache recently viewed cruises
  cacheRecentlyViewed(userId, cruiseId, cruiseData) {
    const cacheKey = `recent_${userId}`;
    let recentlyViewed = this.get(cacheKey) || [];
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(item => item.cruiseId !== cruiseId);
    
    // Add to beginning
    recentlyViewed.unshift({
      cruiseId,
      cruiseData,
      viewedAt: new Date().toISOString()
    });
    
    // Keep only last 10
    recentlyViewed = recentlyViewed.slice(0, 10);
    
    return this.set(cacheKey, recentlyViewed, 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  // Get recently viewed cruises
  getRecentlyViewed(userId) {
    return this.get(`recent_${userId}`) || [];
  }

  // Cache analytics data
  cacheAnalyticsData(key, data) {
    return this.set(`analytics_${key}`, data, 15 * 60 * 1000); // 15 minutes TTL
  }

  // Get cached analytics data
  getCachedAnalyticsData(key) {
    return this.get(`analytics_${key}`);
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.cachePrefix) && key.includes(pattern)
      );
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`Invalidated ${cacheKeys.length} cache items matching pattern: ${pattern}`);
      return cacheKeys.length;
    } catch (error) {
      console.warn('Cache invalidation failed:', error.message);
      return 0;
    }
  }

  // Export cache data for debugging
  exportCache() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      const cacheData = {};

      cacheKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          const cacheItem = JSON.parse(item);
          const cleanKey = key.replace(this.cachePrefix, '');
          
          cacheData[cleanKey] = {
            ...cacheItem,
            isExpired: Date.now() > cacheItem.expires,
            ageMinutes: Math.round((Date.now() - cacheItem.timestamp) / 60000)
          };
        } catch (error) {
          cacheData[key] = { error: 'Invalid cache item' };
        }
      });

      return {
        stats: this.getStats(),
        items: cacheData,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Export main functions
export const setCache = (key, data, ttl) => cacheManager.set(key, data, ttl);
export const getCache = (key) => cacheManager.get(key);
export const deleteCache = (key) => cacheManager.delete(key);
export const hasCache = (key) => cacheManager.has(key);
export const clearCache = () => cacheManager.clear();
export const getCacheStats = () => cacheManager.getStats();
export const cleanupCache = () => cacheManager.cleanup();
export const cacheSearchResults = (filters, results) => cacheManager.cacheSearchResults(filters, results);
export const getCachedSearchResults = (filters) => cacheManager.getCachedSearchResults(filters);
export const cacheUserPreferences = (userId, prefs) => cacheManager.cacheUserPreferences(userId, prefs);
export const getCachedUserPreferences = (userId) => cacheManager.getCachedUserPreferences(userId);
export const cacheRecentlyViewed = (userId, cruiseId, data) => cacheManager.cacheRecentlyViewed(userId, cruiseId, data);
export const getRecentlyViewed = (userId) => cacheManager.getRecentlyViewed(userId);
export const invalidateCachePattern = (pattern) => cacheManager.invalidatePattern(pattern);

// Make available globally
if (typeof window !== 'undefined') {
  window.cacheManager = cacheManager;
}

export default cacheManager;