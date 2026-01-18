// client-qr/src/utils/validarPedido.js
// ======================================================================
// 🧠 validarPedido.js – FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Blindaje total del flujo de pedido (UX + lógica)
// • Funciones PURAS (sin React, sin contexto)
// • Sin dependencias externas
// • Testeable (Jest / Vitest)
// • i18n-ready (códigos + mensajes)
// • Fuente ÚNICA de verdad del flujo
// • Previene saltos ilegales entre pasos
// ======================================================================

'use strict';

// ======================================================
// 📌 Definición de pasos válidos del flujo
// ======================================================
export const PASOS_PEDIDO = Object.freeze({
  CONTEXTO: 'contexto', // mesa / domicilio
  PAGO: 'pago', // caja / online
  CONFIRMACION: 'confirmacion'
});

// ======================================================
// 📌 Códigos de error enterprise (i18n-friendly)
// ======================================================
export const ERRORES_PEDIDO = Object.freeze({
  CARRITO_VACIO: {
    codigo: 'CARRITO_VACIO',
    mensaje: 'Debes agregar al menos un producto'
  },
  CANTIDADES_INVALIDAS: {
    codigo: 'CANTIDADES_INVALIDAS',
    mensaje: 'Hay productos con cantidades inválidas'
  },
  FALTA_CONTEXTO: {
    codigo: 'FALTA_CONTEXTO',
    mensaje: 'Debes seleccionar el tipo de pedido'
  },
  FALTA_MESA: {
    codigo: 'FALTA_MESA',
    mensaje: 'Debes ingresar el número de mesa'
  },
  FALTA_DIRECCION: {
    codigo: 'FALTA_DIRECCION',
    mensaje: 'Debes ingresar una dirección de entrega'
  },
  FALTA_METODO_PAGO: {
    codigo: 'FALTA_METODO_PAGO',
    mensaje: 'Debes seleccionar un método de pago'
  },
  SALTO_ILEGAL: {
    codigo: 'SALTO_ILEGAL',
    mensaje: 'No puedes avanzar sin completar el paso anterior'
  }
});

// ======================================================
// 🧩 Helpers internos (puros)
// ======================================================
const tieneItems = (items) =>
  Array.isArray(items) && items.length > 0;

const cantidadesValidas = (items) =>
  Array.isArray(items) &&
  items.every((i) => Number(i.cantidad) > 0);

const contextoValido = (pedido) =>
  pedido?.tipoPedido === 'mesa' ||
  pedido?.tipoPedido === 'domicilio';

const mesaValida = (pedido) =>
  pedido?.tipoPedido !== 'mesa' ||
  Boolean(pedido?.mesaId);

const direccionValida = (pedido) =>
  pedido?.tipoPedido !== 'domicilio' ||
  Boolean(pedido?.direccion);

const metodoPagoValido = (pedido) =>
  Boolean(pedido?.metodoPago);

// ======================================================
// 🧠 Validador principal
// ======================================================
export function validarPedido(pedido = {}, pasoActual) {
  const errores = [];

  // --------------------------------------------------
  // 1️⃣ Validación base: carrito
  // --------------------------------------------------
  if (!tieneItems(pedido.items)) {
    errores.push({
      campo: 'items',
      ...ERRORES_PEDIDO.CARRITO_VACIO
    });
  }

  if (!cantidadesValidas(pedido.items)) {
    errores.push({
      campo: 'items',
      ...ERRORES_PEDIDO.CANTIDADES_INVALIDAS
    });
  }

  // --------------------------------------------------
  // 2️⃣ Paso: CONTEXTO
  // --------------------------------------------------
  if (pasoActual === PASOS_PEDIDO.CONTEXTO) {
    if (!contextoValido(pedido)) {
      errores.push({
        campo: 'tipoPedido',
        ...ERRORES_PEDIDO.FALTA_CONTEXTO
      });
    }

    if (!mesaValida(pedido)) {
      errores.push({
        campo: 'mesaId',
        ...ERRORES_PEDIDO.FALTA_MESA
      });
    }

    if (
      pedido.tipoPedido === 'domicilio' &&
      !direccionValida(pedido)
    ) {
      errores.push({
        campo: 'direccion',
        ...ERRORES_PEDIDO.FALTA_DIRECCION
      });
    }
  }

  // --------------------------------------------------
  // 3️⃣ Paso: PAGO
  // --------------------------------------------------
  if (pasoActual === PASOS_PEDIDO.PAGO) {
    if (!contextoValido(pedido)) {
      errores.push({
        campo: 'flujo',
        ...ERRORES_PEDIDO.SALTO_ILEGAL
      });
    }

    if (!mesaValida(pedido)) {
      errores.push({
        campo: 'mesaId',
        ...ERRORES_PEDIDO.FALTA_MESA
      });
    }

    if (!direccionValida(pedido)) {
      errores.push({
        campo: 'direccion',
        ...ERRORES_PEDIDO.FALTA_DIRECCION
      });
    }

    if (!metodoPagoValido(pedido)) {
      errores.push({
        campo: 'metodoPago',
        ...ERRORES_PEDIDO.FALTA_METODO_PAGO
      });
    }
  }

  // --------------------------------------------------
  // 4️⃣ Paso: CONFIRMACIÓN
  // --------------------------------------------------
  if (pasoActual === PASOS_PEDIDO.CONFIRMACION) {
    if (
      !contextoValido(pedido) ||
      !mesaValida(pedido) ||
      !direccionValida(pedido) ||
      !metodoPagoValido(pedido)
    ) {
      errores.push({
        campo: 'flujo',
        ...ERRORES_PEDIDO.SALTO_ILEGAL
      });
    }
  }

  // --------------------------------------------------
  // 🧾 Resultado final
  // --------------------------------------------------
  const valido = errores.length === 0;

  return {
    valido,
    puedeAvanzar: valido,
    errores
  };
}
