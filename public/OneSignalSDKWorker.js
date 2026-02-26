// OneSignal Service Worker - Self-contained version with custom sound support
// This version doesn't rely on external CDN which may be blocked

self.addEventListener('push', function(event) {
  console.log('[OneSignalSDKWorker] Push notification received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || data.headings?.en || 'Notification';
      const soundUrl = data.data?.soundUrl || '/sound.wav';
      
      const options = {
        body: data.alert || data.contents?.en || data.message || '',
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        data: {
          ...data.data,
          soundUrl: soundUrl
        },
        tag: data.tag || 'notification',
        requireInteraction: true, // Keep notification visible
        vibrate: [200, 100, 200, 100, 200], // Longer vibration pattern
        silent: false // Ensure sound plays
      };
      
      event.waitUntil(
        Promise.all([
          self.registration.showNotification(title, options),
          playCustomSound(soundUrl)
        ])
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

// Function to play custom sound
async function playCustomSound(soundUrl) {
  try {
    console.log('[OneSignalSDKWorker] Playing custom sound:', soundUrl);
    
    // Get all clients (open tabs/windows)
    const allClients = await clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    // Send message to all clients to play sound
    allClients.forEach(client => {
      client.postMessage({
        type: 'PLAY_SOUND',
        soundUrl: soundUrl
      });
    });
    
    console.log('[OneSignalSDKWorker] Sound play message sent to', allClients.length, 'clients');
  } catch (error) {
    console.error('[OneSignalSDKWorker] Error playing sound:', error);
  }
}

console.log('[OneSignalSDKWorker] Service worker loaded successfully with custom sound support');

// Made with Bob
