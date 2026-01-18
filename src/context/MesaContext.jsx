// ======================================================================
// frontend/client-qr/src/context/MesaContext.jsx
// ======================================================================
// 🪑 Contexto de Mesa (QR) — FASTORDER CLIENT 2026
// ----------------------------------------------------------------------
// • Fuente ÚNICA de trazabilidad de mesa
// • Vive durante toda la sesión
// • NO valida
// • NO llama backend
// • SOLO almacena estado derivado del QR / URL
// ======================================================================

import { createContext, useContext, useState } from 'react';

const MesaContext = createContext(null);

export function MesaProvider({ children }) {
  const [mesaId, setMesaId] = useState(null);
  const [numeroMesa, setNumeroMesa] = useState(null);
  const [restauranteId, setRestauranteId] = useState(null);

  return (
    <MesaContext.Provider
      value={{
        mesaId,
        setMesaId,
        numeroMesa,
        setNumeroMesa,
        restauranteId,
        setRestauranteId
      }}
    >
      {children}
    </MesaContext.Provider>
  );
}

export function useMesa() {
  const ctx = useContext(MesaContext);
  if (!ctx) {
    throw new Error('useMesa debe usarse dentro de MesaProvider');
  }
  return ctx;
}
