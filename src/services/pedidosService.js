// ======================================================================
// 📦 pedidosService.js – COMANDA Client QR 2026
// ----------------------------------------------------------------------
// • Crea pedidos ASOCIADOS a mesa cuando exista contexto
// • Fuente única HTTP (axios / api centralizado)
// ======================================================================

import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import api from './api';

// ======================================================
// 📦 Crear pedido (GENÉRICO)
// ======================================================
export async function crearPedido(payload) {
  const { data } = await api.post('/pedidos', payload);
  return data;
}

export async function crearPedidoPublico(payload) {
  const { data } = await axios.post(`${API_BASE_URL}/public/pedidos`, payload, {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
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

export async function obtenerEstadoPedidoPublico(slug, pedidoId) {
  if (!slug || !pedidoId) {
    throw new Error('slug y pedidoId son obligatorios');
  }

  const { data } = await api.get(`/public/display/${slug}/pedidos/${pedidoId}/estado`);
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
  crearPedidoPublico,
  crearPedidoConMesa,
  obtenerEstadoPedido,
  obtenerEstadoPedidoPublico,
  cambiarEstadoPedido,
  llamarMesero
};

export default pedidosService;

