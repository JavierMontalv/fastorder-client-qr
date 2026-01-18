// ======================================================================
// client-qr/src/hooks/useEstadoPedido.js
// ======================================================================

import { useEffect, useState } from 'react';
import { obtenerEstadoPedido } from '../services/pedidosService';
import { actualizarEstadoPedido } from '../utils/bloqueoPedido';

export default function useEstadoPedido(pedidoId) {
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    if (!pedidoId) return;

    let activo = true;

    // --------------------------------------------------------------
    // 📡 Fetch inicial (estado actual del pedido)
    // --------------------------------------------------------------
    obtenerEstadoPedido(pedidoId).then((data) => {
      if (!activo || !data) return;
      setEstado(data);
      actualizarEstadoPedido(data.estado);
    });

    // --------------------------------------------------------------
    // 🧹 Cleanup limpio
    // --------------------------------------------------------------
    return () => {
      activo = false;
    };
  }, [pedidoId]);

  return estado;
}
