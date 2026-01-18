// client-web/src/components/PromocionModal.jsx
// ======================================================================
// 🎉 Componente: PromocionModal – FASTORDER (Client Web QR 2026)
// ----------------------------------------------------------------------
// • Muestra promociones tipo "modal" al escanear el QR
// • Registra impresiones automáticamente
// • Registra clics cuando el usuario interactúa
// • Estilo moderno, elegante y 100% responsive
// ======================================================================

import { useEffect } from 'react';
import '../styles/PromocionModal.css';

export default function PromocionModal({
  promo,
  visible,
  onClose,
  registrarImpresion,
  registrarClick
}) {
  // Registrar impresión al abrir el modal
  useEffect(() => {
    if (visible && promo?.id) {
      registrarImpresion(promo.id);
    }
  }, [visible, promo, registrarImpresion]);

  if (!visible || !promo) return null;

  const handleClick = () => {
    registrarClick(promo.id);

    if (promo.urlDestino) {
      window.open(promo.urlDestino, '_blank');
    }
  };

  return (
    <div className="promo-modal-overlay">
      <div
        className="promo-modal-container"
        style={{
          borderColor: promo.colorPrincipal || '#ff7b00'
        }}
      >
        {/* Botón cerrar */}
        <button className="promo-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Imagen principal */}
        {promo.imagenUrl && (
          <img
            src={promo.imagenUrl}
            alt="Promoción"
            className="promo-modal-image"
            onClick={handleClick}
          />
        )}

        <div className="promo-modal-content">
          <h2 className="promo-title">{promo.titulo}</h2>

          {promo.descripcion && <p className="promo-description">{promo.descripcion}</p>}

          {/* Botón CTA */}
          {promo.botonTexto && (
            <button
              className="promo-modal-button"
              style={{ backgroundColor: promo.colorPrincipal || '#ff7b00' }}
              onClick={handleClick}
            >
              {promo.botonTexto}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
