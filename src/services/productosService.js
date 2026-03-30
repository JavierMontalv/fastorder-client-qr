// client-qr/src/services/productoService.js
// ======================================================================
// 📦 productoService.js — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// • Fuente ÚNICA de datos de configuración de productos
// • Normaliza la respuesta del backend
// • Devuelve GRUPOS DE OPCIONES (no acompañantes sueltos)
// • Consumido por ProductoConfiguracionSheet
// ======================================================================

import api from './api';

/**
 * Obtiene la configuración completa de un producto.
 * La UI SOLO debe consumir gruposOpciones desde aquí.
 */
export async function obtenerOpcionesProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/configuracion`);

  return {
    gruposOpciones: data?.gruposOpciones || []
  };
}
