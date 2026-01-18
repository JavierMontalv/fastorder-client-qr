// client-qr/src/components/pedido/ItemResumenPedido.jsx
// ======================================================================
// 🧾 ItemResumenPedido.jsx — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Micro-componente UX
// • Encapsula un item del pedido
// • Maneja cantidad, eliminar y precio
// • NO lógica de negocio
// • NO estado global
// • Animaciones suaves (dopamina controlada)
// ======================================================================

import { motion } from 'framer-motion';
import { useCarrito } from '../../context/CarritoContext';
import formatearPrecio from '../../utils/formatearPrecio';

export default function ItemResumenPedido({ item }) {
  const { cambiarCantidad, quitarProducto } = useCarrito();

  if (!item) return null;

  const { id, nombre, precio, cantidad } = item;

  // --------------------------------------------------
  // ➕ Incrementar (protección anti doble-click rápido)
  // --------------------------------------------------
  const incrementar = () => {
    cambiarCantidad(id, Math.min(cantidad + 1, 99));
  };

  // --------------------------------------------------
  // ➖ Decrementar
  // --------------------------------------------------
  const decrementar = () => {
    if (cantidad <= 1) return;
    cambiarCantidad(id, cantidad - 1);
  };

  // --------------------------------------------------
  // 🗑️ Eliminar
  // --------------------------------------------------
  const eliminar = () => {
    quitarProducto(id);
  };

  return (
    <motion.div
      className="fo-resumen-item"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ================= INFO ================= */}
      <div className="fo-resumen-item-info">
        <div className="fo-resumen-item-nombre">{nombre}</div>
        <div className="fo-resumen-item-precio">{formatearPrecio(precio * cantidad)}</div>
      </div>

      {/* ================= CONTROLES ================= */}
      <div className="fo-resumen-item-controles">
        <button
          type="button"
          className="fo-btn-cantidad"
          onClick={decrementar}
          disabled={cantidad <= 1}
          aria-label="Disminuir cantidad"
        >
          ➖
        </button>

        <span className="fo-resumen-item-cantidad">{cantidad}</span>

        <button
          type="button"
          className="fo-btn-cantidad"
          onClick={incrementar}
          aria-label="Aumentar cantidad"
        >
          ➕
        </button>

        <button
          type="button"
          className="fo-btn-eliminar"
          onClick={eliminar}
          aria-label="Eliminar producto"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
}
