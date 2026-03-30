// client-qr/src/components/ProductoCardEnterprise.jsx
// ======================================================================
// 🧱 FASTORDER — Producto Card Enterprise
// Mobile + Desktop split (jerarquía visual real)
// 2026 · Clean Architecture · QR Client
// ======================================================================

import { memo } from 'react';
import { buildAssetUrl } from '../config/env';

function ProductoCardEnterprise({ producto, bloqueado, onAdd, onOpen }) {
  const disponible = producto.estado !== 'inactivo' && !bloqueado;

  const handleOpen = () => {
    if (!disponible) return;
    onOpen?.();
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!disponible) return;
    onAdd?.();
  };

  return (
    <div
      className={`producto-card-enterprise fo-card fade-in-up ${
        !disponible ? 'agotado' : ''
      }`}
      onClick={handleOpen}
    >
      {/* ======================================================
          🖼️ Imagen (compartida)
      ====================================================== */}
      <div className="producto-img-wrapper">
        <img
          src={
            producto.imagenUrl
              ? buildAssetUrl(`uploads/productos/${producto.imagenUrl}`)
              : '/no-image.png'
          }
          alt={producto.nombre}
          className="producto-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/no-image.png';
          }}
        />

        {!disponible && <span className="badge-agotado">Agotado</span>}
      </div>

      {/* ======================================================
          📦 Info (estructura adaptable)
      ====================================================== */}
      <div className="producto-info">
        <div className="producto-info-top">
          <h3 className="producto-nombre">{producto.nombre}</h3>

          {producto.descripcion && (
            <p className="producto-descripcion">{producto.descripcion}</p>
          )}
        </div>

        <div className="producto-info-bottom">
          <span className="producto-precio">
            ${Number(producto.precio).toLocaleString()}
          </span>

          <button
            className="fo-btn fo-btn-primary"
            disabled={!disponible}
            onClick={handleAdd}
          >
            {bloqueado
              ? 'Restaurante cerrado'
              : disponible
              ? '➕ Agregar'
              : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductoCardEnterprise);
