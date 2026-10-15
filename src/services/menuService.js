// client-qr/src/services/menuService.js
// ======================================================================
// 🍽️ Menu Service — COMANDA Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// • Fuente ÚNICA para menú público
// • Alineado 100% con backend real
// • Respeta jerarquía: restaurante → categorias → productos
// • Sin lógica de UI
// • Seguro, estable, SaaS-ready
// ======================================================================

import api from '../api/axiosConfig';

const EMPTY_MENU_INTELLIGENCE = {
  mode: 'backend-signals',
  periodDays: 30,
  generatedAt: null,
  summary: null,
  destacadosMenu: [],
  productoSignals: [],
  productoSignalsMap: {},
  sugerenciasCarrito: []
};

function sanitizeMenuSmartBadge(value = '') {
  const normalized = normalizarTexto(value);

  if (!normalized) return 'Destacado';
  if (normalized.includes('pide con confianza')) return 'Sugerido';
  if (normalized.includes('recomendado ahora')) return 'Sugerido';
  if (normalized.includes('buena eleccion')) return 'Destacado';
  if (normalized.includes('listo para vender')) return 'Destacado';
  if (normalized.includes('mas pedido')) return 'Popular';
  if (normalized.includes('recomendado')) return 'Recomendado';

  return value;
}

function sanitizeMenuSmartSummary(summary = null) {
  return {
    title: 'Selecciones destacadas',
    description:
      'Encuentra opciones destacadas y combinaciones sugeridas para elegir con mas claridad.'
  };
}

function buildFallbackMenuIntelligence(categorias = []) {
  const productos = categorias.flatMap((categoria) =>
    asegurarArray(categoria.productos)
      .filter((producto) => producto.disponible !== false)
      .map((producto) => ({
        ...producto,
        categoriaId: categoria.id ?? null,
        categoriaNombre: categoria.nombre ?? '',
        bucket: obtenerBucketCatalogo(`${categoria.nombre} ${producto.nombre}`),
        rapido: Number(producto?.plato?.tiempoPreparacion || 0) > 0 && Number(producto?.plato?.tiempoPreparacion || 0) <= 12
      }))
  );

  if (!productos.length) {
    return { ...EMPTY_MENU_INTELLIGENCE };
  }

  const destacados = [...productos].sort((left, right) => {
    if (Boolean(left.destacado) !== Boolean(right.destacado)) {
      return left.destacado ? -1 : 1;
    }

    if (Boolean(left.rapido) !== Boolean(right.rapido)) {
      return left.rapido ? -1 : 1;
    }

    return Number(left.precio || 0) - Number(right.precio || 0);
  });

  const pickComplemento = (producto) => {
    const prioridades =
      producto.bucket === 'comida'
        ? ['bebidas', 'postres', 'combos', 'otro']
        : producto.bucket === 'bebidas'
          ? ['comida', 'postres', 'combos', 'otro']
          : ['bebidas', 'comida', 'postres', 'combos', 'otro'];

    for (const bucket of prioridades) {
      const candidato = productos.find(
        (item) => item.id !== producto.id && item.bucket === bucket
      );

      if (candidato) return candidato;
    }

    return productos.find((item) => item.id !== producto.id) || null;
  };

  return {
    mode: 'client-fallback',
    periodDays: 0,
    generatedAt: null,
    summary: sanitizeMenuSmartSummary(),
    destacadosMenu: destacados.slice(0, 3).map((producto, index) => {
      const acompanante = pickComplemento(producto);
      return {
        id: `fallback-destacado-${producto.id}`,
        badge: index === 0 ? 'Recomendado' : index === 1 ? 'Sugerido' : 'Destacado',
        title: producto.nombre,
        description: producto.destacado
          ? 'El negocio ya lo tiene marcado como fuerte dentro del menu.'
          : producto.rapido
            ? `Sale rapido en ${producto.plato?.tiempoPreparacion || 12} min aprox.`
            : 'Tiene buena pinta para abrir el pedido y seguir comprando.',
        metric: producto.precio ? `Desde $${Number(producto.precio).toLocaleString('es-CO')}` : null,
        ctaLabel: 'Ver producto',
        producto,
        acompanante
      };
    }),
    productoSignals: destacados.slice(0, 6).map((producto, index) => ({
      productId: producto.id,
      label: index === 0 ? 'Recomendado' : producto.rapido ? 'Sale rapido' : 'Buena eleccion',
      tone: index === 0 ? 'featured' : producto.rapido ? 'cool' : 'warm',
      hint: producto.destacado
        ? 'Marcado por el negocio'
        : producto.rapido
          ? `${producto.plato?.tiempoPreparacion || 12} min aprox`
          : 'Ayuda a abrir el pedido',
      producto
    })),
    sugerenciasCarrito: destacados.slice(0, 4).map((producto) => {
      const productoSugerido = pickComplemento(producto);
      if (!productoSugerido) return null;

      return {
        id: `fallback-cart-${producto.id}-${productoSugerido.id}`,
        label: 'Combo sugerido',
        title: `Combina ${producto.nombre} con ${productoSugerido.nombre}`,
        description: `Agregar ${productoSugerido.nombre} ayuda a completar el pedido con una compra mas redonda.`,
        ctaLabel: 'Agregar tambien',
        anchorProductId: producto.id,
        suggestedProductId: productoSugerido.id,
        productoAncla: producto,
        productoSugerido
      };
    }).filter(Boolean)
  };
}

