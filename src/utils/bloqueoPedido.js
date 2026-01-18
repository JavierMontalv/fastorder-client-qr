// ======================================================================
// client-qr/src/utils/bloqueoPedido.js
// ======================================================================
'use strict';

const STORAGE_KEY = 'fastorder_pedido_activo';

export function guardarPedidoActivo(pedido) {
  if (!pedido?.id) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      pedidoId: pedido.id,
      estado: pedido.estado,
      estadoPago: pedido.estadoPago
    })
  );
}

export function obtenerPedidoActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function puedeCrearNuevoPedido() {
  const pedido = obtenerPedidoActivo();
  if (!pedido) return true;
  return ['entregado', 'cancelado'].includes(pedido.estado);
}

export function actualizarEstadoPedido(estado) {
  const pedido = obtenerPedidoActivo();
  if (!pedido) return;
  pedido.estado = estado;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedido));
}

export function limpiarPedidoActivo() {
  localStorage.removeItem(STORAGE_KEY);
}
