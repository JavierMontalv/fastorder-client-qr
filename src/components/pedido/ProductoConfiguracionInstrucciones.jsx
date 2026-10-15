export default function ProductoConfiguracionInstrucciones({ value, onChange }) {
  return (
    <div className="bloque-config premium premium-instructions-card">
      <div className="bloque-config-head premium">
        <div>
          <span className="bloque-config-kicker">Detalles finales</span>
          <h3>Instrucciones especiales</h3>
          <p className="bloque-config-meta">Cuéntale a cocina algo puntual. Solo si realmente aplica.</p>
        </div>
      </div>

      <textarea
        placeholder="Ej: sin cebolla, salsa aparte, término medio..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
      />
    </div>
  );
}
