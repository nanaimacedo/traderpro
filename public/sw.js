// Service Worker — Push Notifications TraderPro
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'TraderPro';
  const options = {
    body: data.body || 'Hora de revisar seu plano de trade!',
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    vibrate: [200, 100, 200],
    tag: 'traderpro-daily',
    renotify: true,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ao clicar na notificacao, abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se ja tem uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Senao, abre nova aba
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
