// ======================================================================
// 🍽️ FASTORDER Client QR — MENU
// Enterprise 2026 · Shopify / UberEats Style
// ----------------------------------------------------------------------
// • Lee slug y numero de mesa desde URL (derivado del QR)
// • Valida mesa SOLO como paso previo (NO lógica de negocio)
// • La validación se ejecuta ANTES del menú de forma intencional
// • Guarda trazabilidad mínima en MesaContext
// • Si no hay mesa → flujo sin mesa (delivery / pickup)
// • Mantiene lógica de menú intacta
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCarrito } from '../context/CarritoContext';
import { useMesa } from '../context/MesaContext';
import { obtenerMenuPublico } from '../services/menuService';
import { obtenerMesaPublica } from '../services/publicApi';

import '../styles/Colors.css';
import '../styles/Menu.css';
import '../styles/Theme.css';

export default function Menu() {
  const navigate = useNavigate();
  const { slug, numero } = useParams();

  const { agregarProducto } = useCarrito();
  const { setMesaId, setNumeroMesa, setRestauranteId } = useMesa();

  // ======================================================
  // 🧠 Estado real (alineado al backend)
  // ======================================================
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ======================================================
  // 🪑 Validación de mesa (DERIVADA DEL QR / URL)
  // ------------------------------------------------------
  // • Se ejecuta ANTES de cargar el menú de forma intencional
  // • NO es lógica de negocio
  // • SOLO establece contexto mínimo de trazabilidad
  // • Backend decide si la mesa es válida
  // ======================================================
  useEffect(() => {
    if (!slug || !numero) return;

    const validarMesa = async () => {
      try {
        const { data } = await obtenerMesaPublica(slug, numero);

        setMesaId(data.mesaId);
        setNumeroMesa(data.numero);
        setRestauranteId(data.restauranteId);
      } catch {
        navigate('/', { replace: true });
      }
    };

    validarMesa();
  }, [slug, numero, navigate, setMesaId, setNumeroMesa, setRestauranteId]);

  // ======================================================
  // 🚀 Carga ÚNICA del menú completo (por slug)
  // ======================================================
  useEffect(() => {
    if (!slug) return;

    const cargarMenu = async () => {
      try {
        setLoading(true);
        setError(false);

        const { restaurante, categorias } = await obtenerMenuPublico(slug);

        setRestaurante(restaurante);
        setCategorias(categorias || []);
        setCategoriaActiva((prev) =>
          categorias?.some((c) => c.id === prev) ? prev : categorias?.[0]?.id ?? null
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    cargarMenu();
  }, [slug]);

  // ======================================================
  // 🔒 Estado operación
  // ======================================================
  const restauranteCerrado = restaurante?.estadoOperacion === 'cerrado';

  // ======================================================
  // 🧮 Productos visibles (DERIVADOS)
  // ======================================================
  const productosVisibles = categoriaActiva
    ? categorias.find((c) => c.id === categoriaActiva)?.productos || []
    : [];

  // ======================================================
  // 🖼 Render
  // ======================================================
  return (
    <div className="menu-enterprise-wrapper">
      {/* ================= HEADER ================= */}
      <div className="menu-header-enterprise fade-in">
        <h1 className="fo-title-page">{restaurante?.nombre || 'Restaurante'}</h1>

        {restaurante?.descripcion && <p className="fo-subtitle">{restaurante.descripcion}</p>}

        {!numero && <span className="badge-mesa-libre">🧾 Pedido sin mesa asignada</span>}
      </div>

      {/* ================= ESTADO CERRADO ================= */}
      {restauranteCerrado && (
        <div
          style={{
            margin: '16px',
            padding: '16px',
            borderRadius: '12px',
            background: '#FFF3CD',
            color: '#856404',
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          🚫 Este restaurante se encuentra cerrado en este momento.
          <br />
          Vuelve más tarde para realizar tu pedido.
        </div>
      )}

      {/* ================= TABS CATEGORÍAS ================= */}
      {!loading && categorias.length > 0 && (
        <CategoriaTabsEnterprise
          categorias={categorias}
          activa={categoriaActiva}
          onSelect={setCategoriaActiva}
        />
      )}

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="menu-skeleton-list">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </div>
      )}

      {/* ================= ERROR ================= */}
      {error && <p className="menu-error">Error cargando el menú. Intenta nuevamente.</p>}

      {/* ================= EMPTY ================= */}
      {!loading && !error && productosVisibles.length === 0 && (
        <p className="menu-empty">No hay productos disponibles.</p>
      )}

      {/* ================= PRODUCTOS ================= */}
      {!loading && !error && productosVisibles.length > 0 && (
        <div className="menu-productos-grid">
          {productosVisibles.map((p) => (
            <ProductoCardEnterprise
              key={p.id}
              producto={p}
              bloqueado={restauranteCerrado}
              onAdd={() => agregarProducto(p)}
              onOpen={() =>
                navigate(`/${slug}/plato/${p.id}`, {
                  state: { producto: p, restaurante }
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ======================================================================
// ⭐ CARD PRODUCTO ENTERPRISE
// ======================================================================
function ProductoCardEnterprise({ producto, bloqueado, onAdd, onOpen }) {
  const disponible = producto.estado !== 'inactivo' && !bloqueado;

  return (
    <div
      className={`producto-card-enterprise fo-card fade-in-up ${!disponible ? 'agotado' : ''}`}
      onClick={() => {
        if (!disponible) return;
        onOpen();
      }}
    >
      <div className="producto-img-wrapper">
        <img
          src={producto.imagenUrl || '/no-image.png'}
          alt={producto.nombre}
          className="producto-img"
        />
        {!disponible && <span className="badge-agotado">Agotado</span>}
      </div>

      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>

        <p className="producto-precio">${Number(producto.precio).toLocaleString()}</p>

        <button
          className="fo-btn fo-btn-primary"
          disabled={!disponible}
          onClick={(e) => {
            e.stopPropagation();
            if (!disponible) return;
            onAdd();
          }}
        >
          {bloqueado ? 'Restaurante cerrado' : disponible ? '➕ Agregar' : 'No disponible'}
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// ⭐ TABS — CATEGORÍAS ENTERPRISE
// ======================================================================
function CategoriaTabsEnterprise({ categorias, activa, onSelect }) {
  return (
    <div className="tabs-scroll-enterprise">
      {categorias.map((c) => {
        const isActive = activa === c.id;

        return (
          <button
            key={c.id}
            className={`tab-pill-enterprise ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            {c.nombre}
            {isActive && <div className="tab-indicator" />}
          </button>
        );
      })}
    </div>
  );
}

// ======================================================================
// ⭐ SKELETON PRODUCTO
// ======================================================================
function SkeletonProducto() {
  return (
    <div className="producto-card-enterprise fo-card skeleton">
      <div className="producto-img-wrapper skeleton-box" />
      <div className="producto-info">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
      </div>
    </div>
  );
}
