// ======================================================================
// 🎉 PromocionPopup.jsx – FASTORDER Client QR 2026 (Enterprise)
// ----------------------------------------------------------------------
// Componente premium con:
//  • Animación de entrada/salida tipo Shopify + Rappi
//  • Fondo Glass UI y blur dinámico
//  • CTA para ir a la promoción o simplemente cerrar
//  • Compatible con promociones destacadas o múltiples
//  • Diseño mobile-first (iPhone 12+ perfect rendering)
// ======================================================================

import { AnimatePresence, motion } from 'framer-motion';
import '../styles/PromocionPopup.css';

export default function PromocionPopup({ promo, visible, onClose }) {
  if (!promo) return null;

  return (
    <AnimatePresence>
      {visible && (
        <div className="promo-overlay" onClick={onClose}>
          {/* Contenido */}
          <motion.div
            className="promo-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Imagen principal */}
            {promo.imagenUrl && (
              <div className="promo-img-wrapper">
                <img src={promo.imagenUrl} alt={promo.titulo} className="promo-img" />
              </div>
            )}

            {/* Título */}
            <h2 className="promo-title">{promo.titulo}</h2>

            {/* Descripción */}
            {promo.descripcion && <p className="promo-desc">{promo.descripcion}</p>}

            {/* CTA botón */}
            {promo.urlDestino && (
              <button
                className="promo-button"
                onClick={() => {
                  window.location.href = promo.urlDestino;
                }}
              >
                Ver promoción
              </button>
            )}

            {/* Cerrar */}
            <button className="promo-close" onClick={onClose}>
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
