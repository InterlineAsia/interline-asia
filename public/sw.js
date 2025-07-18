// Enhanced Service Worker for Interline Asia PWA
// Advanced caching, offline functionality, and background sync

const CACHE_NAME = 'interline-asia-v2.0';
const STATIC_CACHE = 'interline-static-v2.0';
const DYNAMIC_CACHE = 'interline-dynamic-v2.0';
const API_CACHE = 'interline-api-v2.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/travel-tools.html',
  '/login.html',
  '/signup.html',
  '/quote.html',
  '/booking.html',
  '/css/complete-redesign.css',
  '/css/affiliate-tools.css',
  '/css/social-media.css',
  '/js/error-handler.js',
  '/js/performance-optimizer.js',
  '/js/accessibility-enhancer.js',
  '/js/input-validator.js',
  '/js/secure-auth.js',
  '/js/cache-manager.js',
  '/js/cruise-query-service.js',
  '/js/sync-worker.js',
  '/js/social-media.js',
  '/js/cruise-helper-bot.js',
  '/cruise-ship.png',
  '/favicon.ico',
  '/site.webmanifest'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls (always go to network)
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'booking-sync') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Sync offline bookings when connection is restored
  const bookings = await getOfflineBookings();
  
  for (const booking of bookings) {
    try {
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      
      // Remove from offline storage after successful sync
      await removeOfflineBooking(booking.id);
    } catch (error) {
      console.log('Booking sync failed:', error);
    }
  }
}

async function getOfflineBookings() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function removeOfflineBooking(id) {
  // Implementation would remove from IndexedDB
}