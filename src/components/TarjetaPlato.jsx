// client-qr/src/components/TarjetaPlato.jsx
// ===================================================================
// 🍽️ TarjetaPlato.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// ✅ CORRECCIÓN QUIRÚRGICA FASE 1.3
// • Bloqueo real de compra por stock
// • Muestra badge “Agotado”
// • Botón deshabilitado si no disponible
// • NO llama onAgregar cuando está agotado
// • Sin romper diseño ni UX existente
// ===================================================================

export default function TarjetaPlato({ plato, onAgregar }) {
  const { nombre, descripcion, precio, imagenUrl, disponible } = plato;

  const agotado = !disponible;

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm transition-all duration-200
        border border-gray-100 overflow-hidden
        ${agotado ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}
      `}
    >
      {/* =============================== */}
      {/* Imagen del plato */}
      {/* =============================== */}
      <div className="relative w-full h-40 md:h-48 overflow-hidden">
        <img
          src={imagenUrl || '/placeholder-food.png'}
          alt={nombre}
          loading="lazy"
          className="
            w-full h-full object-cover transition-transform duration-300
            hover:scale-105
          "
        />

        {/* Badge AGOTADO */}
        {agotado && (
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-600 text-white shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* =============================== */}
      {/* Información del plato */}
      {/* =============================== */}
      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">{nombre}</h3>

        {/* Descripción corta */}
        {descripcion && <p className="text-sm text-gray-500 line-clamp-2">{descripcion}</p>}

        {/* Precio + acción */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${Number(precio).toLocaleString('es-CO')}
          </span>

          {/* Botón agregar */}
          <button
            className={`
              px-4 py-1.5 rounded-full text-sm shadow-sm transition-all
              ${
                agotado
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900 active:scale-95'
              }
            `}
            disabled={agotado}
            onClick={() => {
              if (agotado) return;
              onAgregar(plato);
            }}
          >
            {agotado ? 'No disponible' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