// ======================================================
// 🔧 Utilidades internas
// ======================================================
function asegurarArray(valor) {
  return Array.isArray(valor) ? valor : [];
}

function normalizarTexto(valor = '') {
  return String(valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function incluyeAlguno(texto, keywords = []) {
  return keywords.some((keyword) => texto.includes(keyword));
}

const CATEGORY_KEYWORDS = {
  bebidas: ['bebida', 'bebidas', 'gaseosa', 'limonada', 'malteada', 'agua', 'jugo', 'cafe', 'te', 'soda'],
  comida: ['hamburguesa', 'hamburgesa', 'burger', 'perro', 'hot dog', 'salchipapa', 'pizza', 'sandwich'],
  combos: ['combo', 'promo', 'promocion'],
  postres: ['postre', 'brownie', 'cheesecake', 'helado', 'galleta', 'torta']
};

function obtenerBucketCatalogo(valor = '') {
  const normalizado = normalizarTexto(valor);

  if (incluyeAlguno(normalizado, CATEGORY_KEYWORDS.bebidas)) return 'bebidas';
  if (incluyeAlguno(normalizado, CATEGORY_KEYWORDS.postres)) return 'postres';
  if (incluyeAlguno(normalizado, CATEGORY_KEYWORDS.combos)) return 'combos';
  if (incluyeAlguno(normalizado, CATEGORY_KEYWORDS.comida)) return 'comida';

  return 'otro';
}

function compararProductos(a, b) {
  if (a.disponible !== b.disponible) {
    return a.disponible ? -1 : 1;
  }

  if (Boolean(a.destacado) !== Boolean(b.destacado)) {
    return a.destacado ? -1 : 1;
  }

  return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre), 'es');
}

function esProductoLegacyOculto(producto, categoriaNombre = '', productosCategoria = []) {
  const stockActual = Number(producto.stockActual ?? 0);
  const stockMinimo = Number(producto.stockMinimo ?? 0);
  const categoriaTieneActivos = productosCategoria.some((item) => item?.disponible !== false);
  const categoriaBucket = obtenerBucketCatalogo(categoriaNombre);
  const productoBucket = obtenerBucketCatalogo(producto?.nombre);
  const categoriaIncompatible =
    categoriaBucket !== 'otro' &&
    productoBucket !== 'otro' &&
    categoriaBucket !== productoBucket;

  return (
    categoriaTieneActivos &&
    categoriaIncompatible &&
    producto?.disponible === false &&
    producto?.stockFuente === 'producto' &&
    producto?.controlarStock === true &&
    !producto?.inventarioItemId &&
    stockActual <= 0 &&
    stockMinimo === 0
  );
}

function normalizarInteligenciaVenta(valor, categorias = []) {
  const fallback = buildFallbackMenuIntelligence(categorias);
  if (!valor || typeof valor !== 'object') {
    return fallback;
  }

  const productos = categorias.flatMap((categoria) =>
    asegurarArray(categoria.productos).map((producto) => ({
      ...producto,
      categoriaId: categoria.id ?? null,
      categoriaNombre: categoria.nombre ?? ''
    }))
  );
  const productoMap = new Map(productos.map((producto) => [Number(producto.id), producto]));

  const destacadosMenu = asegurarArray(valor.destacadosMenu)
    .map((item) => {
      const producto = productoMap.get(Number(item.productId));
      if (!producto) return null;

      const acompanante = item.companionProductId
        ? productoMap.get(Number(item.companionProductId)) || null
        : null;

      return {
        id: item.id || `destacado-${producto.id}`,
        badge: sanitizeMenuSmartBadge(item.badge || 'Recomendado'),
        title: item.title || producto.nombre,
        description: item.description || '',
        metric: item.metric || null,
        ctaLabel: item.ctaLabel || 'Ver producto',
        producto,
        acompanante
      };
    })
    .filter(Boolean);

  const productoSignals = asegurarArray(valor.productoSignals)
    .map((signal) => {
      const producto = productoMap.get(Number(signal.productId));
      if (!producto) return null;

      return {
        productId: producto.id,
        label: signal.label || 'Recomendado',
        tone: signal.tone || 'featured',
        hint: signal.hint || '',
        producto
      };
    })
    .filter(Boolean);

  const effectiveSignals = productoSignals.length ? productoSignals : fallback.productoSignals;
  const productoSignalsMap = effectiveSignals.reduce((acc, signal) => {
    acc[signal.productId] = signal;
    return acc;
  }, {});

  const sugerenciasCarrito = asegurarArray(valor.sugerenciasCarrito)
    .map((item) => {
      const productoAncla = productoMap.get(Number(item.anchorProductId));
      const productoSugerido = productoMap.get(Number(item.suggestedProductId));

      if (!productoAncla || !productoSugerido) return null;

      return {
        id: item.id || `cart-${productoAncla.id}-${productoSugerido.id}`,
        label: item.label || 'Upsell',
        title: item.title || `Combina ${productoAncla.nombre} con ${productoSugerido.nombre}`,
        description: item.description || '',
        ctaLabel: item.ctaLabel || 'Agregar tambien',
        anchorProductId: productoAncla.id,
        suggestedProductId: productoSugerido.id,
        productoAncla,
        productoSugerido
      };
    })
    .filter(Boolean);

  return {
    mode: valor.mode || 'backend-signals',
    periodDays: Number(valor.periodDays) || 30,
    generatedAt: valor.generatedAt || null,
    summary: sanitizeMenuSmartSummary(valor.summary || fallback.summary || null),
    destacadosMenu: destacadosMenu.length ? destacadosMenu : fallback.destacadosMenu,
    productoSignals: effectiveSignals,
    productoSignalsMap,
    sugerenciasCarrito: sugerenciasCarrito.length ? sugerenciasCarrito : fallback.sugerenciasCarrito
  };
}

