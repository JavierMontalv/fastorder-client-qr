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
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const activeItem = itemRefs.current[categoriaActiva];
    if (!scrollContainer || !activeItem) return;

    // scrollIntoView also scrolls ancestor containers on the vertical axis.
    // On iOS Safari that pulled the whole menu back toward the sticky category
    // navigation whenever IntersectionObserver selected a new category.
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const centeredLeft =
      scrollContainer.scrollLeft +
      itemRect.left -
      containerRect.left -
      (containerRect.width - itemRect.width) / 2;
    const maxLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
    const nextLeft = Math.min(maxLeft, Math.max(0, centeredLeft));

    if (Math.abs(scrollContainer.scrollLeft - nextLeft) < 1) return;

    scrollContainer.scrollTo({
      left: nextLeft,
      behavior: 'smooth'
    });
  }, [categoriaActiva]);

  if (!categorias.length) return null;

  return (
    <nav className="category-nav-enterprise" aria-label="Categorias del menu">
      <div ref={scrollContainerRef} className="category-nav-inner">
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
