// ======================================================================
// 📦 EstadoPedido.jsx – FASTORDER QR Client 2026 (Base Edition)
// ----------------------------------------------------------------------
// Versión BASE (REST):
// • Fuente única: PedidoContext
// • NO Socket.IO
// • Sobrevive refresh
// • Fallback oficial si PRO no aplica
// • Redirige si no hay pedido
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePedido } from '../context/PedidoContext';
import { obtenerEstadoPedido } from '../services/pedidosService';

import '../styles/EstadoPedido.css';

// Estados estándar FASTORDER
const MAP_ESTADOS = {
  recibido: 'Pedido recibido',
  preparando: 'Preparando tu pedido',
  listo: 'Listo para entregar',
  entregado: 'Entregado 🎉'
};

export default function EstadoPedido() {
  const navigate = useNavigate();
  const { pedidoId, clearPedidoId } = usePedido();

  const [estado, setEstado] = useState(null);
  const [tiempoEstimado, setTiempoEstimado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ======================================================
  // ⛔ Sin pedido → volver al menú
  // ======================================================
  useEffect(() => {
    if (!pedidoId) {
      navigate('/');
    }
  }, [pedidoId, navigate]);

  // ======================================================
  // 📌 Cargar estado del pedido (REST)
  // ======================================================
  useEffect(() => {
    if (!pedidoId) return;

    const cargarEstado = async () => {
      try {
        const res = await obtenerEstadoPedido(pedidoId);

        if (!res || !res.estado) {
          throw new Error('Estado inválido');
        }

        setEstado(res.estado);
        setTiempoEstimado(res.tiempoEstimado || null);
      } catch (err) {
        console.error('❌ Error obteniendo estado del pedido:', err);
        setError('No se pudo cargar el estado del pedido.');
      } finally {
        setCargando(false);
      }
    };

    cargarEstado();
  }, [pedidoId]);

  // ======================================================
  // 🎨 Render
  // ======================================================
  if (cargando) {
    return (
      <div className="estado-container">
        <p className="estado-loading">Cargando estado del pedido…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estado-container">
        <h1 className="estado-title">Estado del pedido</h1>

        <p className="estado-referencia">Pedido #{pedidoId}</p>

        <p className="estado-error">{error}</p>

        <button
          className="btn-volver"
          onClick={() => {
            clearPedidoId();
            navigate('/');
          }}
        >
          Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="estado-container">
      <h1 className="estado-title">Estado del pedido</h1>

      <p className="estado-referencia">Pedido #{pedidoId}</p>

      <div className="estado-card">
        <p className="estado-label">Estado actual</p>
        <p className="estado-valor">{MAP_ESTADOS[estado] || estado}</p>

        {tiempoEstimado && (
          <p className="estado-tiempo">
            ⏱ Tiempo estimado: <strong>{tiempoEstimado} min</strong>
          </p>
        )}
      </div>

      {estado === 'entregado' && (
        <button
          className="btn-finalizar"
          onClick={() => {
            clearPedidoId();
            navigate('/');
          }}
        >
          Volver al menú
        </button>
      )}
    </div>
  );
}
