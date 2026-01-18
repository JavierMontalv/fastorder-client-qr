// ======================================================================
// 📦 pedidosService.js – FASTORDER Client QR 2026
// ----------------------------------------------------------------------
// • Crea pedidos ASOCIADOS a mesa cuando exista contexto
// • Fuente única HTTP (axios / api centralizado)
// ======================================================================

import api from './api';

// ======================================================
// 📦 Crear pedido (GENÉRICO)
// ======================================================
export async function crearPedido(payload) {
  const { data } = await api.post('/pedidos', payload);
  return data;
}

// ======================================================
// 📦 Crear pedido asociado a mesa (OPCIÓN B)
// ======================================================
// Si hay mesa:
// {
//   restauranteId,
//   mesaId,
//   estado: 'pendiente'
// }
export async function crearPedidoConMesa({ restauranteId, mesaId, items = [], notas = null }) {
  if (!restauranteId) {
    throw new Error('restauranteId es obligatorio');
  }

  const payload = {
    restauranteId,
    estado: 'pendiente',
    items,
    notas
  };

  if (mesaId) {
    payload.mesaId = mesaId;
  }

  const { data } = await api.post('/pedidos', payload);
  return data;
}

// ======================================================
// 🔍 Obtener estado del pedido
// ======================================================
export async function obtenerEstadoPedido(pedidoId) {
  const { data } = await api.get(`/pedidos/estado/${pedidoId}`);
  return data?.data || null;
}

// ======================================================
// 🔄 Cambiar estado del pedido
// ======================================================
export async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
  const { data } = await api.put(`/pedidos/${pedidoId}/estado`, {
    estado: nuevoEstado
  });

  return data;
}

// ======================================================
// 🛎️ Llamar al mesero
// ======================================================
export async function llamarMesero(pedidoId) {
  const { data } = await api.post('/pedidos/llamar-mesero', {
    pedidoId
  });

  return data;
}

// ======================================================
// 📦 Exportación agrupada
// ======================================================
const pedidosService = {
  crearPedido,
  crearPedidoConMesa,
  obtenerEstadoPedido,
  cambiarEstadoPedido,
  llamarMesero
};

export default pedidosService;
