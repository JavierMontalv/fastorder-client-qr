// ======================================================================
// client-qr/src/components/pedido/EstadoPedido.jsx
// ======================================================================

import { LABELS_ESTADOS_PAGO, LABELS_ESTADOS_PEDIDO } from '../../constants/estadosPedido';
import useEstadoPedido from '../../hooks/useEstadoPedido';

export default function EstadoPedido({ pedidoId }) {
  const pedido = useEstadoPedido(pedidoId);
  if (!pedido) return null;

  return (
    <div className="fo-estado-pedido">
      <strong>{LABELS_ESTADOS_PEDIDO[pedido.estado] ?? pedido.estado}</strong>

      <div>Pago: {LABELS_ESTADOS_PAGO[pedido.estadoPago] ?? pedido.estadoPago}</div>
    </div>
  );
}
