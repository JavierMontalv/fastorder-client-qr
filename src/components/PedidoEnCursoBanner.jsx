// client-qr/src/components/PedidoEnCursoBanner.jsx
// =============================================================================
// Banner de seguimiento del pedido activo — visible en el menú QR.
//
// · Consume PedidoActivoContext (socket ya conectado, estado compartido)
// · Cero latencia: hydratado desde localStorage en el primer render
// · Actualización en tiempo real sin crear conexiones propias
// · Solo visible cuando hay un pedido activo no terminal para este slug
// =============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePedidoActivo } from '../context/PedidoActivoContext';
import { usePedido } from '../context/PedidoContext';
import { obtenerPedidoActivo } from '../utils/bloqueoPedido';
import '../styles/PedidoEnCursoBanner.css';

// ─── Constantes ─────────────────────────────────────────────────────
const ESTADOS_ACTIVOS = new Set(['pendiente', 'aceptado', 'preparacion', 'listo']);

const PASOS = [
  { id: 'recibido',  label: 'Recibido'  },
  { id: 'cocina',    label: 'En cocina' },
  { id: 'listo',     label: 'Listo'     },
  { id: 'entregado', label: 'Entregado' }
];

const ESTADO_CONFIG = {
  pendiente: {
    pasoActivo: 0,
    tone:       'warning',
    badge:      'Recibido',
    titulo:     'Pedido recibido',
    desc:       'Tu orden entró al sistema. El restaurante la está revisando.',
    emoji:      '🧾'
  },
  aceptado: {
    pasoActivo: 1,
    tone:       'info',
    badge:      'En cocina',
    titulo:     'En preparación',
    desc:       'La cocina aceptó tu pedido y ya empezó a prepararlo.',
    emoji:      '🍽️'
  },
  preparacion: {
    pasoActivo: 1,
    tone:       'info',
    badge:      'En cocina',
    titulo:     'Preparando tu pedido',
    desc:       'La cocina está trabajando en tu orden ahora mismo.',
    emoji:      '🍳'
  },
  listo: {
    pasoActivo: 2,
    tone:       'success',
    badge:      '¡Listo!',
    titulo:     '¡Tu pedido está listo!',
    desc:       'El equipo ya te lo llevará a la mesa en un momento.',
    emoji:      '✅'
  }
};

const DEFAULT_CONFIG = ESTADO_CONFIG.pendiente;

// ─── Animaciones ────────────────────────────────────────────────────
const variants = {
  hidden:  { opacity: 0, y: -12, scale: 0.985 },
  visible: { opacity: 1, y: 0,   scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit:    { opacity: 0, y: -8,  scale: 0.975,
    transition: { duration: 0.2 } }
};

// ─── Helpers ────────────────────────────────────────────────────────
const fmt = new Intl.NumberFormat('es-CO', {
  style:                 'currency',
  currency:              'COP',
  minimumFractionDigits: 0
});

function formatTotal(valor) {
  if (!valor) return null;
  try { return fmt.format(valor); }
  catch { return `$ ${valor}`; }
}

// ─── Componente ─────────────────────────────────────────────────────
export default function PedidoEnCursoBanner() {
  const navigate          = useNavigate();
  const { slug }          = useParams();
  const { pedidoId }      = usePedido();
  const { pedido, conectado } = usePedidoActivo();

  // Fallback inmediato de localStorage para el primer render
  const pedidoLocal = useMemo(() => obtenerPedidoActivo(), []);

  const estado       = pedido?.estado ?? pedidoLocal?.estado ?? null;
  const idVisible    = pedidoId ?? pedidoLocal?.pedidoId ?? null;
  const total        = pedido?.total ?? pedidoLocal?.total ?? null;
  const slugLocal    = pedidoLocal?.slug ?? null;

  // Verificar pertenencia al mismo restaurante
  const slugCorrecto = !slugLocal || slugLocal === slug;
  const activo       = Boolean(idVisible) && slugCorrecto && ESTADOS_ACTIVOS.has(estado);

  const cfg          = ESTADO_CONFIG[estado] ?? DEFAULT_CONFIG;
  const totalFmt     = useMemo(() => formatTotal(total), [total]);

  const irAEstado = () => navigate(`/${slug}/estado-pedido`);

  return (
    <AnimatePresence>
      {activo && (
        <motion.div
          key={`pec-${idVisible}`}
          className={`pec-banner pec-banner--${cfg.tone}`}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="button"
          tabIndex={0}
          aria-label={`Pedido #${idVisible} en curso — ${cfg.badge}. Ver estado completo.`}
          onClick={irAEstado}
          onKeyDown={(e) => e.key === 'Enter' && irAEstado()}
        >
          {/* Borde lateral de color */}
          <span className="pec-stripe" aria-hidden="true" />

          {/* ── Fila superior ── */}
          <div className="pec-top">
            <div className="pec-live">
              <span className={`pec-dot ${conectado ? 'pec-dot--live' : 'pec-dot--sync'}`} aria-hidden="true" />
              <span className="pec-live-text">{conectado ? 'En vivo' : 'Sincronizando'}</span>
            </div>
            <span className="pec-num">Pedido #{idVisible}</span>
            <span className="pec-cta" aria-hidden="true">
              Ver estado
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.6"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>

          {/* ── Cuerpo: ícono + texto ── */}
          <div className="pec-body">
            <div className={`pec-icon pec-icon--${cfg.tone}`} aria-hidden="true">
              <span className="pec-emoji">{cfg.emoji}</span>
            </div>
            <div className="pec-copy">
              <div className="pec-copy-top">
                <span className={`pec-badge pec-badge--${cfg.tone}`}>{cfg.badge}</span>
                {totalFmt && <span className="pec-total">{totalFmt}</span>}
              </div>
              <strong className="pec-titulo">{cfg.titulo}</strong>
              <p className="pec-desc">{cfg.desc}</p>
            </div>
          </div>

          {/* ── Progreso ── */}
          <div
            className="pec-track"
            role="progressbar"
            aria-valuenow={cfg.pasoActivo + 1}
            aria-valuemin={1}
            aria-valuemax={PASOS.length}
            aria-label={`Paso ${cfg.pasoActivo + 1} de ${PASOS.length}: ${cfg.badge}`}
          >
            {PASOS.map((paso, i) => {
              const hecho   = i <  cfg.pasoActivo;
              const actual  = i === cfg.pasoActivo;
              const cls = [
                'pec-step',
                hecho  ? 'pec-step--done'    : '',
                actual ? 'pec-step--current' : ''
              ].join(' ').trim();

              return (
                <div key={paso.id} className={cls}>
                  <div className="pec-node">
                    {hecho ? (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3.2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="pec-node-dot" aria-hidden="true" />
                    )}
                  </div>
                  {i < PASOS.length - 1 && (
                    <div className={`pec-line ${hecho ? 'pec-line--done' : ''}`} aria-hidden="true" />
                  )}
                  <span className="pec-step-label">{paso.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
