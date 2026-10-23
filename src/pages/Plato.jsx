// ===================================================================
// 🍽️ client-qr/src/pages/Plato.jsx – COMANDA (Enterprise 2026)
// -------------------------------------------------------------------
// Vista individual estilo Uber Eats / Rappi Food
// • Memory-first (NO requests)
// • Fuente única: location.state.producto
// • Carrito global por contexto (NO props)
// • Fallback elegante
// • Animaciones intactas
// • Micro-feedback dopamina (local, NO toast, NO modal)
// • USO REAL de MicroInteractions.css (fo-btn-primary)
// • ❌ SIN CarritoBadge (el badge vive SOLO en carrito global)
// ===================================================================

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useCarrito } from '../context/CarritoContext';

export default function Plato() {
  const MotionDiv = motion.div;
  const MotionButton = motion.button;
  const navigate = useNavigate();
  const { slug } = useParams();
  const { state } = useLocation();

  // ================================================================
  // 🧠 Fuente única de verdad (memoria)
  // ================================================================
  const producto = state?.producto;

  // ================================================================
  // 🛒 Carrito GLOBAL (Shopify style)
  // ================================================================
  const { agregarProducto } = useCarrito();

  const [cantidad, setCantidad] = useState(1);

  // ================================================================
  // ✨ Micro-confirmación local (dopamina)
  // ================================================================
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    if (!producto) navigate(`/${slug}`, { replace: true });
  }, [navigate, producto, slug]);

  // ================================================================
  // ⏱️ Reset micro-confirmación
  // ================================================================
  useEffect(() => {
    if (!agregado) return;

    const t = setTimeout(() => {
      setAgregado(false);
    }, 600);

    return () => clearTimeout(t);
  }, [agregado]);

  // ================================================================
  // 🛡️ Fallback Enterprise (NUNCA pedir backend)
  // ================================================================
  if (!producto) return null;

  const disponible = producto.disponible !== false && producto.estado !== 'inactivo';
  const total = producto.precio * cantidad;

  // ================================================================
  // 🎯 Acción principal
  // ================================================================
  const manejarAgregar = () => {
    if (!disponible) return;

    agregarProducto({ ...producto, cantidad });
    setAgregado(true);
  };

  // ================================================================
  // 🎨 Render principal
  // ================================================================
  return (
    <div className="pb-28 max-w-lg mx-auto">
      {/* ================= IMAGEN HERO ================= */}
      <MotionDiv
        className="relative w-full h-64 overflow-hidden rounded-b-3xl shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={producto.imagenUrl || '/no-image.png'}
          alt={producto.nombre}
          className="w-full h-full object-cover"
          decoding="async"
          fetchPriority="high"
        />

        <button
          onClick={() => navigate(`/${slug}`)}
          className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm"
        >
          ← Atrás
        </button>
      </MotionDiv>

      {/* ================= INFO ================= */}
      <MotionDiv
        className="p-5 space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl font-bold">{producto.nombre}</h1>

        <div className="text-xl font-semibold text-black">
          ${producto.precio.toLocaleString()}
        </div>

        {producto.descripcion && (
          <p className="text-gray-600 leading-relaxed">
            {producto.descripcion}
          </p>
        )}
      </MotionDiv>

      {/* ================= CANTIDAD ================= */}
      <MotionDiv
        className="px-5 pb-5 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-medium text-gray-700">Cantidad</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
          >
            −
          </button>

          <span className="text-lg font-medium">{cantidad}</span>

          <button
            onClick={() => setCantidad((c) => c + 1)}
            className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"
          >
            +
          </button>
        </div>
      </MotionDiv>

      {/* ================= BOTÓN AGREGAR ================= */}
      <MotionButton
        disabled={!disponible}
        onClick={manejarAgregar}
        whileTap={{ scale: 0.96 }}
        className="fo-btn-primary fixed bottom-0 left-0 w-full bg-black text-white py-4 text-lg font-semibold shadow-lg rounded-t-2xl disabled:opacity-50"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        {agregado
          ? 'Agregado ✓'
          : disponible
          ? `Agregar • $${total.toLocaleString()}`
          : 'No disponible'}
      </MotionButton>
    </div>
  );
}

