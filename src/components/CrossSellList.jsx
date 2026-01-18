// ======================================================================
// 🔗 CrossSellList.jsx – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Sección "Combínalo con..." tipo UberEats/Rappi.
//
// Funcionalidades Enterprise:
//  • Lista horizontal con productos complementarios
//  • Optimizado para mobile-first
//  • Botón rápido "Agregar"
//  • Animaciones suaves estilo Shopify
//  • Perfecto para IA de sugerencias dinámicas
// ======================================================================

import './CrossSellList.css';

export default function CrossSellList({ sugerencias = [], onAdd }) {
  if (!sugerencias || sugerencias.length === 0) return null;

  return (
    <div className="crosssell-container">
      <h3 className="crosssell-title">Combínalo con</h3>

      <div className="crosssell-scroll">
        {sugerencias.map((p) => (
          <div key={p.id} className="crosssell-item">
            {/* Imagen */}
            <div className="crosssell-img-wrapper">
              <img src={p.imagenUrl || '/no-image.png'} alt={p.nombre} className="crosssell-img" />
            </div>

            {/* Info */}
            <div className="crosssell-info">
              <p className="crosssell-name">{p.nombre}</p>
              <p className="crosssell-price">${Number(p.precio).toLocaleString()}</p>

              <button className="crosssell-add" onClick={() => onAdd(p)}>
                Agregar +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
