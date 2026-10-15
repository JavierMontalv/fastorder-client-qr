// client-qr/src/components/PromocionModal.jsx
// ======================================================================
// 🎬 PromocionModal — COMANDA Splash de entrada (2026)
// ----------------------------------------------------------------------
// • Tres fases visuales en un solo overlay persistente:
//     1. 'cargando'  → pantalla oscura + dots  (desde t=0)
//     2. 'activa'    → imagen de campaña full-screen
//     3. null/false  → overlay desmontado
// • La imagen de campaña ES lo primero que ve el usuario cada refresh
// • Registra impresión automática al mostrar la promo
// • Registra clic al interactuar con botón o imagen
// • Sin sessionStorage → aparece en cada recarga de página
// ======================================================================

import { useEffect, useRef, useState } from 'react';
import { buildAssetUrl } from '../config/env';
import '../styles/PromocionModal.css';

// ── Helper URL ───────────────────────────────────────────────────────────
function resolvePromoImage(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
    return raw.replace(/^http:\/\//i, 'https://');
  }
  return buildAssetUrl(raw);
}

// ======================================================================
// COMPONENT
// ======================================================================
export default function PromocionModal({
  promo,
  visible,
  cargando = false,
  onClose,
  registrarImpresion,
  registrarClick
}) {
  // Controla la animación de entrada del contenido de la promo
  const [promoEntrando, setPromoEntrando] = useState(false);
  // Impresión registrada una sola vez por ciclo de visibilidad
  const impresionRegistrada = useRef(false);

  // Duración fija solicitada para la experiencia tipo splash de entrada.
  const AUTO_CLOSE_MS = 10000;

  // ── Animación de entrada cuando se resuelve la promo ─────────────────
  // Al pasar de cargando=true → cargando=false con promo disponible,
  // se activa la clase CSS que hace fade-in del contenido.
  useEffect(() => {
    if (!cargando && promo && visible) {
      // Micro-delay para que el DOM pinte la versión "inicial" primero
      const id = window.setTimeout(() => setPromoEntrando(true), 60);
      return () => window.clearTimeout(id);
    }
    // Resetear para la siguiente apertura
    setPromoEntrando(false);
    impresionRegistrada.current = false;
  }, [cargando, promo, visible]);

  // ── Registrar impresión (solo una vez por apertura) ───────────────────
  useEffect(() => {
    if (visible && promo?.id && !cargando && !impresionRegistrada.current) {
      impresionRegistrada.current = true;
      registrarImpresion?.(promo.id);
    }
  }, [visible, promo?.id, cargando, registrarImpresion]);

  // ── Auto-cierre (solo cuando promo está activa, no durante carga) ─────
  useEffect(() => {
    if (!visible || !promo?.id || cargando) return undefined;
    const id = window.setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [visible, promo?.id, cargando, onClose, AUTO_CLOSE_MS]);

  // ── No renderizar si el overlay no está activo ────────────────────────
  if (!visible) return null;

  // ── Handler de clic en imagen / botón CTA ────────────────────────────
  const handleClick = () => {
    if (promo?.id) registrarClick?.(promo.id);
    if (promo?.urlDestino) {
      window.open(promo.urlDestino, '_blank', 'noopener,noreferrer');
    }
    onClose?.();
  };

  const promoImage = resolvePromoImage(promo?.imagenUrl);

  // ======================================================================
  // FASE 1: Cargando — overlay oscuro con dots animados
  // Se muestra desde t=0 hasta que el backend responde
  // ======================================================================
  if (cargando) return null;

  // ======================================================================
  // FASE 2: Promo activa — imagen de campaña a pantalla completa
  // ======================================================================
  if (!promo) return null;

  return (
    <div
      className={`promo-overlay promo-overlay--activa${promoEntrando ? ' promo-overlay--entrando' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Promoción: ${promo.titulo || 'Oferta especial'}`}
    >
      <div
        className="promo-sheet"
        style={{ '--promo-accent': promo.colorPrincipal || '#ff7b00' }}
      >
        {/* ── Botón cerrar ── */}
        <button
          className="promo-btn-close"
          onClick={onClose}
          aria-label="Cerrar y ver menú"
        >
          ×
        </button>

        {/* ── Visual principal: imagen full-screen ── */}
        <div className="promo-visual">
          {promoImage ? (
            <button
              type="button"
              className="promo-imagen-btn"
              onClick={handleClick}
              aria-label={promo.titulo || 'Ver oferta'}
            >
              <img
                src={promoImage}
                alt={promo.titulo || 'Promoción'}
                className="promo-imagen"
              />
            </button>
          ) : (
            <div className="promo-fallback" />
          )}

          {/* Gradiente inferior para texto legible */}
          <div className="promo-gradiente" />

          {/* Texto sobre la imagen */}
          <div className="promo-copy">
            {promo.titulo && (
              <h2 className="promo-titulo">{promo.titulo}</h2>
            )}
            {promo.descripcion && (
              <p className="promo-descripcion">{promo.descripcion}</p>
            )}
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="promo-acciones">
          {promo.botonTexto && (
            <button
              className="promo-btn-cta"
              onClick={handleClick}
            >
              {promo.botonTexto}
            </button>
          )}

          <button
            type="button"
            className="promo-btn-menu"
            onClick={onClose}
          >
            Ir al menú →
          </button>
        </div>
      </div>
    </div>
  );
}
