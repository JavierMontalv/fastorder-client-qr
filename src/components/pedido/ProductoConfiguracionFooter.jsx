// client-qr/src/components/pedido/ProductoConfiguracionFooter.jsx
// ======================================================================
// ✅ ProductoConfiguracionFooter.jsx — FASTORDER Client QR
// ----------------------------------------------------------------------
// • Acciones finales del configurador
// • SIN lógica de negocio
// ======================================================================

export default function ProductoConfiguracionFooter({ onCancelar, onConfirmar, disabled = false }) {
  return (
    <div className="footer-confirmacion">
      <button type="button" className="fo-btn-secundario" onClick={onCancelar}>
        Cancelar
      </button>

      <button type="button" className="fo-btn-primario" onClick={onConfirmar} disabled={disabled}>
        Agregar al pedido
      </button>
    </div>
  );
}
