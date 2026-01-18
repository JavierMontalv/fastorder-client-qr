// ======================================================================
// 🛒client-qr/src/pages/Carrito.jsx – FASTORDER ENTERPRISE 2026
// ----------------------------------------------------------------------
// Carrito premium estilo Shopify · UberEats · Rappi
//  • UI basada en Theme.css + Colors.css
//  • Cards Enterprise (fo-card)
//  • Botones globales (fo-btn, fo-btn-primary)
//  • Controles minimalistas premium
//  • Drawer con efecto Glass + sombras suaves
//  • Mantiene TODA tu lógica original intacta
// ======================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import '../styles/Colors.css';
import '../styles/Theme.css';

export default function Carrito({ items, onUpdateQty, onRemoveItem, onCheckout }) {
  const [total, setTotal] = useState(0);

  // ================================================================
  // 💰 Recalcular total
  // ================================================================
  useEffect(() => {
    setTotal(items.reduce((acc, it) => acc + it.precio * it.cantidad, 0));
  }, [items]);

  // ================================================================
  // 🧮 Manejar cantidades
  // ================================================================
  const incrementar = (id) => {
    const item = items.find((it) => it.id === id);
    onUpdateQty(id, item.cantidad + 1);
  };

  const disminuir = (id) => {
    const item = items.find((it) => it.id === id);
    item.cantidad > 1 ? onUpdateQty(id, item.cantidad - 1) : onRemoveItem(id);
  };

  // ================================================================
  // 🎨 Render
  // ================================================================
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-md h-full fo-glass bg-white/90 flex flex-col border-l border-gray-200 shadow-2xl"
      >
        {/* ---------------------------------------------------------
           HEADER
        --------------------------------------------------------- */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tu pedido</h2>

          <button
            className="text-gray-500 hover:text-black text-lg fo-btn-outline px-3 py-1 rounded-md"
            onClick={() => onCheckout('close')}
          >
            ✕
          </button>
        </div>

        {/* ---------------------------------------------------------
           ITEMS
        --------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {items.length === 0 && (
              <p className="text-gray-500 text-center mt-10 animate-pulse">Tu carrito está vacío</p>
            )}

            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fo-card flex gap-3 items-start"
              >
                {/* Imagen */}
                <img
                  src={item.imagenUrl}
                  alt={item.nombre}
                  className="w-20 h-20 object-cover rounded-lg"
                />

                {/* Info */}
                <div className="flex flex-col flex-1">
                  <p className="font-semibold text-gray-900">{item.nombre}</p>
                  <p className="text-gray-600 text-sm">${item.precio}</p>

                  {/* Controles */}
                  <div className="flex items-center mt-3 gap-3">
                    <button
                      onClick={() => disminuir(item.id)}
                      className="w-8 h-8 flex justify-center items-center bg-gray-200 hover:bg-gray-300 rounded-full text-lg font-bold transition"
                    >
                      −
                    </button>

                    <span className="text-sm font-medium">{item.cantidad}</span>

                    <button
                      onClick={() => incrementar(item.id)}
                      className="w-8 h-8 flex justify-center items-center bg-gray-900 text-white hover:bg-black rounded-full text-lg transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Quitar
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ---------------------------------------------------------
           FOOTER — TOTAL
        --------------------------------------------------------- */}
        <div className="px-5 pb-6 border-t border-gray-200 bg-white/90">
          <div className="flex justify-between text-lg font-semibold mb-3 text-gray-900">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button
            onClick={() => onCheckout('pay')}
            disabled={items.length === 0}
            className={`
              fo-btn fo-btn-primary w-full py-3 text-lg rounded-xl
              ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
            `}
          >
            Proceder al pago
          </button>
        </div>
      </motion.div>
    </div>
  );
}
