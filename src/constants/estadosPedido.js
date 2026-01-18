// client-qr/src/constants/estadosPedido.js
// ======================================================
// 🧾 Estados de Pedido – FASTORDER Client QR (Enterprise 2026)
// ------------------------------------------------------
// VALIDACIÓN FASE 6 (QUIRÚRGICA – SENIOR):
// ✔ Mapping estado → texto humano (UX)
// ✔ Mapping estadoPago → texto humano (UX)
// ✔ Alineado 1:1 con backend/models/Pedido.js
// ✔ Sin strings mágicos
// ✔ Listo para uso directo en UI (EstadoPedido / ConfirmacionPedido)
// ======================================================

'use strict';

// ======================================================
// 📦 ESTADOS OPERATIVOS (POS / KDS)
// ======================================================
export const ESTADOS_PEDIDO = Object.freeze({
  PENDIENTE: 'pendiente',
  ACEPTADO: 'aceptado',
  PREPARACION: 'preparacion',
  LISTO: 'listo',
  PENDIENTE_PAGO: 'pendiente_pago',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado'
});

// ======================================================
// 💳 ESTADOS DE PAGO (FINANCIERO)
// ======================================================
export const ESTADOS_PAGO = Object.freeze({
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado',
  FALLIDO: 'fallido'
});

// ======================================================
// 💳 MÉTODOS DE PAGO (INTENCIÓN – FRONTEND)
// ======================================================
export const METODOS_PAGO = Object.freeze({
  CAJA: 'caja',
  ONLINE: 'online'
});

// ======================================================
// 💵 MEDIOS DE PAGO (REAL – POSTERIOR)
// ======================================================
export const MEDIOS_PAGO = Object.freeze({
  EFECTIVO: 'efectivo',
  DATÁFONO: 'datáfono',
  NEQUI: 'nequi',
  DAVIPLATA: 'daviplata'
});

// ======================================================
// 🧠 LABELS UX — ESTADO OPERATIVO
// (Usar SIEMPRE en UI, nunca enums directos)
// ======================================================
export const LABELS_ESTADOS_PEDIDO = Object.freeze({
  [ESTADOS_PEDIDO.PENDIENTE]: 'Pedido recibido',
  [ESTADOS_PEDIDO.ACEPTADO]: 'Pedido aceptado',
  [ESTADOS_PEDIDO.PREPARACION]: 'En preparación',
  [ESTADOS_PEDIDO.LISTO]: 'Listo para entrega',
  [ESTADOS_PEDIDO.PENDIENTE_PAGO]: 'Pendiente de pago',
  [ESTADOS_PEDIDO.ENTREGADO]: 'Entregado',
  [ESTADOS_PEDIDO.CANCELADO]: 'Cancelado'
});

// ======================================================
// 🧠 LABELS UX — ESTADO DE PAGO
// ======================================================
export const LABELS_ESTADOS_PAGO = Object.freeze({
  [ESTADOS_PAGO.PENDIENTE]: 'Pago pendiente',
  [ESTADOS_PAGO.PAGADO]: 'Pago confirmado',
  [ESTADOS_PAGO.FALLIDO]: 'Pago fallido'
});
