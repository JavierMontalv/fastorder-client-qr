// client-qr/src/components/pedido/SeleccionPago.jsx
// ======================================================================
// 💳 SeleccionPago.jsx – FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Componente UI-only (100 % tonto)
// • SOLO permite elegir método de pago
// • NO valida
// • NO crea pedidos
// • NO conoce pasos ni reglas
// ======================================================================

export default function SeleccionPago({ onAtras, onSeleccionarMetodo }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Selecciona método de pago</h2>

      <div className="space-y-3">
        <button
          className="fo-btn fo-btn-primary w-full"
          onClick={() => onSeleccionarMetodo({ metodoPago: 'caja' })}
        >
          💵 Pagar en caja
        </button>

        <button
          className="fo-btn fo-btn-outline w-full"
          onClick={() => onSeleccionarMetodo({ metodoPago: 'online' })}
        >
          💳 Pagar online
        </button>
      </div>

      <button className="fo-btn fo-btn-outline w-full mt-2" onClick={onAtras}>
        ← Volver
      </button>
    </div>
  );
}
