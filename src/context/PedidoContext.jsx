// ======================================================================
// frontend/client-qr/src/context/PedidoContext.jsx
// ======================================================================
// 🧾 PedidoContext.jsx – FASTORDER QR Client 2026 (Enterprise)
// ----------------------------------------------------------------------
// Responsabilidad ÚNICA:
// • Persistir pedidoId del cliente QR
// • Recuperar pedido tras refresh / cierre / re-scan
// • NO lógica de negocio
// • NO llamadas a API
// ======================================================================

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'fastorder_pedido_id';

const PedidoContext = createContext(null);

function PedidoProvider({ children }) {
  const [pedidoId, setPedidoIdState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? stored : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (pedidoId) {
        localStorage.setItem(STORAGE_KEY, String(pedidoId));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [pedidoId]);

  const setPedidoId = (id) => {
    if (!id) return;
    setPedidoIdState(String(id));
  };

  const clearPedidoId = () => {
    setPedidoIdState(null);
  };

  return (
    <PedidoContext.Provider
      value={{
        pedidoId,
        setPedidoId,
        clearPedidoId
      }}
    >
      {children}
    </PedidoContext.Provider>
  );
}

function usePedido() {
  const ctx = useContext(PedidoContext);
  if (!ctx) {
    throw new Error('❌ usePedido debe usarse dentro de <PedidoProvider>');
  }
  return ctx;
}

export default PedidoProvider;
export { PedidoContext, usePedido };
