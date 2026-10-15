import { API_BASE_URL } from '../config/env';

const API_URL = API_BASE_URL;
const STORAGE_PREFIX = 'comanda_push_registered';
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isPlaceholderKey(key) {
  return !key || String(key).includes('REEMPLAZAR');
}

async function obtenerVapidPublicKey() {
  if (!isPlaceholderKey(VAPID_PUBLIC_KEY)) return VAPID_PUBLIC_KEY;

  const res = await fetch(`${API_URL}/push/config`, {
    headers: {
      'X-COMANDA-CLIENT': 'QR-2026'
    }
  });
  const data = await res.json();
  return data?.data?.vapidPublicKey || null;
}

export async function registerPushNotifications({ pedidoId, restauranteId } = {}) {
  try {
    if (!pedidoId || !restauranteId) return null;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      console.warn('Este navegador no soporta Web Push.');
      return null;
    }

    const storageKey = `${STORAGE_PREFIX}:${pedidoId}`;
    if (localStorage.getItem(storageKey) === 'ok' && Notification.permission === 'granted') {
      return null;
    }

    const vapidKey = await obtenerVapidPublicKey();
    if (!vapidKey) {
      console.warn('No existe VAPID_PUBLIC_KEY. Push no funcionara.');
      return null;
    }

    const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado.');
      return null;
    }

    const existing = await swRegistration.pushManager.getSubscription();
    const subscription = existing || await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const res = await fetch(`${API_URL}/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-COMANDA-CLIENT': 'QR-2026'
      },
      body: JSON.stringify({
        pedidoId,
        restauranteId,
        subscription
      })
    });

    const data = await res.json();

    if (!data.success) {
      console.warn('Backend no registro suscripcion push:', data);
      return null;
    }

    localStorage.setItem(storageKey, 'ok');
    return subscription;
  } catch (error) {
    console.error('Error registrando Push Notifications:', error);
    return null;
  }
}
