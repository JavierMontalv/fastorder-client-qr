// client-qr/src/components/pedido/ProductoConfiguracionAcompanantes.jsx
// ======================================================================
// 🍟 ProductoConfiguracionAcompanantes.jsx — FASTORDER Client QR
// ----------------------------------------------------------------------
// • UI pura para selección de acompañantes
// • SIN lógica de carrito
// • Controlado desde el Sheet
// ======================================================================

export default function ProductoConfiguracionAcompanantes({
  acompanantes = [],
  seleccionados = [],
  onChange
}) {
  if (!acompanantes.length) return null;

  return (
    <div className="bloque-config">
      <h3>Acompañantes</h3>

      {acompanantes.map((a) => {
        const activo = seleccionados.some((x) => x.id === a.id);

        return (
          <button
            key={a.id}
            type="button"
            className={`opcion ${activo ? 'activa' : ''}`}
            onClick={() => {
              onChange(activo ? seleccionados.filter((x) => x.id !== a.id) : [...seleccionados, a]);
            }}
          >
            <span>{a.nombre}</span>
            <span className="precio">${Number(a.precio).toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}
