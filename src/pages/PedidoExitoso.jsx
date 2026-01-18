// ======================================================================
// 🎉 Página de Pedido Exitoso – FASTORDER Client-Web QR (2026)
// ----------------------------------------------------------------------
// ENTERPRISE FIX:
// • PedidoId persistente vía PedidoContext
// • No depende de location.state
// • Soporta refresh sin perder pedido
// • CTA real hacia /estado-pedido
// ======================================================================

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePedido } from '../context/PedidoContext';

import '../styles/PedidoExitoso.css';

export default function PedidoExitoso() {
  const navigate = useNavigate();
  const location = useLocation();

  // ⚠️ location.state SOLO como respaldo visual (no fuente de verdad)
  const { total = 0, tipoPedido = 'mesa' } = location.state || {};

  const { pedidoId } = usePedido();

  const [folio, setFolio] = useState('');

  // ======================================================
  // 🔐 Generar código corto (folio)
  // ======================================================
  useEffect(() => {
    if (pedidoId) {
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      setFolio(`FO-${pedidoId}-${random}`);
    }
  }, [pedidoId]);

  // ======================================================
  // ⛔ Pedido inexistente → volver al menú
  // ======================================================
  if (!pedidoId) {
    return (
      <div className="pedidoex-container">
        <h1>Pedido enviado</h1>
        <p>No se encontró información del pedido.</p>
        <button className="pedidoex-button" onClick={() => navigate('/')}>
          Ir al menú
        </button>
      </div>
    );
  }

  return (
    <div className="pedidoex-container">
      {/* 🎉 Animación de éxito */}
      <div className="pedidoex-check">
        <div className="pedidoex-checkmark">✔</div>
      </div>

      <h1 className="pedidoex-title">¡Pedido confirmado!</h1>
      <p className="pedidoex-subtitle">
        Gracias por tu orden. El restaurante ya está preparando tu pedido.
      </p>

      {/* 🧾 Información del pedido */}
      <div className="pedidoex-card">
        <p className="pedidoex-label">Número de pedido</p>
        <h2 className="pedidoex-id">#{pedidoId}</h2>

        <p className="pedidoex-label">Código de recogida</p>
        <h3 className="pedidoex-folio">{folio}</h3>

        {/* QR opcional */}
        <div className="pedidoex-qr">
          <QRCode value={`pedido:${pedidoId}`} size={140} bgColor="#ffffff" fgColor="#000000" />
        </div>

        {/* Mensaje dinámico según tipo */}
        {tipoPedido === 'llevar' ? (
          <p className="pedidoex-info">
            ✔ Tu pedido es <strong>PARA LLEVAR</strong>.
            <br />
            Preséntate cuando esté listo usando tu código.
          </p>
        ) : (
          <p className="pedidoex-info">
            ✔ Tu pedido será llevado a tu mesa.
            <br />
            Muestra tu código si el personal lo solicita.
          </p>
        )}

        {total > 0 && (
          <p className="pedidoex-total">
            Total pagado / a pagar: <strong>${total.toLocaleString('es-CO')}</strong>
          </p>
        )}
      </div>

      {/* 🎯 CTA ENTERPRISE */}
      <button
        className="pedidoex-button pedidoex-primary"
        onClick={() => navigate('/estado-pedido')}
      >
        Ver estado del pedido
      </button>

      {/* 🔙 Volver al menú */}
      <button className="pedidoex-button pedidoex-secondary" onClick={() => navigate('/')}>
        Volver al menú
      </button>
    </div>
  );
}
