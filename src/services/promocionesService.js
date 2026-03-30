// ======================================================================
// 🎉 Servicio de Promociones – FASTORDER Client-QR (2026)
// ----------------------------------------------------------------------
// Funcionalidades Enterprise:
//  • Obtener promociones activas por restaurante
//  • Registrar impresiones (aparece popup)
//  • Registrar clics (conversión)
//  • Protección ante backend caído / HTML / timeout
//  • API limpia y estandarizada (fetch con timeout)
// ----------------------------------------------------------------------
// Compatible con:
//   → PromocionPopup.jsx
//   → usePromocionPopup.js
//   → Menu.jsx
// ======================================================================

// ==========================================================
// 🌐 Configuración Global
// ==========================================================
const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error('❌ ERROR CRÍTICO: VITE_API_URL no está definido en .env');
}

const API_URL = `${BASE_URL}/promociones`;

// ==========================================================
// ⏱ Timeout helper para evitar fetch colgados
// ==========================================================
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 6000 } = options;

  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('⏳ Timeout en la solicitud')), timeout)
    )
  ]);
}

// ==========================================================
// 🧠 Helper para convertir respuesta a JSON seguro
// ==========================================================
async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    console.warn('⚠️ Respuesta NO JSON (posible error HTML):', text.slice(0, 120));
    return {};
  }
}

// ======================================================================
// 📄 Obtener promociones activas del restaurante
// ======================================================================
export async function obtenerPromociones(restauranteId = 1) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/public?restauranteId=${restauranteId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await safeJson(res);

    const promos = Array.isArray(json.data) ? json.data : [];

    return promos;
  } catch (error) {
    console.error('❌ Error obteniendo promociones:', error);
    return [];
  }
}

// Alias PRO para compatibilidad con versiones previas
export const getPromocionesActivas = obtenerPromociones;

// ======================================================================
// 📈 Registrar impresión (cuando aparece el popup)
// ======================================================================
export async function registrarImpresion(id) {
  if (!id) return;

  try {
    await fetchWithTimeout(`${API_URL}/${id}/impresion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      }
    });

  } catch (error) {
    console.error('❌ Error registrando impresión:', error);
  }
}

// ======================================================================
// 🖱 Registrar clic (cuando usuario toca “Ver promoción”)
// ======================================================================
export async function registrarClick(id) {
  if (!id) return;

  try {
    await fetchWithTimeout(`${API_URL}/${id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FASTORDER-CLIENT': 'QR-2026'
      }
    });

    console.log(`🖱 Clic registrado para promoción ${id}`);
  } catch (error) {
    console.error('❌ Error registrando clic:', error);
  }
}

// ======================================================================
// 📦 Exportación PRO
// ======================================================================
export default {
  obtenerPromociones,
  getPromocionesActivas,
  registrarImpresion,
  registrarClick
};
