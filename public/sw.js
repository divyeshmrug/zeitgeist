// public/sw.js — FitAI V6 Service Worker
// Handles background push notifications even when app is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ==========================================
// BACKGROUND PUSH HANDLER
// Fires even when app is closed/minimized
// ==========================================
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'FitAI', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || 'FitAI Elite Coach';
  const options = {
    body: data.body || data.message || 'You have a new message.',
    icon: '/fitai-logo-192.png?v=2',
    badge: '/fitai-badge-white.png?v=2',
    vibrate: [200, 100, 200],
    data: { url: data.action_url || '/' },
    requireInteraction: data.priority === 'HIGH',
    actions: [
      { action: data.action_url || '/', title: 'Open FitAI' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ==========================================
// NOTIFICATION CLICK — Deep Linking
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
