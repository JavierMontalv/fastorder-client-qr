// ======================================================================
// 🔗 crossSellService.js – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Servicio para obtener productos complementarios (Cross-Selling).
//
// Funcionalidades Enterprise:
//  • Anti-timeout (protección contra APIs lentas)
//  • Normalización segura de JSON
//  • Listo para integrarse con IA o reglas avanzadas
// ======================================================================

// ------------------------------------------------------------
// 🌐 URL base del backend
// ------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error("❌ ERROR CRÍTICO: VITE_API_URL no está definido en .env");
}

const API_URL = `${BASE_URL}/productos/cross-sell`;

// ------------------------------------------------------------
// ⏱ Helper para timeout seguro
// ------------------------------------------------------------
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 6000 } = options;

  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("⏳ Timeout en solicitud")), timeout)
    )
  ]);
}

// ------------------------------------------------------------
// 🛡️ Normalizador de JSON (maneja errores HTML)
// ------------------------------------------------------------
async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("⚠️ Respuesta no-JSON detectada:", text.slice(0, 100));
    return {};
  }
}

// ======================================================================
// 🎯 Obtener sugerencias de cross-selling para un producto
// ======================================================================
export async function obtenerCrossSell(productoId) {
  if (!productoId) {
    console.warn("⚠️ obtenerCrossSell() llamado sin productoId");
    return [];
  }

  try {
    const res = await fetchWithTimeout(`${API_URL}?productoId=${productoId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-FASTORDER-CLIENT": "QR-2026"
      },
      timeout: 6000
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await safeJson(res);

    const sugerencias = Array.isArray(data.data) ? data.data : [];

    console.log(
      `🤝 Cross-selling cargado para producto ${productoId}:`,
      sugerencias.length,
      "sugerencias"
    );

    return sugerencias;
  } catch (error) {
    console.error("❌ Error obteniendo cross-selling:", error);
    return [];
  }
}

// ======================================================================
// 🏷 Alias para compatibilidad futura
// ======================================================================
export const getCrossSell = obtenerCrossSell;

export default {
  obtenerCrossSell,
  getCrossSell
};
