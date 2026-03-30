// client-qr/src/services/productoService.js
// ======================================================================
// 🧠 productoService.js — FASTORDER Client QR
// ----------------------------------------------------------------------
// • Capa futura para lógica avanzada de producto
// • Opciones, combos, modificadores, cross-sell
// ======================================================================

import api from './api';

export async function obtenerOpcionesProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/opciones`);
  return data;
}

export async function obtenerCombosProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/combos`);
  return data;
}

export async function obtenerCrossSellProducto(productoId) {
  const { data } = await api.get(`/productos/${productoId}/cross-sell`);
  return data;
}
