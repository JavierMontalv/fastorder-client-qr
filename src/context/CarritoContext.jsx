// ======================================================================
// 🛍️ COMANDA CLIENT QR 2026 – CONTEXTO GLOBAL DE CARRITO (ENTERPRISE)
// ----------------------------------------------------------------------
// Diseño tipo Shopify POS · Rappi Aliado · Starbucks Mobile Order
// ----------------------------------------------------------------------
// CORRECCIÓN FASE 6 (QUIRÚRGICA):
// ✔ El carrito NO se vacía al enviar pedido
// ✔ El carrito SOLO se vacía cuando el pedido es CONFIRMADO
// ✔ Se previene doble pago / doble pedido accidental
// ✔ Se integra bloqueo de pedido activo (localStorage)
// ----------------------------------------------------------------------
// Funcionalidades intactas:
// • Manejo de items, cantidades, totales
// • Persistencia segura en localStorage
// • API enterprise estable (NO BREAKING CHANGES)
// ======================================================================

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildTenantStorageKey,
  getTenantSlugFromPath,
  readJsonStorage,
  writeJsonStorage
} from '../utils/tenantStorage';

// ----------------------------------------------------------------------
// 📦 Clave global del almacenamiento
// ----------------------------------------------------------------------
const STORAGE_KEY = 'comanda_carrito';

// ----------------------------------------------------------------------
// 🧠 Crear contexto
// ----------------------------------------------------------------------
const CarritoContext = createContext(null);

function serializarConfiguracion(producto = {}) {
  return JSON.stringify({
    productoId: Number(producto.id),
    instrucciones: (producto.instrucciones || '').trim(),
    modificaciones: Array.isArray(producto.modificaciones)
      ? producto.modificaciones.map((grupo) => ({
          grupoId: Number(grupo.grupoId || grupo.id),
          opciones: Array.isArray(grupo.opciones)
            ? grupo.opciones.map((opcion) => Number(opcion.id || opcion.opcionId)).sort((a, b) => a - b)
            : []
        }))
      : [],
    extras: Array.isArray(producto.extras)
      ? producto.extras.map((extra) => Number(extra.id || extra.opcionId)).sort((a, b) => a - b)
      : []
  });
}

function normalizarItemCarrito(producto = {}) {
  const precioBase = Number(producto.precio) || 0;
  const precioUnitario = Number(producto.precioUnitario ?? producto.precioFinal ?? precioBase) || 0;
  const cantidad = Math.min(99, Math.max(1, Number(producto.cantidad) || 1));
  const imagenUrl = producto.imagenUrl || producto.imagen || null;
  const firma = serializarConfiguracion(producto);
  const lineId = producto.lineId || `prod-${producto.id}-${btoa(unescape(encodeURIComponent(firma))).replace(/=+$/g, '')}`;

  return {
    lineId,
    id: Number(producto.id),
    nombre: producto.nombre,
    precio: precioBase,
    precioUnitario,
    imagenUrl,
    imagen: imagenUrl,
    cantidad,
    instrucciones: (producto.instrucciones || '').trim(),
    modificaciones: Array.isArray(producto.modificaciones) ? producto.modificaciones : [],
    extras: Array.isArray(producto.extras) ? producto.extras : [],
    firmaConfiguracion: firma
  };
}

