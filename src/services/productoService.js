// client-qr/src/services/productoService.js
// ======================================================================
// 🧠 productoService.js — COMANDA Client QR
// ----------------------------------------------------------------------
// • Capa futura para lógica avanzada de producto
// • Opciones, combos, modificadores, cross-sell
// ======================================================================

import api from './api';

export async function obtenerOpcionesProducto(productoId, restauranteId) {
  if (!restauranteId) {
    throw new Error('restauranteId es obligatorio para obtener opciones del producto');
  }

  const { data } = await api.get(`/public/productos/${productoId}/opciones`, {
    params: {
      restauranteId
    }
  });
  return data?.data || { gruposOpciones: [] };
}

export async function obtenerCombosProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/combos`);
  return data;
}

export async function obtenerCrossSellProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/cross-sell`);
  return data;
}
