// Magic AI ✦ Service Worker
// Version 1.0.0
// This service worker handles caching, offline functionality, and app updates

const CACHE_NAME = 'magicai-v1.0.0';
const DATA_CACHE_NAME = 'magicai-data-v1.0.0';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  // Add other critical assets
];

// API URLs that should be cached
const API_CACHE_URLS = [
  '/api/',
  'https://api.magicai.com/',
  // Add your API endpoints here
];

// Install Event - Cache core files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch Event - Serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API calls
  if (isApiCall(request.url)) {
    event.respondWith(handleApiRequest(event));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // Handle other requests (CSS, JS, images, etc.)
  event.respondWith(handleResourceRequest(event));
});

// Handle API requests with network-first strategy
function handleApiRequest(event) {
  return caches.open(DATA_CACHE_NAME)
    .then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Store successful responses in cache
          if (response.status === 200) {
            cache.put(event.request.url, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return cache.match(event.request);
        });
    });
}

// Handle navigation requests
function handleNavigationRequest(event) {
  return fetch(event.request)
    .catch(() => {
      // Return cached index.html for offline navigation
      return caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match('/index.html');
        });
    });
}

// Handle resource requests with cache-first strategy
function handleResourceRequest(event) {
  return caches.open(CACHE_NAME)
    .then((cache) => {
      return cache.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version
            return cachedResponse;
          }
          
          // Fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone response before caching
              const responseToCache = response.clone();
              cache.put(event.request, responseToCache);
              return response;
            })
            .catch(() => {
              // Return offline fallback for images
              if (event.request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6b7280">Offline</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
            });
        });
    });
}

// Check if request is an API call
function isApiCall(url) {
  return API_CACHE_URLS.some(apiUrl => url.includes(apiUrl));
}

// Background Sync - Handle offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync', event.tag);
  
  if (event.tag === 'background-sync-calculations') {
    event.waitUntil(syncCalculations());
  }
  
  if (event.tag === 'background-sync-chat') {
    event.waitUntil(syncChatMessages());
  }
});

// Sync offline calculations when back online
async function syncCalculations() {
  try {
    // Get offline calculations from IndexedDB
    const calculations = await getOfflineCalculations();
    
    for (const calc of calculations) {
      // Send to server
      await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calc)
      });
    }
    
    // Clear offline storage after successful sync
    await clearOfflineCalculations();
    console.log('[ServiceWorker] Calculations synced successfully');
  } catch (error) {
    console.error('[ServiceWorker] Calculation sync failed:', error);
  }
}

// Sync offline chat messages when back online
async function syncChatMessages() {
  try {
    const messages = await getOfflineChatMessages();
    
    for (const message of messages) {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    }
    
    await clearOfflineChatMessages();
    console.log('[ServiceWorker] Chat messages synced successfully');
  } catch (error) {
    console.error('[ServiceWorker] Chat sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received');
  
  let notificationData = {
    title: 'Magic AI ✦',
    body: 'You have a new notification',
    icon: 'https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png',
    badge: 'https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png',
    tag: 'magicai-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.command) {
    switch (event.data.command) {
      case 'skipWaiting':
        self.skipWaiting();
        break;
        
      case 'checkForUpdates':
        checkForUpdates();
        break;
        
      case 'cacheUserData':
        cacheUserData(event.data.data);
        break;
        
      case 'clearCache':
        clearAllCaches();
        break;
    }
  }
});

// Check for app updates
async function checkForUpdates() {
  try {
    const response = await fetch('/manifest.json', { cache: 'no-cache' });
    const manifest = await response.json();
    
    // Compare versions or timestamps
    const currentVersion = await getCurrentVersion();
    if (manifest.version !== currentVersion) {
      // Notify main thread about update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: manifest.version
        });
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Update check failed:', error);
  }
}

// Cache user-specific data
async function cacheUserData(data) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put('/user-data', new Response(JSON.stringify(data)));
    console.log('[ServiceWorker] User data cached');
  } catch (error) {
    console.error('[ServiceWorker] User data cache failed:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[ServiceWorker] All caches cleared');
  } catch (error) {
    console.error('[ServiceWorker] Cache clear failed:', error);
  }
}

// Utility function to get current version
async function getCurrentVersion() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/manifest.json');
    if (response) {
      const manifest = await response.json();
      return manifest.version;
    }
  } catch (error) {
    console.error('[ServiceWorker] Version check failed:', error);
  }
  return '1.0.0';
}

// IndexedDB utilities for offline storage
async function getOfflineCalculations() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MagicAI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['calculations'], 'readonly');
      const store = transaction.objectStore('calculations');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('calculations')) {
        db.createObjectStore('calculations', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('chatMessages')) {
        db.createObjectStore('chatMessages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function getOfflineChatMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MagicAI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['chatMessages'], 'readonly');
      const store = transaction.objectStore('chatMessages');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

async function clearOfflineCalculations() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MagicAI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['calculations'], 'readwrite');
      const store = transaction.objectStore('calculations');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

async function clearOfflineChatMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MagicAI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['chatMessages'], 'readwrite');
      const store = transaction.objectStore('chatMessages');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic Sync:', event.tag);
  
  if (event.tag === 'property-updates') {
    event.waitUntil(fetchPropertyUpdates());
  }
});

// Fetch property updates in background
async function fetchPropertyUpdates() {
  try {
    const response = await fetch('/api/property-updates');
    const updates = await response.json();
    
    // Store updates and notify user if important
    if (updates.length > 0) {
      await self.registration.showNotification('Magic AI ✦', {
        body: `${updates.length} new property updates available`,
        icon: 'https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png',
        tag: 'property-updates'
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Property updates failed:', error);
  }
}

// Handle app shortcuts
self.addEventListener('notificationclick', (event) => {
  if (event.notification.tag === 'emi-calculator') {
    event.waitUntil(
      clients.openWindow('/?tool=emi-calculator')
    );
  } else if (event.notification.tag === 'property-match') {
    event.waitUntil(
      clients.openWindow('/?tool=property-matchmaker')
    );
  }
});

console.log('[ServiceWorker] Magic AI ✦ Service Worker loaded successfully');
