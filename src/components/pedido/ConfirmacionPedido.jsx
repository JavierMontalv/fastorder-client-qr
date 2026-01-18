// ======================================================================
// client-qr/src/components/pedido/ConfirmacionPedido.jsx
// ======================================================================
// ⚠️ COMPONENTE OBSOLETO — FASE 6
// ----------------------------------------------------------------------
// • NO guarda pedido activo
// • NO limpia carrito
// • NO maneja efectos
// • NO orquesta flujo
// • Se mantiene solo para evitar rupturas por imports antiguos
// • El flujo real vive en CompletarPedidoSheet
// ======================================================================

import EstadoPedido from './EstadoPedido';

export default function ConfirmacionPedido({ pedido, onCerrar }) {
  if (!pedido?.id) return null;

  return (
    <div className="fo-confirmacion">
      <h2>Pedido enviado</h2>
      <p>Pedido #{pedido.id}</p>

      <EstadoPedido pedidoId={pedido.id} />

      <button type="button" onClick={onCerrar}>
        Volver al menú
      </button>
    </div>
  );
}
