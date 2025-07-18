// Background Sync Worker for Cruise Data
class SyncWorker {
    constructor() {
        this.isRunning = false;
        this.syncInterval = 30 * 60 * 1000; // 30 minutes
        this.lastSync = null;
        this.syncHistory = [];
        this.maxHistorySize = 50;
        this.init();
    }

    init() {
        // Start periodic sync
        this.startPeriodicSync();
        
        // Listen for visibility changes to sync when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.shouldSync()) {
                this.performSync();
            }
        });

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Connection restored, performing sync...');
            this.performSync();
        });

        // Initial sync
        setTimeout(() => this.performSync(), 1000);
    }

    // Start periodic background sync
    startPeriodicSync() {
        setInterval(() => {
            if (this.shouldSync()) {
                this.performSync();
            }
        }, this.syncInterval);
    }

    // Check if sync is needed
    shouldSync() {
        if (this.isRunning) return false;
        if (!navigator.onLine) return false;
        
        const now = Date.now();
        const timeSinceLastSync = this.lastSync ? now - this.lastSync : Infinity;
        
        return timeSinceLastSync > this.syncInterval;
    }

    // Perform data synchronization
    async performSync() {
        if (this.isRunning) {
            console.log('Sync already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        const syncStart = Date.now();
        
        console.log('🔄 Starting background sync...');

        try {
            const syncResult = {
                timestamp: syncStart,
                success: false,
                duration: 0,
                sources: {},
                errors: []
            };

            // Sync CSV data sources
            await this.syncCSVSources(syncResult);

            // Sync external APIs if available
            await this.syncExternalAPIs(syncResult);

            // Update cache
            await this.updateCache(syncResult);

            // Mark sync as successful
            syncResult.success = true;
            syncResult.duration = Date.now() - syncStart;
            
            this.lastSync = Date.now();
            this.addToHistory(syncResult);

            console.log(`✅ Sync completed successfully in ${syncResult.duration}ms`);
            
            // Notify other components
            this.notifyComponents('sync:complete', syncResult);

        } catch (error) {
            console.error('❌ Sync failed:', error);
            
            const errorResult = {
                timestamp: syncStart,
                success: false,
                duration: Date.now() - syncStart,
                error: error.message,
                sources: {},
                errors: [error.message]
            };
            
            this.addToHistory(errorResult);
            this.notifyComponents('sync:error', errorResult);
            
        } finally {
            this.isRunning = false;
        }
    }

    // Sync CSV data sources
    async syncCSVSources(syncResult) {
        const csvSources = [
            { file: '/river.csv', type: 'River Cruise' },
            { file: '/twins.csv', type: 'Ocean Cruise' }
        ];

        for (const source of csvSources) {
            try {
                console.log(`Syncing ${source.file}...`);
                
                const response = await fetch(`${source.file}?t=${Date.now()}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const csvText = await response.text();
                const lines = csvText.trim().split('\n');
                const recordCount = Math.max(0, lines.length - 1); // Subtract header

                syncResult.sources[source.file] = {
                    success: true,
                    records: recordCount,
                    lastModified: response.headers.get('last-modified'),
                    size: csvText.length
                };

                console.log(`✅ ${source.file}: ${recordCount} records`);

            } catch (error) {
                console.error(`❌ Failed to sync ${source.file}:`, error);
                
                syncResult.sources[source.file] = {
                    success: false,
                    error: error.message,
                    records: 0
                };
                
                syncResult.errors.push(`${source.file}: ${error.message}`);
            }
        }
    }

    // Sync external APIs (placeholder for future integrations)
    async syncExternalAPIs(syncResult) {
        // Placeholder for Widgety API or other external sources
        const externalAPIs = [
            // { name: 'Widgety API', endpoint: '/api/widgety/cruises' },
            // { name: 'Partner API', endpoint: '/api/partner/deals' }
        ];

        for (const api of externalAPIs) {
            try {
                console.log(`Syncing ${api.name}...`);
                
                const response = await fetch(api.endpoint);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                syncResult.sources[api.name] = {
                    success: true,
                    records: data.length || 0,
                    timestamp: Date.now()
                };

                console.log(`✅ ${api.name}: ${data.length || 0} records`);

            } catch (error) {
                console.error(`❌ Failed to sync ${api.name}:`, error);
                
                syncResult.sources[api.name] = {
                    success: false,
                    error: error.message,
                    records: 0
                };
                
                syncResult.errors.push(`${api.name}: ${error.message}`);
            }
        }
    }

    // Update cache after sync
    async updateCache(syncResult) {
        try {
            console.log('Updating cache...');
            
            // Clear old cache
            if (window.CacheManager) {
                window.CacheManager.delete('all_cruise_data');
                window.CacheManager.delete('cruise_regions');
                window.CacheManager.delete('cruise_lines');
                window.CacheManager.delete('popular_destinations');
            }

            // Refresh cruise query service
            if (window.CruiseQueryService) {
                await window.CruiseQueryService.refreshData();
            }

            // Refresh cruise bot data
            if (window.cruiseHelperBot) {
                await window.cruiseHelperBot.loadCruiseData();
            }

            console.log('✅ Cache updated successfully');

        } catch (error) {
            console.error('❌ Failed to update cache:', error);
            syncResult.errors.push(`Cache update: ${error.message}`);
        }
    }

    // Add sync result to history
    addToHistory(result) {
        this.syncHistory.unshift(result);
        
        // Keep only recent history
        if (this.syncHistory.length > this.maxHistorySize) {
            this.syncHistory = this.syncHistory.slice(0, this.maxHistorySize);
        }

        // Store in localStorage for persistence
        try {
            localStorage.setItem('sync_history', JSON.stringify(this.syncHistory.slice(0, 10)));
        } catch (error) {
            console.warn('Failed to save sync history:', error);
        }
    }

    // Notify other components of sync events
    notifyComponents(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        document.dispatchEvent(event);
    }

    // Get sync status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastSync: this.lastSync,
            nextSync: this.lastSync ? this.lastSync + this.syncInterval : null,
            syncInterval: this.syncInterval,
            historyCount: this.syncHistory.length,
            isOnline: navigator.onLine
        };
    }

    // Get sync history
    getHistory(limit = 10) {
        return this.syncHistory.slice(0, limit);
    }

    // Force sync
    async forceSync() {
        console.log('Force sync requested...');
        this.lastSync = 0; // Reset last sync time
        await this.performSync();
    }

    // Update sync interval
    setSyncInterval(minutes) {
        this.syncInterval = minutes * 60 * 1000;
        console.log(`Sync interval updated to ${minutes} minutes`);
    }

    // Get sync statistics
    getStatistics() {
        const recentSyncs = this.syncHistory.slice(0, 10);
        const successfulSyncs = recentSyncs.filter(sync => sync.success);
        const failedSyncs = recentSyncs.filter(sync => !sync.success);
        
        const avgDuration = successfulSyncs.length > 0 
            ? successfulSyncs.reduce((sum, sync) => sum + sync.duration, 0) / successfulSyncs.length 
            : 0;

        return {
            totalSyncs: this.syncHistory.length,
            recentSyncs: recentSyncs.length,
            successfulSyncs: successfulSyncs.length,
            failedSyncs: failedSyncs.length,
            successRate: recentSyncs.length > 0 ? (successfulSyncs.length / recentSyncs.length) * 100 : 0,
            averageDuration: Math.round(avgDuration),
            lastSync: this.lastSync,
            isOnline: navigator.onLine
        };
    }

    // Load sync history from localStorage
    loadHistory() {
        try {
            const stored = localStorage.getItem('sync_history');
            if (stored) {
                this.syncHistory = JSON.parse(stored);
                console.log(`Loaded ${this.syncHistory.length} sync history entries`);
            }
        } catch (error) {
            console.warn('Failed to load sync history:', error);
        }
    }
}

// Initialize sync worker
document.addEventListener('DOMContentLoaded', () => {
    window.SyncWorker = new SyncWorker();
    console.log('Background sync worker initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncWorker;
}