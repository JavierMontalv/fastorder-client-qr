// ======================================================================
// 🛍️ FASTORDER CLIENT QR 2026 – CONTEXTO GLOBAL DE CARRITO (ENTERPRISE)
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
import { limpiarPedidoActivo, puedeCrearNuevoPedido } from '../utils/bloqueoPedido';

// ----------------------------------------------------------------------
// 📦 Clave global del almacenamiento
// ----------------------------------------------------------------------
const STORAGE_KEY = 'fastorder_carrito';

// ----------------------------------------------------------------------
// 🧠 Crear contexto
// ----------------------------------------------------------------------
const CarritoContext = createContext(null);

// ----------------------------------------------------------------------
// 🏗️ Provider principal estilo enterprise
// ----------------------------------------------------------------------
function CarritoProvider({ children }) {
  // ------------------------------------------------------------------
  // 🚀 Estado inicial con recuperación segura desde localStorage
  // ------------------------------------------------------------------
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('⚠️ Error al leer carrito desde localStorage:', err);
      return [];
    }
  });

  // ------------------------------------------------------------------
  // 💾 Persistir carrito cuando cambien los items
  // ------------------------------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('⚠️ Error al guardar carrito en localStorage:', err);
    }
  }, [items]);

  // ------------------------------------------------------------------
  // 🛑 Guardia global — evita agregar si hay pedido activo
  // ------------------------------------------------------------------
  const puedeModificarCarrito = () => {
    return puedeCrearNuevoPedido();
  };

  // ------------------------------------------------------------------
  // ➕ Agregar producto (tipo Shopify POS)
  // ------------------------------------------------------------------
  const agregarProducto = (producto) => {
    if (!puedeModificarCarrito()) return;
    if (!producto || !producto.id) return;

    // 🔒 BLOQUEO DE STOCK
    if (producto.disponible === false) return;

    setItems((prev) => {
      const existe = prev.find((p) => p.id === producto.id);

      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: Math.min(99, Math.max(1, p.cantidad + 1))
              }
            : p
        );
      }

      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio) || 0,
          imagen: producto.imagen || null,
          cantidad: 1
        }
      ];
    });
  };

  // ------------------------------------------------------------------
  // ➖ Eliminar producto por ID
  // ------------------------------------------------------------------
  const quitarProducto = (id) => {
    if (!puedeModificarCarrito()) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  // ------------------------------------------------------------------
  // 🔄 Cambiar cantidad (blindaje total 1–99)
  // ------------------------------------------------------------------
  const cambiarCantidad = (id, nuevaCantidad) => {
    if (!puedeModificarCarrito()) return;

    const cantidad = Number(nuevaCantidad);
    if (Number.isNaN(cantidad)) return;

    const cantidadSegura = Math.min(99, Math.max(1, cantidad));

    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: cantidadSegura } : p)));
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
    limpiarPedidoActivo();
  };

  // ------------------------------------------------------------------
  // 🧮 Totales optimizados con useMemo
  // ------------------------------------------------------------------
  const { total, totalItems } = useMemo(() => {
    const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
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
    limpiarCarritoConfirmado
  };

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

// ----------------------------------------------------------------------
// 🪝 Hook pro (obligatorio: usar dentro del Provider)
// ----------------------------------------------------------------------
function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) {
    throw new Error('❌ useCarrito debe usarse dentro de <CarritoProvider> (FastOrder Client)');
  }
  return ctx;
}

// ----------------------------------------------------------------------
// 📤 Exportaciones nivel enterprise
// ----------------------------------------------------------------------
export default CarritoProvider;
export { CarritoContext, useCarrito };
