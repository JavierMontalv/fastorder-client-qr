// ======================================================================
// frontend/client-qr/src/context/RestauranteContext.jsx
// ======================================================================
// 🌐 Contexto restaurante (QR)
// ======================================================================

import { createContext, useContext, useState } from 'react';

const RestauranteContext = createContext(null);

export function RestauranteProvider({ children }) {
  const [restaurante, setRestaurante] = useState(null);

  return (
    <RestauranteContext.Provider value={{ restaurante, setRestaurante }}>
      {children}
    </RestauranteContext.Provider>
  );
}

export function useRestaurante() {
  const ctx = useContext(RestauranteContext);
  if (!ctx) {
    throw new Error('useRestaurante debe usarse dentro de RestauranteProvider');
  }
  return ctx;
}
