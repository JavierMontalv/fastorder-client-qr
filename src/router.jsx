// ======================================================================
// 🧭 router.jsx – FASTORDER QR Client 2026 (Enterprise)
// ----------------------------------------------------------------------
// Router centralizado del cliente QR
//
// • Fuente ÚNICA del slug
// • QR = público
// • Sin lógica de negocio
// • Sin validaciones
// • Solo captura params (slug / mesa)
// • Producción-ready (SaaS-grade)
//
// 🔧 AJUSTE QUIRÚRGICO (NO URGENTE, PERO CORRECTO):
// • Se ELIMINA MesaProvider local
// • Se asume MesaProvider GLOBAL en main.jsx
// • Se evita duplicación de estado
// • Arquitectura limpia y consistente
// ======================================================================

import { Navigate, Route, Routes } from 'react-router-dom';

// Pages
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import EstadoPedido from './pages/EstadoPedido';
import Menu from './pages/Menu';
import PedidoExitoso from './pages/PedidoExitoso';
import Plato from './pages/Plato';

// Context
import { useCarrito } from './context/CarritoContext';

// ======================================================================
// 🍽 Wrapper requerido para inyectar carrito en Plato
// ======================================================================
function PlatoWrapper() {
  const { agregarProducto } = useCarrito();
  return <Plato onAgregar={agregarProducto} />;
}

// ======================================================================
// 🚀 Router principal
// ======================================================================
export default function Router() {
  return (
    <Routes>
      {/* =====================================================
          🛑 ROOT (SIN QR)
      ====================================================== */}
      <Route
        path="/"
        element={
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h2>📱 Escanea el código QR del restaurante</h2>
            <p>El menú se abre desde un QR válido.</p>
          </div>
        }
      />

      {/* =====================================================
          🪑 OPCIÓN B — CAPTURA DE MESA (SIN LÓGICA)
          /mcdonalds/mesa/12
      ====================================================== */}
      <Route path="/:slug/mesa/:numero" element={<Menu />} />

      {/* =====================================================
          🏠 MENÚ PRINCIPAL
          /mcdonalds
      ====================================================== */}
      <Route path="/:slug" element={<Menu />} />

      {/* =====================================================
          🍽 DETALLE DE PLATO
      ====================================================== */}
      <Route path="/:slug/plato/:id" element={<PlatoWrapper />} />

      {/* =====================================================
          🛒 CARRITO
      ====================================================== */}
      <Route path="/:slug/carrito" element={<Carrito />} />

      {/* =====================================================
          💳 CHECKOUT
      ====================================================== */}
      <Route path="/:slug/checkout" element={<Checkout />} />

      {/* =====================================================
          🎉 PEDIDO EXITOSO
      ====================================================== */}
      <Route path="/:slug/pedido-exitoso" element={<PedidoExitoso />} />

      {/* =====================================================
          📦 ESTADO DEL PEDIDO
      ====================================================== */}
      <Route path="/:slug/estado-pedido" element={<EstadoPedido />} />

      {/* =====================================================
          🧯 FALLBACK CONTROLADO
      ====================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
