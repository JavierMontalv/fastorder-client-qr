// ======================================================================
// 🔢 client-qr/src/components/carrito/CarritoBadge.jsx
// ----------------------------------------------------------------------
// FASTORDER Client QR 2026 — UX Dopamina Pura
// ----------------------------------------------------------------------
// Responsabilidad ÚNICA:
// • Mostrar número de ítems
// • Animar cuando cambia
// • Rebotar / celebrar (micro-feedback)
//
// ❌ NO lógica de negocio
// ❌ NO totales
// ❌ NO contexto
// ❌ NO side effects
// ======================================================================

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function CarritoBadge({ value }) {
  // ======================================================
  // 🎯 Control interno de animación (visual only)
  // ======================================================
  const [bounce, setBounce] = useState(false);
  const isFirstRender = useRef(true);

  // ======================================================
  // 🧠 Animar SOLO en cambios reales (no en mount)
  // ======================================================
  useEffect(() => {
    if (value === undefined || value === null) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setBounce(true);
    const t = setTimeout(() => setBounce(false), 260);
    return () => clearTimeout(t);
  }, [value]);

  // ======================================================
  // 🚫 No render si no hay valor
  // ======================================================
  if (!value || value <= 0) return null;

  // ======================================================
  // 🎨 Render UX emocional
  // ======================================================
  return (
    <motion.span
      className="carrito-badge"
      aria-label={`Carrito con ${value} ítems`}
      initial={{ scale: 1, opacity: 1 }}
      animate={{
        scale: bounce ? 1.25 : 1,
        opacity: 1
      }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 14
      }}
    >
      {value}
    </motion.span>
  );
}
