// client-qr/src/hooks/useCarritoActivo.js
// ===================================================================
// 🛒 useCarritoActivo — FASTORDER Client QR 2026 (PRE FASE 3)
// -------------------------------------------------------------------
// • Hook derivado (SIN lógica de negocio)
// • Centraliza estado "carrito activo"
// • Prepara refactors futuros sin romper componentes
// • Uso recomendado en UI (CarritoFlotante, headers, etc.)
// ===================================================================

import { useCarrito } from '../context/CarritoContext';

export default function useCarritoActivo() {
  const { total, totalItems } = useCarrito();

  return {
    activo: totalItems > 0,
    totalItems,
    total
  };
}
