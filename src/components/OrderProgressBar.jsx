// ======================================================================
// 🎚 OrderProgressBar.jsx – FASTORDER QR Client 2026 (Enterprise Edition)
// ----------------------------------------------------------------------
// Barra de progreso animada estilo UberEats:
//  ✓ Estados dinámicos
//  ✓ Animaciones framer-motion
//  ✓ Íconos premium
//  ✓ Theme global aplicado
// ======================================================================

import { motion } from 'framer-motion';
import '../styles/EstadoPedidoPro.css';

const ESTADOS = ['recibido', 'preparando', 'listo', 'entregado'];

// Iconos minimalistas estilo Linear / UberEats
const ICONOS = {
  recibido: '📥',
  preparando: '👨‍🍳',
  listo: '✅',
  entregado: '🎉'
};

export default function OrderProgressBar({ estado }) {
  const indice = ESTADOS.indexOf(estado);
  const progreso = (indice / (ESTADOS.length - 1)) * 100;

  return (
    <div className="order-progress-container">
      {/* ===========================
          ICONO PRINCIPAL DEL ESTADO
      ============================ */}
      <div className="order-progress-icon">
        <motion.div
          key={estado}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {ICONOS[estado]}
        </motion.div>
      </div>

      {/* ===========================
          BARRA DE PROGRESO
      ============================ */}
      <div className="order-progress-bar">
        <div className="order-progress-track"></div>

        <motion.div
          className="order-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* ===========================
          ETIQUETAS DEL TIMELINE
      ============================ */}
      <div className="order-progress-labels">
        {ESTADOS.map((e, i) => (
          <div key={e} className={`order-progress-step ${i <= indice ? 'step-active' : ''}`}>
            <div className="step-dot"></div>
            <span className="step-label">{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
