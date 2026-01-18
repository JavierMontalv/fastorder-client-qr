// ============================================================================
// 📱 registerPush.js – FASTORDER Client-QR (2026)
// ----------------------------------------------------------------------------
// Funciones profesionales:
//  • Solicitar permiso de notificaciones
//  • Registrar Service Worker
//  • Crear suscripción Push Web
//  • Enviar la suscripción al backend (para enviar notificaciones reales)
//  • Manejo de errores estilo Shopify / Stripe
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------
// 🟦 Clave pública VAPID (debe venir de .env o del backend)
// ---------------------------------------------------------
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
  console.warn('⚠️ No existe VITE_VAPID_PUBLIC_KEY. Push no funcionará.');
}

// ---------------------------------------------------------
// 🧩 Convert Base64 → Uint8Array (requisito de Web Push API)
// ---------------------------------------------------------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ============================================================================
// 🚀 REGISTRAR NOTIFICACIONES PUSH
// ============================================================================

export async function registerPushNotifications(usuarioId = null) {
  try {
    console.log('🔄 Registrando Service Worker…');

    // ---------------------------------------------------------
    // 1️⃣ Registrar el Service Worker
    // ---------------------------------------------------------
    const swRegistration = await navigator.serviceWorker.register('/service-worker.js');

    console.log('📦 Service Worker registrado:', swRegistration.scope);

    // ---------------------------------------------------------
    // 2️⃣ Solicitar permiso al usuario
    // ---------------------------------------------------------
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('🚫 Permiso de notificaciones denegado.');
      return null;
    }

    console.log('🔐 Permiso concedido para notificaciones.');

    // ---------------------------------------------------------
    // 3️⃣ Crear suscripción Push (WebPush API)
    // ---------------------------------------------------------
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('📡 Suscripción creada:', subscription);

    // ---------------------------------------------------------
    // 4️⃣ Enviar la suscripción al backend (guardar endpoint)
    // ---------------------------------------------------------
    const res = await fetch(`${API_URL}/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      },
      body: JSON.stringify({
        usuarioId,
        subscription
      })
    });

    const data = await res.json();

    if (!data.success) {
      console.warn('⚠️ Backend no registró suscripción:', data);
    } else {
      console.log('✅ Suscripción registrada en servidor:', data);
    }

    return subscription;
  } catch (error) {
    console.error('❌ Error registrando Push Notifications:', error);
    return null;
  }
}
