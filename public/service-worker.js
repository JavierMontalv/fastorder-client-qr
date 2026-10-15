self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function normalizarPayload(event) {
  try {
    return event.data ? event.data.json() : {};
  } catch {
    return {
      title: 'Comanda',
      body: event.data ? event.data.text() : 'Tu pedido tiene una actualizacion.'
    };
  }
}

self.addEventListener('push', (event) => {
  const payload = normalizarPayload(event);
  const title = payload.title || 'Comanda';
  const options = {
    body: payload.body || 'Tu pedido tiene una actualizacion.',
    tag: payload.tag || `comanda-${Date.now()}`,
    renotify: true,
    silent: false,
    requireInteraction: payload.data?.tipo === 'llamado',
    vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [180, 60, 280, 80, 420],
    timestamp: Date.now(),
    data: {
      ...(payload.data || {}),
      url: payload.url || payload.data?.url || '/'
    },
    badge: '/brand/badge-192.png',
    icon: '/brand/icon-192.png'
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => (
        Promise.all(clients.map((client) => client.postMessage({
          ...payload,
          source: 'push'
        })))
      ))
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const target = clients.find((client) => client.url.includes(url));
      if (target) return target.focus();
      return self.clients.openWindow(url);
    })
  );
});
