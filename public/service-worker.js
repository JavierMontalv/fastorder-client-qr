/* ============================================================================
   🚀 FASTORDER 2026 – Service Worker (Web Push Notifications)
   ----------------------------------------------------------------------------
   Funciones:
   • Registrar notificaciones push
   • Recibir mensajes del servidor (pedido listo, promo, cancelado)
   • Mostrar notificaciones premium con acciones
   • Abrir EstadoPedidoPro al hacer clic
   ============================================================================ */

self.addEventListener("install", (event) => {
  console.log("📦 Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activo");
  event.waitUntil(clients.claim());
});

/* ============================================================================
   📡 EVENTO: PUSH RECIBIDO
   Backend enviará payload JSON:
   {
      "title": "Pedido Listo",
      "body": "Tu orden #45 está lista para recoger",
      "icon": "/icons/icon-192.png",
      "tag": "pedido-45",
      "url": "/estado-pro/45",
      "badge": "/icons/badge.png"
   }
   ============================================================================ */

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("⚠ Push recibido sin data");
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch (e) {
    console.warn("⚠ Push no es JSON:", event.data.text());
    return;
  }

  const options = {
    body: payload.body || "Tienes una nueva notificación",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge.png",
    vibrate: [120, 60, 120],
    tag: payload.tag || "fastorder-notification",
    renotify: true,
    data: {
      url: payload.url || "/",
    },
    actions: payload.actions || [
      {
        action: "open",
        title: "Ver",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.title || "FASTORDER",
      options
    )
  );
});

/* ============================================================================
   🖱 EVENTO: CLICK EN NOTIFICACIÓN
   • Abre pestaña existente
   • O crea una nueva si no existe
   ============================================================================ */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Ver si ya está abierta
      for (const client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Abrir nueva pestaña
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/* ============================================================================
   🛑 EVENTO: CIERRE DE NOTIFICACIÓN (opcional analítica)
   ============================================================================ */
self.addEventListener("notificationclose", (event) => {
  console.log("🔕 Notificación cerrada:", event.notification.tag);
});
