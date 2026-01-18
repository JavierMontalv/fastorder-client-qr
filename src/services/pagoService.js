// client-qr/src/services/pagoService.js
// ======================================================================
// 💳 Pago Service (QR Client) – FASTORDER 2026
// ----------------------------------------------------------------------
// • SOLO selección de método de pago
// • NO marca pedido como pagado
// • NO lógica de negocio
// • HTTP puro
// • Compatible con pedidos QR / Mesa
// ======================================================================

'use strict';

import api from '../api/api';

// ======================================================
// 🧾 Seleccionar método de pago (QR)
// ------------------------------------------------------
// ⚠️ NO marca pagado
// ⚠️ NO cambia estado
// ======================================================
// PATCH /api/pedidos/:pedidoId/metodo-pago
// body: { metodoPago }
// ======================================================
export async function seleccionarMetodoPago(pedidoId, metodoPago) {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  if (!metodoPago) {
    throw new Error('metodoPago es obligatorio');
  }

  const { data } = await api.patch(
    `/pedidos/${pedidoId}/metodo-pago`,
    { metodoPago }
  );

  return data;
}

export default {
  seleccionarMetodoPago
};
