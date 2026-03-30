// client-qr/src/pages/Menu.jsx
// ======================================================================
// 🍽️ FASTORDER Client QR — MENU
// Enterprise 2026 · Shopify / UberEats Style
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useMesa } from '../context/MesaContext';
import { obtenerMenuPublico } from '../services/menuService';
import { obtenerMesaPublica } from '../services/publicApi';

// ======================================================
// 🧭 CATEGORY NAV ENTERPRISE
// ======================================================
import CategoryNavEnterprise from '../components/CategoryNavEnterprise';
import ProductoCardEnterprise from '../components/ProductoCardEnterprise';
import ProductoConfiguracionSheet from '../components/pedido/ProductoConfiguracionSheet';

import '../styles/CategoryNavEnterprise.css';
import '../styles/Colors.css';
import '../styles/Menu.css';
import '../styles/Theme.css';

// ======================================================
// 🌐 ASSETS BASE URL (ENTERPRISE)
// ======================================================
export default function Menu() {
  const navigate = useNavigate();
  const { slug, numero } = useParams();

  const { setMesaId, setNumeroMesa, setRestauranteId } = useMesa();

  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // ======================================================
  // 🧠 PRODUCTO EN CONFIGURACIÓN (INTEGRACIÓN FINAL)
  // ======================================================
  const [productoEnConfiguracion, setProductoEnConfiguracion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ======================================================
  // 🪑 Validación de mesa
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
  // 🚀 Carga del menú público
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
          categorias?.some((c) => c.id === prev) ? prev : (categorias?.[0]?.id ?? null)
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    cargarMenu();
  }, [slug]);

  const restauranteCerrado = restaurante?.estadoOperacion === 'cerrado';

  const productosVisibles = categoriaActiva
    ? categorias.find((c) => c.id === categoriaActiva)?.productos || []
    : [];

  return (
    <>
      {/* ======================================================
          🧭 CATEGORY NAV — NIVEL LAYOUT (NO CONTENIDO)
      ====================================================== */}
      {!loading && categorias.length > 0 && (
        <CategoryNavEnterprise
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onChange={setCategoriaActiva}
        />
      )}

      <div className="menu-enterprise-wrapper">
        {/* ======================================================
            🧠 HEADER ENTERPRISE
        ====================================================== */}
        <div className="menu-header-enterprise fade-in">
          <div className="menu-header-brand">
            <h1 className="menu-restaurant-name">{restaurante?.nombre || 'Restaurante'}</h1>

            {restaurante?.descripcion && (
              <p className="menu-restaurant-tagline">{restaurante.descripcion}</p>
            )}
          </div>

          {!numero && <span className="badge-mesa-libre">🧾 Pedido sin mesa asignada</span>}
        </div>

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

        {loading && (
          <div className="menu-skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonProducto key={i} />
            ))}
          </div>
        )}

        {error && <p className="menu-error">Error cargando el menú. Intenta nuevamente.</p>}

        {!loading && !error && categorias.length === 0 && (
          <p className="menu-empty">No hay productos disponibles.</p>
        )}

        {!loading && !error && productosVisibles.length > 0 && (
          <div className="menu-productos-grid">
            {productosVisibles.map((p) => (
              <ProductoCardEnterprise
                key={p.id}
                producto={p}
                bloqueado={restauranteCerrado}
                onAdd={() => setProductoEnConfiguracion(p)}
                onOpen={() => setProductoEnConfiguracion(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ======================================================
          🧠 PRODUCTO CONFIGURACIÓN SHEET (INTEGRACIÓN FINAL)
      ====================================================== */}
      {productoEnConfiguracion && (
        <ProductoConfiguracionSheet
          producto={productoEnConfiguracion}
          onClose={() => setProductoEnConfiguracion(null)}
        />
      )}
    </>
  );
}

// ======================================================================
// ⭐ COMPONENTES AUXILIARES
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