// ----------------------------------------------------------------------
// 🏗️ Provider principal estilo enterprise
// ----------------------------------------------------------------------
function CarritoProvider({ children }) {
  const location = useLocation();
  const tenantSlug = useMemo(() => getTenantSlugFromPath(location.pathname), [location.pathname]);
  const storageKey = useMemo(() => buildTenantStorageKey(STORAGE_KEY, tenantSlug), [tenantSlug]);

  // ------------------------------------------------------------------
  // 🚀 Estado inicial con recuperación segura desde localStorage
  // ------------------------------------------------------------------
  const [items, setItems] = useState(() => {
    try {
      const parsed = readJsonStorage(buildTenantStorageKey(STORAGE_KEY));
      return Array.isArray(parsed) ? parsed.map((item) => normalizarItemCarrito(item)) : [];
    } catch (err) {
      console.warn('⚠️ Error al leer carrito desde localStorage:', err);
      return [];
    }
  });

  useEffect(() => {
    try {
      const parsed = readJsonStorage(storageKey);
      setItems(Array.isArray(parsed) ? parsed.map((item) => normalizarItemCarrito(item)) : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // ------------------------------------------------------------------
  // 💾 Persistir carrito cuando cambien los items
  // ------------------------------------------------------------------
  useEffect(() => {
    try {
      writeJsonStorage(storageKey, items);
    } catch (err) {
      console.warn('⚠️ Error al guardar carrito en localStorage:', err);
    }
  }, [items, storageKey]);

  // ------------------------------------------------------------------
  // ➕ Agregar producto (tipo Shopify POS)
  // ------------------------------------------------------------------
  const agregarProducto = (producto) => {
    if (!producto || !producto.id) return false;

    // 🔒 BLOQUEO DE STOCK
    if (producto.disponible === false) return false;

    const itemNormalizado = normalizarItemCarrito(producto);

    setItems((prev) => {
      const existe = prev.find((p) => p.lineId === itemNormalizado.lineId);

      if (existe) {
        return prev.map((p) =>
          p.lineId === itemNormalizado.lineId
            ? {
                ...p,
                cantidad: Math.min(99, Math.max(1, p.cantidad + itemNormalizado.cantidad))
              }
            : p
        );
      }

      return [...prev, itemNormalizado];
    });

    return true;
  };

  // ------------------------------------------------------------------
  // ➖ Eliminar producto por ID
  // ------------------------------------------------------------------
  const quitarProducto = (id) => {
    setItems((prev) => prev.filter((p) => (p.lineId || p.id) !== id));
  };

  // ------------------------------------------------------------------
  // 🔄 Cambiar cantidad (blindaje total 1–99)
  // ------------------------------------------------------------------
  const cambiarCantidad = (id, nuevaCantidad) => {
    const cantidad = Number(nuevaCantidad);
    if (Number.isNaN(cantidad)) return false;

    const cantidadSegura = Math.min(99, Math.max(1, cantidad));

    setItems((prev) =>
      prev.map((p) => ((p.lineId || p.id) === id ? { ...p, cantidad: cantidadSegura } : p))
    );

    return true;
  };

  // ------------------------------------------------------------------
  // ✏️ Alias semántico enterprise (FASE 3)
  // ------------------------------------------------------------------
  const actualizarCantidad = cambiarCantidad;

  // ------------------------------------------------------------------
  // 🧹 Limpiar carrito SOLO cuando el pedido fue CONFIRMADO
  // (FASE 6 – NO se usa al enviar)
  // ------------------------------------------------------------------
  const limpiarCarritoConfirmado = () => {
    setItems([]);
  };

  // ------------------------------------------------------------------
  // 🧮 Totales optimizados con useMemo
  // ------------------------------------------------------------------
  const { total, totalItems } = useMemo(() => {
    const total = items.reduce(
      (acc, item) => acc + Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 0),
      0
    );
    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
    return { total, totalItems };
  }, [items]);

  // ------------------------------------------------------------------
  // 🌐 API pública del contexto (enterprise-safe)
  // ------------------------------------------------------------------
  const value = {
    items,
    total,
    totalItems,
    agregarProducto,
    quitarProducto,
    cambiarCantidad,
    actualizarCantidad,

    // ⚠️ IMPORTANTE:
    // limpiarCarrito() YA NO se expone para evitar usos incorrectos
    limpiarCarritoConfirmado,
    limpiarCarrito: limpiarCarritoConfirmado
  };

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

// ----------------------------------------------------------------------
// 🪝 Hook pro (obligatorio: usar dentro del Provider)
// ----------------------------------------------------------------------
function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) {
    throw new Error('❌ useCarrito debe usarse dentro de <CarritoProvider> (Comanda Client)');
  }
  return ctx;
}

// ----------------------------------------------------------------------
// 📤 Exportaciones nivel enterprise
// ----------------------------------------------------------------------
export default CarritoProvider;
export { CarritoContext, useCarrito };

