// client-qr/src/components/pedido/ProductoConfiguracionOpciones.jsx
// ======================================================================
// 🍟 ProductoConfiguracionOpciones.jsx — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// UI PURA · Stateless
// • Renderiza grupos de opciones
// • Maneja selección (single / multiple)
// • NO conoce carrito
// • NO calcula totales globales
// • Emite estado hacia arriba
// ======================================================================

export default function ProductoConfiguracionOpciones({
  grupos = [],
  seleccionadas = {},
  onChange
}) {
  // ---------------------------------------------------------------
  // 🔁 Toggle de opción según tipo de grupo
  // ---------------------------------------------------------------
  const toggleOpcion = (grupo, opcion) => {
    const actuales = seleccionadas[grupo.id] || [];

    let nuevas;

    if (grupo.tipo === 'single') {
      // selección única
      nuevas = [opcion];
    } else {
      // selección múltiple
      const existe = actuales.find((o) => o.id === opcion.id);
      nuevas = existe ? actuales.filter((o) => o.id !== opcion.id) : [...actuales, opcion];
    }

    onChange({
      ...seleccionadas,
      [grupo.id]: nuevas
    });
  };

  // ---------------------------------------------------------------
  // 🧩 RENDER
  // ---------------------------------------------------------------
  return (
    <div className="bloque-config">
      {grupos.map((grupo) => (
        <div key={grupo.id} className="bloque-config">
          <h3>{grupo.nombre}</h3>

          {grupo.opciones.map((opcion) => {
            const activas = seleccionadas[grupo.id] || [];
            const activa = activas.some((o) => o.id === opcion.id);

            return (
              <div
                key={opcion.id}
                className={`opcion ${activa ? 'activa' : ''}`}
                onClick={() => toggleOpcion(grupo, opcion)}
              >
                <span>{opcion.nombre}</span>
                {opcion.precio > 0 && (
                  <span className="precio">+${Number(opcion.precio).toLocaleString()}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
