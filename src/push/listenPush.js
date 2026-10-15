import {
  vibrarCambioEstadoPedido,
  vibrarLlamadoPedido
} from '../utils/pedidoHaptics';

let escuchandoPushMessages = false;
let bannerTimeout = null;

function vibrarDesdePayload(payload = {}) {
  const data = payload.data || payload;
  const tipo = data.tipo || payload.tipo || payload.type;

  if (tipo === 'llamado') {
    vibrarLlamadoPedido({
      pedidoId: data.pedidoId || payload.pedidoId,
      eventId: data.eventId || payload.eventId || payload.tag,
      payload
    });
    return;
  }

  vibrarCambioEstadoPedido({
    pedidoId: data.pedidoId || payload.pedidoId,
    estadoAnterior: null,
    estadoNuevo: data.estado || payload.estado || tipo
  });
}

export function listenPushMessages(onMessageCallback = null) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (escuchandoPushMessages) return;
  escuchandoPushMessages = true;

  navigator.serviceWorker.ready.catch(() => {});

  navigator.serviceWorker.addEventListener('message', (event) => {
    const payload = event.data || {};

    vibrarDesdePayload(payload);

    if (onMessageCallback) {
      onMessageCallback(payload);
    }

    mostrarBannerInterno(payload);
  });
}

export function mostrarBannerInterno(payload = {}) {
  try {
    const { title, body } = payload;

    const prev = document.getElementById('fo-push-banner');
    if (prev) prev.remove();

    const banner = document.createElement('div');
    banner.id = 'fo-push-banner';
    banner.style.cssText = `
      position: fixed;
      top: max(12px, env(safe-area-inset-top, 0px));
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      background: linear-gradient(135deg, #111827, #0f172a);
      color: white;
      padding: 14px 18px;
      border-radius: 18px;
      font-family: var(--font-family, system-ui, sans-serif);
      font-size: 15px;
      font-weight: 800;
      box-shadow: 0 18px 38px rgba(15, 23, 42, .28);
      z-index: 999999;
      opacity: 0;
      text-align: center;
      width: min(90vw, 420px);
      transition: opacity .24s ease, transform .24s ease;
      border: 1px solid rgba(255,255,255,.12);
    `;

    banner.innerHTML = `
      <div>${title || 'Actualizacion de pedido'}</div>
      <div style="font-size:13px; font-weight:600; opacity:.84; margin-top:3px; line-height:1.35;">
        ${body || 'Tu pedido tuvo un cambio importante.'}
      </div>
    `;

    document.body.appendChild(banner);
    vibrarDesdePayload(payload);

    window.setTimeout(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 30);

    window.clearTimeout(bannerTimeout);
    bannerTimeout = window.setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(-10px)';
      window.setTimeout(() => banner.remove(), 300);
    }, 4800);
  } catch {
    // La notificacion del sistema ya cubre el aviso principal.
  }
}
