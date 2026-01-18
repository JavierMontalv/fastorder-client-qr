// ========================================================================
// 🌐 Servicio de Restaurante – FASTORDER QR Client 2026
// ------------------------------------------------------------------------
// • Consume SOLO endpoints públicos
// • Identidad basada en SLUG (multi-tenant real)
// • NO usa JWT
// • NO usa IDs internos
// • Seguro para QR / CDN / cache
// • Arquitectura SaaS madura (solo HTTP → datos)
// ========================================================================

import api from '../api/axiosConfig';

// ========================================================================
// 🔧 Helper interno: normalizar respuesta FastOrder
// ========================================================================
const unwrap = (res, fallback = []) => res?.data?.data ?? fallback;

// ========================================================================
// 📌 Obtener configuración pública del restaurante
// GET /api/public/restaurantes/:slug
// ========================================================================
export const obtenerConfigRestaurante = async (slug) => {
  if (!slug) {
    throw new Error('Slug del restaurante requerido');
  }

  const res = await api.get(`/public/restaurantes/${slug}`);
  return unwrap(res, null); // 👈 SOLO restaurante
};

// ========================================================================
// 📌 Obtener promociones públicas del restaurante
// GET /api/public/promociones/:slug
// ========================================================================
export const obtenerPromocionesPublicas = async (slug) => {
  if (!slug) {
    return [];
  }

  try {
    const res = await api.get(`/public/promociones/${slug}`);
    return unwrap(res);
  } catch {
    return [];
  }
};

// ========================================================================
// 📌 Obtener menú público del restaurante
// GET /api/public/menu/:slug
// ========================================================================
export const obtenerMenuPublico = async (slug) => {
  if (!slug) {
    return [];
  }

  try {
    const res = await api.get(`/public/menu/${slug}`);
    return unwrap(res);
  } catch {
    return [];
  }
};

// ========================================================================
// 📌 Obtener categorías públicas visibles
// GET /api/public/categorias/:slug
// ========================================================================
export const obtenerCategoriasPublicas = async (slug) => {
  if (!slug) {
    return [];
  }

  try {
    const res = await api.get(`/public/categorias/${slug}`);
    return unwrap(res);
  } catch {
    return [];
  }
};
