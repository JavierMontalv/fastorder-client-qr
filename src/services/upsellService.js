// ======================================================================
// 🍟 Upsell Service – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Funcionalidades Enterprise:
//  • Obtener productos sugeridos (upsell) desde el backend
//  • Soporte para combos, IA o reglas personalizadas
//  • Fail-safe para QR (si falla → retorna [])
//  • Normalización de datos
// ======================================================================

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error('❌ ERROR: VITE_API_URL no está configurado en el entorno.');
}

const API_URL = `${BASE_URL}/productos/upsell`;

// ==========================================================
// ⏱ helper: fetch con timeout
// ==========================================================
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 6000 } = options;

  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('⏳ Timeout en upsellService')), timeout)
    )
  ]);
}

// ==========================================================
// 🧠 Normalizar JSON (evita HTML o backend caído)
// ==========================================================
async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    console.warn('⚠️ Respuesta NO JSON en upsellService:', text.slice(0, 60));
    return {};
  }
}

// ======================================================================
// ⭐ Obtener sugerencias de upsell
// ----------------------------------------------------------------------
// Lógica backend:
//   GET /productos/upsell?productoId=123
// ======================================================================
export async function getUpsell(productoId) {
  if (!productoId) return [];

  try {
    const res = await fetchWithTimeout(`${API_URL}?productoId=${productoId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await safeJson(res);
    const sugerencias = Array.isArray(data.data) ? data.data : [];

    console.log(`🍟 Upsell recibido (${sugerencias.length} sugerencias)`);

    return sugerencias;
  } catch (error) {
    console.error('❌ Error en getUpsell:', error);
    return [];
  }
}

// ======================================================================
// 🔥 Alias requerido para compatibilidad con otros módulos
// ======================================================================
export const obtenerUpsell = getUpsell;

// ======================================================================
// 📦 Exportación PRO
// ======================================================================
export default {
  getUpsell,
  obtenerUpsell
};
