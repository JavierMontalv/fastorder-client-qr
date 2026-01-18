// client-qr/src/components/CarritoFlotante.jsx
// ======================================================
// 🛒 Botón flotante de carrito – FASTORDER Client QR 2026
// ------------------------------------------------------
// • Muestra total de ítems + total en dinero
// • Fijo en esquina inferior derecha
// • Animado (aparición + reacción a cambios + salida)
// • Badge animado (dopamina pura)
// • NO cambia lógica de negocio
// • NO cambia API del contexto
// • AJUSTE PRO FINAL: salida animada elegante (AnimatePresence)
// ======================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import '../styles/Menu.css';
import CarritoBadge from './carrito/CarritoBadge';

function formatearPrecio(valor) {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  } catch {
    return `$ ${valor ?? 0}`;
  }
}

export default function CarritoFlotante({ onClick }) {
  const { total, totalItems } = useCarrito();

  // ======================================================
  // 👁️ Visibilidad derivada (NO lógica nueva)
  // ======================================================
  const visible = useMemo(() => totalItems > 0, [totalItems]);

  // ======================================================
  // 💓 Pulso reactivo (UX tipo UberEats)
  // ------------------------------------------------------
  // • Primer item: solo animación de aparición
  // • Ítems siguientes: pulse corto
  // ======================================================
  const prevItems = useRef(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prevItems.current === 0 && totalItems > 0) {
      prevItems.current = totalItems;
      return;
    }

    if (totalItems !== prevItems.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      prevItems.current = totalItems;
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  // ======================================================
  // 🎨 Render animado (entrada + salida)
  // ======================================================
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="carrito-flotante"
          type="button"
          onClick={onClick}
          className="carrito-flotante"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: pulse ? 1.06 : 1
          }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 18
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* ================= ICONO + BADGE ================= */}
          <div className="carrito-icono" style={{ position: 'relative' }}>
            🛒
            <CarritoBadge value={totalItems} />
          </div>

          {/* ================= INFO ================= */}
          <div className="carrito-info">
            <span className="carrito-items">{totalItems} ítem(s)</span>
            <span className="carrito-total">{formatearPrecio(total)}</span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
