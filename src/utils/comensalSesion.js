'use strict';

const PREFIX = 'comanda_comensal';

function normalizar(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function keyFor(slug, mesaId) {
  return `${PREFIX}:${normalizar(slug) || 'restaurante'}:${normalizar(mesaId) || 'sin-mesa'}`;
}

export function obtenerComensalSesion(slug, mesaId) {
  try {
    const value = localStorage.getItem(keyFor(slug, mesaId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function guardarComensalSesion({ slug, mesaId, nombre }) {
  const nombreLimpio = String(nombre || '').trim();
  if (!nombreLimpio) return null;
  const actual = obtenerComensalSesion(slug, mesaId);
  const payload = {
    id: actual?.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nombre: nombreLimpio,
    actualizadaEn: new Date().toISOString()
  };
  try {
    localStorage.setItem(keyFor(slug, mesaId), JSON.stringify(payload));
  } catch {
    // El pedido sigue funcionando si el navegador bloquea almacenamiento.
  }
  return payload;
}
