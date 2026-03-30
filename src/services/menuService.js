// client-qr/src/services/menuService.js
// ======================================================================
// 🍽️ Menu Service — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// • Fuente ÚNICA para menú público
// • Alineado 100% con backend real
// • Respeta jerarquía: restaurante → categorias → productos
// • Sin lógica de UI
// • Seguro, estable, SaaS-ready
// ======================================================================

import api from '../api/axiosConfig';

// ======================================================
// 🔧 Utilidades internas
// ======================================================
function asegurarArray(valor) {
  return Array.isArray(valor) ? valor : [];
}

// ======================================================
// 📋 Obtener menú público por SLUG
// ------------------------------------------------------
// GET /api/public/menu/:slug
// ======================================================
export async function obtenerMenuPublicoPorSlug(slug) {
  if (!slug) {
    throw new Error('slug del restaurante es obligatorio para obtener el menú');
  }

  try {
    const { data } = await api.get(`/public/menu/${slug}`);

    if (!data?.success || !data?.data) {
      return {
        restaurante: null,
        categorias: []
      };
    }

    const restaurante = data.data.restaurante ?? null;
    const categoriasRaw = asegurarArray(data.data.categorias);

    const categorias = categoriasRaw.map((categoria) => ({
      id: categoria.id ?? null,
      nombre: categoria.nombre ?? '',
      slug: categoria.slug ?? '',
      icono: categoria.icono ?? null,

      productos: asegurarArray(categoria.productos).map((producto) => ({
        id: producto.id ?? null,
        nombre: producto.nombre ?? '',
        descripcion: producto.descripcion ?? '',
        imagenUrl: producto.imagenUrl ?? null,
        slug: producto.slug ?? '',

        precio: Number(producto.precio) || 0,
        estado: producto.estado ?? 'activo',

        plato: producto.plato
          ? {
              tiempoPreparacion: producto.plato.tiempoPreparacion ?? null,
              alergenos: producto.plato.alergenos ?? null
            }
          : null
      }))
    }));

    return {
      restaurante,
      categorias
    };
  } catch (error) {
    console.error('❌ Error obteniendo menú público por slug:', error);
    return {
      restaurante: null,
      categorias: []
    };
  }
}

// ======================================================
// 🧩 Alias de compatibilidad (TRANSICIÓN CONTROLADA)
// ======================================================
export async function obtenerMenuPublico(slug) {
  return obtenerMenuPublicoPorSlug(slug);
}
