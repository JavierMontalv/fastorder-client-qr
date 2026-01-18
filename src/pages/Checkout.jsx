// client-qr/src/pages/Checkout.jsx
// ======================================================================
// 💳 Página Checkout – FASTORDER Client-Web QR (2026)
// ----------------------------------------------------------------------
// • Contabilidad SOLO visual (UI)
// • Backend es la única fuente contable
// • Payload mínimo y seguro
// • NO pago en caja (solo crea pedido)
// ======================================================================

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { crearPedido } from '../services/pedidosService';
import { obtenerConfigRestaurante } from '../services/restauranteService';

import { useCarrito } from '../context/CarritoContext';
import { usePedido } from '../context/PedidoContext';

import '../styles/Checkout.css';

const IVA_RATE = 0.19;

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

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
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
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
          cantidad: item.cantidad
        }))
      };

      const res = await crearPedido(payload);

      if (!res?.success || !res?.data?.id) {
        alert(res?.message || 'Error creando el pedido');
        return;
      }

      setPedidoId(res.data.id);
      limpiarCarrito();

      navigate('/pedido-exitoso');
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
      <div className="checkout-container">
        <h1 className="checkout-title">Confirmar pedido</h1>
        <div className="checkout-card">
          <p>Cargando configuración del restaurante…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Confirmar pedido</h1>

      <div className="checkout-card">
        <h2>Tu orden</h2>

        {carrito.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          carrito.map((item) => (
            <div key={item.id} className="checkout-item">
              <span>
                {item.cantidad}× {item.nombre}
              </span>
              <span>${(item.precio * item.cantidad).toLocaleString('es-CO')}</span>
            </div>
          ))
        )}

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
          <strong>Total</strong>
          <strong>${total.toLocaleString('es-CO')}</strong>
        </div>
      </div>

      <button
        className="checkout-button"
        disabled={enviando || carrito.length === 0}
        onClick={manejarCheckout}
      >
        {enviando ? 'Procesando…' : 'Confirmar pedido'}
      </button>
    </div>
  );
}
