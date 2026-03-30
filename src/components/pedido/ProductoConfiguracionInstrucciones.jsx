// client-qr/src/components/pedido/ProductoConfiguracionInstrucciones.jsx
// ======================================================================
// ✍️ ProductoConfiguracionInstrucciones.jsx — FASTORDER Client QR
// ----------------------------------------------------------------------
// • UI pura de instrucciones
// • Controlado desde el Sheet
// ======================================================================

export default function ProductoConfiguracionInstrucciones({
  value,
  onChange
}) {
  return (
    <div className="bloque-config">
      <h3>Instrucciones especiales</h3>
      <textarea
        placeholder="Ej: sin cebolla, poco picante…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </div>
  );
}