// ======================================================
// 📋 Obtener menú público por SLUG
// ------------------------------------------------------
// GET /api/public/menu/:slug
// ======================================================
export async function obtenerMenuPublicoPorSlug(slug) {
  const slugSeguro = encodeURIComponent(String(slug || '').trim());
  if (!slugSeguro) {
    throw new Error('slug del restaurante es obligatorio para obtener el menú');
  }

  try {
    const { data } = await api.get(`/public/menu/${slugSeguro}`);

    if (!data?.success || !data?.data) {
      return {
        restaurante: null,
        categorias: [],
        inteligenciaVenta: { ...EMPTY_MENU_INTELLIGENCE }
      };
    }

    const restauranteRaw = data.data.restaurante ?? null;
    const restaurante = restauranteRaw
      ? {
          ...restauranteRaw,
          plan: restauranteRaw.plan ?? 'base',
          planNombre: restauranteRaw.planNombre ?? 'Base',
          features: {
            pedidosQR: Boolean(restauranteRaw.features?.pedidosQR),
            qrMesa: Boolean(restauranteRaw.features?.qrMesa),
            promociones: Boolean(restauranteRaw.features?.promociones),
            traduccionAutomatica: Boolean(restauranteRaw.features?.traduccionAutomatica),
            upsellActivo: Boolean(restauranteRaw.features?.upsellActivo),
            iaIncluida: Boolean(restauranteRaw.features?.iaIncluida)
          }
        }
      : null;
    const categoriasRaw = asegurarArray(data.data.categorias);

    const categorias = categoriasRaw.map((categoria) => {
      const productosNormalizados = asegurarArray(categoria.productos).map((producto) => ({
        id: producto.id ?? null,
        nombre: producto.nombre ?? '',
        descripcion: producto.descripcion ?? '',
        imagenUrl: producto.imagenUrl ?? null,
        slug: producto.slug ?? '',

        precio: Number(producto.precio) || 0,
        estado: producto.estado ?? 'activo',
        disponible: producto.disponible !== false,
        estadoStock: producto.estadoStock ?? 'sin_control',
        stockFuente: producto.stockFuente ?? 'sin_control',
        stockActual: producto.stockActual ?? null,
        stockMinimo: producto.stockMinimo ?? null,
        controlarStock: Boolean(producto.controlarStock),
        inventarioItemId: producto.inventarioItemId ?? null,
        destacado: Boolean(producto.destacado),

        plato: producto.plato
          ? {
              tiempoPreparacion: producto.plato.tiempoPreparacion ?? null,
              alergenos: producto.plato.alergenos ?? null
            }
          : null
      }));

      const productosVisibles = productosNormalizados
        .filter((producto) => !esProductoLegacyOculto(producto, categoria.nombre, productosNormalizados))
        .sort(compararProductos);

      return {
        id: categoria.id ?? null,
        nombre: categoria.nombre ?? '',
        slug: categoria.slug ?? '',
        descripcion: categoria.descripcion ?? '',
        icono: categoria.icono ?? null,
        productos: productosVisibles
      };
    });

    const inteligenciaVenta = normalizarInteligenciaVenta(data.data.inteligenciaVenta, categorias);

    return {
      restaurante,
      categorias,
      inteligenciaVenta
    };
  } catch (error) {
    console.error('❌ Error obteniendo menú público por slug:', error);
    return {
      restaurante: null,
      categorias: [],
      inteligenciaVenta: { ...EMPTY_MENU_INTELLIGENCE }
    };
  }
}

// ======================================================
// 🧩 Alias de compatibilidad (TRANSICIÓN CONTROLADA)
// ======================================================
export async function obtenerMenuPublico(slug) {
  return obtenerMenuPublicoPorSlug(slug);
}

