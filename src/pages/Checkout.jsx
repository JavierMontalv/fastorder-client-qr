// client-qr/src/pages/Checkout.jsx
// ======================================================================
// 💳 Página Checkout – COMANDA Client-Web QR (2026)
// ----------------------------------------------------------------------
// • Contabilidad SOLO visual (UI)
// • Backend es la única fuente contable
// • Payload mínimo y seguro
// • NO pago en caja (solo crea pedido)
// ======================================================================

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { crearPedido } from '../services/pedidosService';
import { obtenerConfigRestaurante } from '../services/restauranteService';

import { useCarrito } from '../context/CarritoContext';
import { usePedido } from '../context/PedidoContext';

import '../styles/Checkout.css';

const IVA_RATE = 0.19;

function normalizarModificacionesParaPedido(modificaciones = []) {
  return (Array.isArray(modificaciones) ? modificaciones : [])
    .map((grupo) => {
      const grupoId = Number(grupo?.grupoId || grupo?.grupoModificadorId || grupo?.id || 0);
      const opciones = Array.isArray(grupo?.opciones)
        ? grupo.opciones
            .map((opcion) => {
              const opcionId = Number(opcion?.opcionId || opcion?.id || opcion || 0);
              return opcionId ? { opcionId } : null;
            })
            .filter(Boolean)
        : [];

      if (!grupoId || opciones.length === 0) return null;
      return { grupoId, opciones };
    })
    .filter(Boolean);
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();

  const { carrito = [], mesa = null, tipoPedido: tipoDesdeQR = 'mesa' } = location.state || {};

  const { setPedidoId } = usePedido();
  const { limpiarCarrito } = useCarrito();

  const [tipoPedido, setTipoPedido] = useState(tipoDesdeQR);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [propina, setPropina] = useState(0);
  const [permitirLlevar, setPermitirLlevar] = useState(false);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  // ======================================================
  // 🧮 CONTABILIDAD (SOLO UI – NO FUENTE DE VERDAD)
  // ======================================================
  const subtotal = useMemo(() => {
    return carrito.reduce(
      (sum, item) => sum + Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 0),
      0
    );
  }, [carrito]);

  const iva = useMemo(() => {
    return Math.round(subtotal * IVA_RATE);
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + iva + propina;
  }, [subtotal, iva, propina]);

  // ======================================================
  // 🔧 Configuración restaurante
  // ======================================================
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const config = await obtenerConfigRestaurante();
        const permitido = config?.permitirPedidosParaLlevar === true;

        setPermitirLlevar(permitido);

        if (!permitido && tipoPedido === 'llevar') {
          setTipoPedido('mesa');
        }
      } catch {
        // silencioso
      } finally {
        setCargandoConfig(false);
      }
    };

    cargarConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================================================
  // 🧾 Enviar pedido (BACKEND CALCULA TODO)
  // ======================================================
  const manejarCheckout = async () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        mesaId: tipoPedido === 'mesa' ? mesa?.id : null,
        tipoPedido,
        origenPedido: 'qr',
        nota,

        // ✅ PROPINA EXPLÍCITA (BACKEND FUENTE DE VERDAD)
        propina,

        items: carrito.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          modificaciones: normalizarModificacionesParaPedido(item.modificaciones),
          instrucciones: String(item.instrucciones || '').trim()
        }))
      };

      const res = await crearPedido(payload);

      if (!res?.success || !res?.data?.id) {
        alert(res?.message || 'Error creando el pedido');
        return;
      }

      setPedidoId(res.data.id);
      limpiarCarrito();

      navigate(slug ? `/${slug}/pedido-exitoso` : '/pedido-exitoso', {
        state: { total: res.data.total || total, tipoPedido }
      });
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      alert('No se pudo procesar el pedido.');
    } finally {
      setEnviando(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================
  if (cargandoConfig) {
    return (
      <div className="checkout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Header */}
      <div className="checkout-header">
        <button className="checkout-back" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>
        <h1 className="checkout-title">Confirmar pedido</h1>
      </div>

      {/* Tipo de pedido */}
      {permitirLlevar && (
        <div className="checkout-tipo-container">
          <button
            className={`checkout-tipo-btn ${tipoPedido === 'mesa' ? 'active' : ''}`}
            onClick={() => setTipoPedido('mesa')}
          >
            🪑 En mesa
          </button>
          <button
            className={`checkout-tipo-btn ${tipoPedido === 'llevar' ? 'active' : ''}`}
            onClick={() => setTipoPedido('llevar')}
          >
            🥡 Para llevar
          </button>
        </div>
      )}

      {/* Orden */}
      <div className="checkout-card">
        <p className="checkout-card-title">Tu orden</p>

        {carrito.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No hay productos en el carrito.
          </p>
        ) : (
          <div className="checkout-items-list">
            {carrito.map((item) => (
              <div key={item.id} className="checkout-item">
                <span className="checkout-item-name">
                  {item.cantidad}× {item.nombre}
                </span>
                <span className="checkout-item-price">
                  ${(Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 0)).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="checkout-totals">
          <div className="checkout-line">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="checkout-line">
            <span>IVA (19%)</span>
            <span>${iva.toLocaleString('es-CO')}</span>
          </div>
          <div className="checkout-line">
            <span>Propina</span>
            <input
              type="number"
              min={0}
              value={propina}
              onChange={(e) => setPropina(Number(e.target.value) || 0)}
            />
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <span>${total.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* Nota */}
      <div style={{ marginBottom: 16 }}>
        <label className="checkout-nota-label">Nota para el restaurante (opcional)</label>
        <textarea
          className="checkout-nota"
          rows={3}
          maxLength={300}
          placeholder="Ej: sin cebolla, alérgico a los mariscos…"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>

      {/* Botón fijo inferior */}
      <div className="checkout-sticky-footer">
        <button
          className="checkout-button"
          disabled={enviando || carrito.length === 0}
          onClick={manejarCheckout}
        >
          {enviando ? 'Procesando…' : `Confirmar pedido · $${total.toLocaleString('es-CO')}`}
        </button>
      </div>
    </div>
  );
}

