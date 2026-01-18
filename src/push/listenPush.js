// ============================================================================
// 🔔 listenPush.js – FASTORDER Client-QR (2026)
// ----------------------------------------------------------------------------
// Funciones premium:
//  • Escucha mensajes enviados por el Service Worker
//  • Eventos: pedido listo, promo nueva, actualización estado
//  • Muestra banners internos tipo Rappi / Uber Eats
//  • Callback opcional para disparar animaciones en React
// ============================================================================

// -----------------------------------------------------------
// 🧠 Hooks de escucha centralizada
// -----------------------------------------------------------
export function listenPushMessages(onMessageCallback = null) {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Este navegador NO soporta Service Workers.');
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    if (!navigator.serviceWorker.controller) {
      console.warn('⚠️ No hay Service Worker controlando la página aún.');
      return;
    }

    console.log('📡 Escuchando mensajes push del Service Worker…');

    // -----------------------------------------------------------
    // 🔥 Evento: mensaje DIRECTO desde el SW (client.postMessage)
    // -----------------------------------------------------------
    navigator.serviceWorker.addEventListener('message', (event) => {
      const payload = event.data;

      console.log('📩 Mensaje recibido del Service Worker:', payload);

      if (onMessageCallback) {
        onMessageCallback(payload);
      }

      mostrarBannerInterno(payload);
    });
  });
}

// ============================================================================
// 🎨 BANNER INTERNO (UI dentro de la app estilo Uber Eats / Rappi)
// ============================================================================
let bannerTimeout = null;

export function mostrarBannerInterno(payload) {
  try {
    const { title, body, type } = payload || {};

    // Si ya hay uno abierto → cerrarlo
    const prev = document.getElementById('fo-push-banner');
    if (prev) prev.remove();

    // Crear banner
    const banner = document.createElement('div');
    banner.id = 'fo-push-banner';

    banner.style.cssText = `
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: white;
      padding: 14px 20px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,.25);
      z-index: 999999;
      opacity: 0;
      text-align: center;
      max-width: 85%;
      transition: opacity .3s ease, transform .3s ease;
    `;

    banner.innerHTML = `
      <div>${title || 'Notificación'}</div>
      <div style="font-size:13px; font-weight:400; opacity:.85; margin-top:3px;">
        ${body || ''}
      </div>
    `;

    document.body.appendChild(banner);

    // Mostrar animado
    setTimeout(() => {
      banner.style.opacity = 1;
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 30);

    // Ocultar automáticamente
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => {
      banner.style.opacity = 0;
      banner.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => banner.remove(), 300);
    }, 4200);

    // Vibración sutil si el dispositivo la soporta
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  } catch (err) {
    console.error('❌ Error mostrando banner interno de notificación:', err);
  }
}
