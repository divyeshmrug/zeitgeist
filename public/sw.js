// public/sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push messages from a push service (if Firebase/WebPush is used later)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png', // Small monochrome icon for Android status bar ideally
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: data.actions || [],
    requireInteraction: true // Keep it on screen until user interacts
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FitAI Premium', options)
  );
});

// Handle notification click (Deep Linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If there's an action button clicked, we can route differently
  let targetUrl = event.notification.data;
  if (event.action && event.action.startsWith('/')) {
    targetUrl = event.action;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // To actually navigate an existing client, we send a postMessage and let the client handle React Router,
          // but for simplicity, we can also just let the user see the app if it's already on the right page,
          // or force a navigation.
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
