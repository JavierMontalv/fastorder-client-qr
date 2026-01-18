// client-qr/src/hooks/useProductosPublicos.js
// ======================================================================
// 🍽️ Hook: Productos Públicos — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// • Fuente ÚNICA: /api/productos/public
// • Normalización cerrada
// • Sin lógica duplicada
// • Listo para FASE 1.3
// ======================================================================

'use strict';

import { useEffect, useState } from 'react';
import { obtenerProductosPublicos } from '../services/productosPublicService';

export default function useProductosPublicos(restauranteId, categoriaId = null) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restauranteId) return;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await obtenerProductosPublicos(restauranteId, categoriaId);
        setProductos(data);
      } catch (err) {
        setError(err.message || 'Error cargando productos');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [restauranteId, categoriaId]);

  return {
    productos,
    loading,
    error
  };
}
