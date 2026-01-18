// ======================================================================
// 🛍 takeawayService.js – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Servicio para obtener configuración avanzada del modo “Para llevar”:
//  • Punto de recogida
//  • Tiempo estimado
//  • Instrucciones especiales
//  • Protección contra errores y APIs caídas
// ======================================================================

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error('❌ ERROR CRÍTICO: VITE_API_URL no está definido en .env');
}

const API_URL = `${BASE_URL}/restaurantes/takeaway`;

// ======================================================================
// ⏱ Helper: fetch con timeout (evita que la UI quede esperando)
// ======================================================================
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 6000 } = options;

  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('⏳ Timeout en solicitud')), timeout)
    )
  ]);
}

// ======================================================================
// 🔄 Parsea JSON de forma segura
// ======================================================================
async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    console.warn('⚠️ Respuesta no JSON (posible error HTML):', text.slice(0, 80));
    return {};
  }
}

// ======================================================================
// 📦 Obtener configuración de TAKEAWAY del restaurante
// ----------------------------------------------------------------------
// Respuesta esperada:
// {
//   tiempo: 12,
//   puntoRecogida: "Mostrador principal",
//   instrucciones: "Indica tu nombre al llegar"
// }
// ======================================================================
export async function getTakeawayInfo(restauranteId = 1) {
  try {
    const res = await fetchWithTimeout(`${API_URL}?restauranteId=${restauranteId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await safeJson(res);
    const info = data?.data || {};

    return {
      tiempo: info.tiempo || null,
      puntoRecogida: info.puntoRecogida || '',
      instrucciones: info.instrucciones || ''
    };
  } catch (error) {
    console.error('❌ Error en getTakeawayInfo:', error);

    // Devolver estructura segura para evitar errores en UI
    return {
      tiempo: null,
      puntoRecogida: '',
      instrucciones: ''
    };
  }
}

// ======================================================================
// 📤 Alias para compatibilidad futura
// ======================================================================
export const obtenerTakeawayInfo = getTakeawayInfo;

export default {
  getTakeawayInfo,
  obtenerTakeawayInfo
};
