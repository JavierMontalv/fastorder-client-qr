// ======================================================================
// 🔢 formatearPrecio.js — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Fuente ÚNICA de verdad para formato monetario
// • COP
// • Sin decimales
// • Locale es-CO
// • Fallback seguro (nunca rompe UI)
// ======================================================================

export default function formatearPrecio(valor) {
  try {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return '$ 0';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numero);
  } catch (error) {
    return `$ ${valor ?? 0}`;
  }
}
