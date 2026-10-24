// ======================================================================
// client-qr/src/utils/bloqueoPedido.js
// ======================================================================
'use strict';

import {
  buildTenantStorageKey,
  getCurrentTenantSlug,
  normalizeTenantSlug,
  readJsonStorage,
  writeJsonStorage
} from './tenantStorage';

const STORAGE_KEY = 'comanda_pedido_activo';

function keyFor(slug = getCurrentTenantSlug()) {
  return buildTenantStorageKey(STORAGE_KEY, slug);
}

function construirRutaMenu({ slug, numeroMesa, tipoPedido }) {
  const slugNormalizado = `${slug ?? ''}`.trim();
  if (!slugNormalizado) return '/';

  const numeroMesaNormalizado = `${numeroMesa ?? ''}`.trim();
  if (tipoPedido === 'mesa' && numeroMesaNormalizado) {
    return `/${slugNormalizado}/mesa/${numeroMesaNormalizado}`;
  }

  return `/${slugNormalizado}`;
}

export function guardarPedidoActivo(pedido, contexto = {}) {
  if (!pedido?.id) return;

  const slug = normalizeTenantSlug(contexto.slug ?? pedido?.slug ?? getCurrentTenantSlug());
  const restauranteId = contexto.restauranteId ?? pedido?.restauranteId ?? null;
  const mesaId = contexto.mesaId ?? pedido?.mesaId ?? pedido?.mesa?.id ?? null;
  const numeroMesa = contexto.numeroMesa ?? pedido?.mesa?.numero ?? pedido?.numeroMesa ?? null;
  const numeroMesaCuenta = contexto.numeroMesaCuenta ?? pedido?.mesa?.numero ?? pedido?.numeroMesaCuenta ?? null;
  const tipoPedido = contexto.tipoPedido ?? pedido?.tipoPedido ?? null;
  const cuentaCompartidaActiva = Boolean(
    contexto.cuentaCompartidaActiva ?? pedido?.cuentaCompartidaActiva ?? false
  );

  writeJsonStorage(
    keyFor(slug),
    {
      pedidoId: pedido.id,
      estado: pedido.estado,
      estadoPago: pedido.estadoPago,
      tipoPedido,
      metodoPago: pedido.metodoPago ?? null,
      tiempoPreparacion: pedido.tiempoPreparacion ?? null,
      total: pedido.total ?? null,
      updatedAt: pedido.updatedAt ?? null,
      slug,
      restauranteId,
      mesaId,
      numeroMesa,
      numeroMesaCuenta,
      cuentaCompartidaActiva,
      clienteNombre: String(contexto.clienteNombre ?? pedido?.clienteNombre ?? '').trim() || null,
      menuPath: construirRutaMenu({ slug, numeroMesa, tipoPedido })
    }
  );
}

export function obtenerPedidoActivo() {
  const tenantSlug = getCurrentTenantSlug();
  const pedido = readJsonStorage(keyFor(tenantSlug));
  if (pedido) return pedido;

  const legacy = readJsonStorage(STORAGE_KEY);
  if (!legacy) return null;
  if (tenantSlug && normalizeTenantSlug(legacy.slug) !== tenantSlug) return null;
  return legacy;
}

export function puedeCrearNuevoPedido() {
  const pedido = obtenerPedidoActivo();
  if (!pedido) return true;
  if (pedido.tipoPedido === 'mesa') return true;
  return ['entregado', 'cancelado'].includes(pedido.estado);
}

export function actualizarEstadoPedido(estado) {
  const pedido = obtenerPedidoActivo();
  if (!pedido) return;
  pedido.estado = estado;
  localStorage.setItem(keyFor(pedido.slug), JSON.stringify(pedido));
}

export function actualizarPedidoActivo(parcial = {}) {
  const pedido = obtenerPedidoActivo();
  if (!pedido) return;
  const siguientePedido = {
    ...pedido,
    ...parcial
  };

  writeJsonStorage(
    keyFor(siguientePedido.slug),
    {
      ...siguientePedido,
      menuPath: construirRutaMenu({
        slug: siguientePedido.slug,
        numeroMesa: siguientePedido.numeroMesa,
        tipoPedido: siguientePedido.tipoPedido
      })
    }
  );
}

export function obtenerRutaMenuPedido(fallbackSlug = null, fallbackNumeroMesa = null) {
  const pedido = obtenerPedidoActivo();
  const slug = fallbackSlug || pedido?.slug || null;
  const numeroMesa = fallbackNumeroMesa || pedido?.numeroMesa || null;
  const tipoPedido = pedido?.tipoPedido || null;

  if (pedido?.menuPath) return pedido.menuPath;
  return construirRutaMenu({ slug, numeroMesa, tipoPedido });
}

export function limpiarPedidoActivo() {
  const pedido = obtenerPedidoActivo();
  const tenantSlug = getCurrentTenantSlug();
  const legacy = readJsonStorage(STORAGE_KEY);
  localStorage.removeItem(keyFor(pedido?.slug));

  if (legacy && (!tenantSlug || normalizeTenantSlug(legacy.slug) === tenantSlug)) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

