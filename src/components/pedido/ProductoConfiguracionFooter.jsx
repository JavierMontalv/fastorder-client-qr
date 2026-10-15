export default function ProductoConfiguracionFooter({
  onConfirmar,
  disabled = false,
  actionLabel = 'Agregar',
  priceLabel = '',
  cantidad = 1,
  onDecrease,
  onIncrease
}) {
  return (
    <div className="footer-confirmacion">
      <div className="footer-cantidad" aria-label="Cantidad del producto">
        <button type="button" onClick={onDecrease} aria-label="Disminuir cantidad">-</button>
        <strong>{cantidad}</strong>
        <button type="button" onClick={onIncrease} aria-label="Aumentar cantidad">+</button>
      </div>

      <button type="button" className="fo-btn-primario" onClick={onConfirmar} disabled={disabled}>
        <span>{actionLabel}</span>
        {priceLabel ? <strong>{priceLabel}</strong> : null}
      </button>
    </div>
  );
}
