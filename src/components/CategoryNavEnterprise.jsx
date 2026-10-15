import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

function getFallbackIcon(nombre = '') {
  const key = nombre.toLowerCase();

  if (key.includes('bebida')) return 'B';
  if (key.includes('postre')) return 'P';
  if (key.includes('combo')) return 'C';
  if (key.includes('acompa')) return 'A';
  if (key.includes('promo') || key.includes('oferta')) return '%';
  return 'M';
}

export default function CategoryNavEnterprise({ categorias = [], categoriaActiva, onChange }) {
  const itemRefs = useRef({});

  useEffect(() => {
    const activeItem = itemRefs.current[categoriaActiva];
    if (!activeItem) return;

    activeItem.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }, [categoriaActiva]);

  if (!categorias.length) return null;

  return (
    <nav className="category-nav-enterprise" aria-label="Categorias del menu">
      <div className="category-nav-inner">
        <span className="category-nav-menu-label">
          Menu
          <ChevronDown aria-hidden="true" />
        </span>
        {categorias.map((categoria) => {
          const activa = String(categoria.id) === String(categoriaActiva);
          const totalProductos = Array.isArray(categoria.productos) ? categoria.productos.length : 0;

          return (
            <button
              key={categoria.id}
              ref={(node) => {
                itemRefs.current[categoria.id] = node;
              }}
              type="button"
              className={`category-nav-item ${activa ? 'active' : ''}`}
              aria-current={activa ? 'true' : undefined}
              onClick={() => onChange(categoria.id)}
            >
              <span className="category-nav-item-icon">{categoria.icono || getFallbackIcon(categoria.nombre)}</span>
              <span className="category-nav-item-copy">
                <span className="category-nav-item-name">{categoria.nombre}</span>
                <span className="category-nav-item-meta">{totalProductos} items</span>
              </span>
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
      nombre: PropTypes.string.isRequired,
      icono: PropTypes.string,
      productos: PropTypes.array
    })
  ),
  categoriaActiva: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired
};
