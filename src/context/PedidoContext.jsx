// ======================================================================
// frontend/client-qr/src/context/PedidoContext.jsx
// ======================================================================
// 🧾 PedidoContext.jsx – COMANDA QR Client 2026 (Enterprise)
// ----------------------------------------------------------------------
// Responsabilidad ÚNICA:
// • Persistir pedidoId del cliente QR
// • Recuperar pedido tras refresh / cierre / re-scan
// • NO lógica de negocio
// • NO llamadas a API
// ======================================================================

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { obtenerPedidoActivo } from '../utils/bloqueoPedido';
import {
  buildTenantStorageKey,
  getTenantSlugFromPath,
  readJsonStorage
} from '../utils/tenantStorage';

const STORAGE_KEY = 'comanda_pedido_id';

const PedidoContext = createContext(null);

function PedidoProvider({ children }) {
  const location = useLocation();
  const tenantSlug = useMemo(() => getTenantSlugFromPath(location.pathname), [location.pathname]);
  const storageKey = useMemo(() => buildTenantStorageKey(STORAGE_KEY, tenantSlug), [tenantSlug]);

  const [pedidoId, setPedidoIdState] = useState(() => {
    try {
      const stored = readJsonStorage(buildTenantStorageKey(STORAGE_KEY));
      if (stored) return stored;

      const pedidoActivo = obtenerPedidoActivo();
      return pedidoActivo?.pedidoId ? String(pedidoActivo.pedidoId) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const stored = readJsonStorage(storageKey);
      if (stored) {
        setPedidoIdState(String(stored));
        return;
      }

      const pedidoActivo = obtenerPedidoActivo();
      setPedidoIdState(pedidoActivo?.pedidoId ? String(pedidoActivo.pedidoId) : null);
    } catch {
      setPedidoIdState(null);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      if (pedidoId) {
        localStorage.setItem(storageKey, JSON.stringify(String(pedidoId)));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}
  }, [pedidoId, storageKey]);

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

