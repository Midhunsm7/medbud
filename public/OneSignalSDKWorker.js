// OneSignal Service Worker - Self-contained version
// This version doesn't rely on external CDN which may be blocked

self.addEventListener('push', function(event) {
  console.log('[OneSignalSDKWorker] Push notification received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || data.headings?.en || 'Notification';
      const options = {
        body: data.alert || data.contents?.en || data.message || '',
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        data: data.data || {},
        tag: data.tag || 'notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (error) {
      console.error('[OneSignalSDKWorker] Error processing push:', error);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[OneSignalSDKWorker] Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[OneSignalSDKWorker] Service worker loaded successfully');

// Made with Bob
