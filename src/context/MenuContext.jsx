// client-qr/src/context/MenuContext.js
// ======================================================================
// 🍽️ Contexto Menú Público — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// • Fuente de verdad del menú
// • Evita re-fetch innecesario
// • Estado mínimo y trazable
// ======================================================================

'use strict';

import { createContext, useContext, useState } from 'react';

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const value = {
    restaurante,
    setRestaurante,
    categorias,
    setCategorias,
    categoriaActiva,
    setCategoriaActiva
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu debe usarse dentro de <MenuProvider>');
  }
  return context;
}
