'use strict';

import {
  buildTenantStorageKey,
  getCurrentTenantSlug,
  normalizeTenantSlug,
  readJsonStorage,
  writeJsonStorage
} from './tenantStorage';

const STORAGE_KEY = 'comanda_mesa_qr_sesion';

function keyFor(slug = getCurrentTenantSlug()) {
  return buildTenantStorageKey(STORAGE_KEY, slug);
}

function leerSesion(slug = getCurrentTenantSlug()) {
  const tenantSlug = normalizeTenantSlug(slug);
  const sesion = readJsonStorage(keyFor(tenantSlug));
  if (sesion) return sesion;

  const legacy = readJsonStorage(STORAGE_KEY);
  if (!legacy) return null;
  if (tenantSlug && normalizeTenantSlug(legacy.slug) !== tenantSlug) return null;
  return legacy;
}

export function obtenerSesionMesaQr() {
  return leerSesion();
}

export function guardarSesionMesaQr(sesion = {}) {
  const slug = normalizeTenantSlug(sesion.slug) || getCurrentTenantSlug();
  const payload = {
    slug: slug || null,
    numeroMesa: sesion.numeroMesa ?? null,
    mesaId: sesion.mesaId ?? null,
    restauranteId: sesion.restauranteId ?? null,
    mesaCuentaNumero: sesion.mesaCuentaNumero ?? null,
    cuentaCompartidaActiva: Boolean(sesion.cuentaCompartidaActiva),
    grupoMesas: Array.isArray(sesion.grupoMesas) ? sesion.grupoMesas : [],
    token: sesion.token ?? null,
    requiereReescaneo: Boolean(sesion.requiereReescaneo),
    motivoBloqueo: sesion.motivoBloqueo ?? null,
    actualizadaEn: sesion.actualizadaEn ?? new Date().toISOString()
  };

  writeJsonStorage(keyFor(slug), payload);
}

export function actualizarSesionMesaQr(parcial = {}) {
  const actual = leerSesion();
  if (!actual) return;

  guardarSesionMesaQr({
    ...actual,
    ...parcial,
    actualizadaEn: new Date().toISOString()
  });
}

export function limpiarSesionMesaQr() {
  const tenantSlug = getCurrentTenantSlug();
  const legacy = readJsonStorage(STORAGE_KEY);
  localStorage.removeItem(keyFor());

  if (legacy && (!tenantSlug || normalizeTenantSlug(legacy.slug) === tenantSlug)) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function requerirReescaneoMesaQr(motivoBloqueo = 'pedido_entregado') {
  const actual = leerSesion();
  if (!actual) return;

  guardarSesionMesaQr({
    ...actual,
    token: null,
    requiereReescaneo: true,
    motivoBloqueo
  });
}
