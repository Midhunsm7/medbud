// Service Worker for MediReminder PWA
const CACHE_NAME = 'medireminder-v1';
const urlsToCache = [
  '/',
  '/reminders',
  '/history',
  '/login',
  '/signup',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Notification click event - open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/reminders');
        }
      })
  );
});

// Push event - handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'You have a new reminder',
    icon: '/logo.png',
    badge: '/logo.png',
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification('MediReminder', options)
  );
});

// Background sync event (for future use)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  // Placeholder for syncing reminders in background
  console.log('Syncing reminders...');
}

// Made with Bob
