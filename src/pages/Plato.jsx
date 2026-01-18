// ===================================================================
// 🍽️ client-qr/src/pages/Plato.jsx – FASTORDER (Enterprise 2026)
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

  // ================================================================
  // 🛡️ Fallback Enterprise (NUNCA pedir backend)
  // ================================================================
  if (!producto) {
    navigate(`/${slug}`);
    return null;
  }

  const disponible = producto.estado !== 'inactivo';
  const total = producto.precio * cantidad;

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
      <motion.div
        className="relative w-full h-64 overflow-hidden rounded-b-3xl shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={producto.imagenUrl || '/no-image.png'}
          alt={producto.nombre}
          className="w-full h-full object-cover"
        />

        <button
          onClick={() => navigate(`/${slug}`)}
          className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm"
        >
          ← Atrás
        </button>
      </motion.div>

      {/* ================= INFO ================= */}
      <motion.div
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
      </motion.div>

      {/* ================= CANTIDAD ================= */}
      <motion.div
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
      </motion.div>

      {/* ================= BOTÓN AGREGAR ================= */}
      <motion.button
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
      </motion.button>
    </div>
  );
}
