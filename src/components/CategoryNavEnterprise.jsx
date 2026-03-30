// client-qr/src/components/CategoryNavEnterprise.jsx
// ======================================================================
// 🧭 CategoryNavEnterprise — Navegación de categorías
// Estilo: Editorial · Fuego Burger · Full Width
// ======================================================================

'use strict';

import PropTypes from 'prop-types';

export default function CategoryNavEnterprise({ categorias = [], categoriaActiva, onChange }) {
  if (!categorias.length) return null;

  return (
    <nav className="category-nav-enterprise" aria-label="Categorías del menú">
      <div className="category-nav-inner">
        {categorias.map((categoria) => {
          const activa = categoria.id === categoriaActiva;

          return (
            <button
              key={categoria.id}
              type="button"
              className={`category-nav-item ${activa ? 'active' : ''}`}
              aria-current={activa ? 'true' : undefined}
              onClick={() => onChange(categoria.id)}
            >
              {categoria.nombre}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

CategoryNavEnterprise.propTypes = {
  categorias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      nombre: PropTypes.string.isRequired
    })
  ),
  categoriaActiva: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired
};
