// ======================================================================
// 📦 EstadoPedidoPro.jsx – FASTORDER QR Client 2026 (Enterprise Edition)
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OrderProgressBar from '../components/OrderProgressBar';
import { usePedido } from '../context/PedidoContext';
import useEstadoPedido from '../hooks/useEstadoPedido';
import { llamarMesero } from '../services/pedidosService';

import '../styles/EstadoPedidoPro.css';

// Estados estándar FASTORDER
const MAP_ESTADOS = {
  recibido: 'Pedido recibido',
  preparando: 'Preparando tu pedido',
  listo: 'Listo para entregar',
  entregado: 'Entregado 🎉'
};

export default function EstadoPedidoPro() {
  const navigate = useNavigate();
  const { pedidoId, clearPedidoId } = usePedido();

  const estadoPedido = useEstadoPedido(pedidoId);

  const [mensajeMesero, setMensajeMesero] = useState('');

  // ======================================================
  // 🛡 Guard defensivo (flujo cerrado)
  // ======================================================
  useEffect(() => {
    if (!pedidoId) {
      navigate('/');
    }
  }, [pedidoId, navigate]);

  if (!estadoPedido) {
    return (
      <div className="estado-container">
        <p className="estado-loading">Cargando estado…</p>
      </div>
    );
  }

  const { estado, tiempoEstimado } = estadoPedido;

  // ======================================================
  // 🍽 Llamar al mesero
  // ======================================================
  const handleLlamarMesero = async () => {
    try {
      await llamarMesero(pedidoId);
      setMensajeMesero('El mesero fue notificado ✔');
      setTimeout(() => setMensajeMesero(''), 2500);
    } catch (error) {
      console.error('❌ Error llamando al mesero:', error);
      setMensajeMesero('No se pudo notificar al mesero.');
    }
  };

  // ======================================================
  // 🎨 Render
  // ======================================================
  return (
    <div className="estado-container">
      <h1 className="estado-title">Estado del pedido</h1>

      <OrderProgressBar estado={estado} />

      {tiempoEstimado && (
        <p className="estado-tiempo">
          ⏱ Tiempo estimado: <strong>{tiempoEstimado} min</strong>
        </p>
      )}

      <p className="estado-etiqueta">{MAP_ESTADOS[estado]}</p>

      <button className="btn-mesero" onClick={handleLlamarMesero}>
        Llamar al mesero
      </button>

      {mensajeMesero && <p className="estado-mensaje">{mensajeMesero}</p>}

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
