import { memo, useMemo, useState } from 'react';
import { buildAssetUrl } from '../config/env';

function resolveProductoImg(imagenUrl) {
  if (!imagenUrl) return null;
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl.replace(/^http:\/\//i, 'https://');
  const path = imagenUrl.includes('/') ? imagenUrl : `/uploads/productos/${imagenUrl}`;
  return buildAssetUrl(path);
}

function getProductoMonogram(nombre = '') {
  const words = String(nombre)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) return 'CM';
  return words.map((word) => word.charAt(0).toUpperCase()).join('');
}

function formatCurrency(value) {
  return `$${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(Number(value || 0))}`;
}

function ProductoCardEnterprise({
  producto,
  senalComercial,
  cantidadEnCarrito = 0,
  bloqueado,
  onAdd,
  onOpen
}) {
  const [imagenError, setImagenError] = useState(false);
  const productoDisponible = producto.disponible !== false && producto.estado !== 'inactivo';
  const disponible = productoDisponible && !bloqueado;
  const hasDescription = Boolean(producto.descripcion?.trim());
  const alergenos = producto?.plato?.alergenos || producto?.alergenos || '';
  const imageSrc = imagenError ? null : resolveProductoImg(producto.imagenUrl);
  const monogram = useMemo(() => getProductoMonogram(producto.nombre), [producto.nombre]);
  const pillTone = senalComercial?.tone || 'featured';
  const pillLabel = !productoDisponible
    ? 'No disponible'
    : senalComercial?.label || (producto.destacado ? 'Top del menu' : null);
  const stockHint =
    producto.stockFuente === 'inventario'
      ? 'Stock conectado en tiempo real'
      : producto.stockFuente === 'producto'
        ? 'Stock controlado por el negocio'
        : 'Disponible para pedir ahora';
  const precioAnterior = Number(
    producto.precioAnterior || producto.precioOriginal || producto.precioRegular || 0
  );
  const precioActual = Number(producto.precio || 0);
  const descuento =
    precioAnterior > precioActual
      ? Math.round(((precioAnterior - precioActual) / precioAnterior) * 100)
      : 0;

  const handleOpen = () => {
    if (!disponible) return;
    onOpen?.();
  };

  const handleAdd = (event) => {
    event.stopPropagation();
    if (!disponible) return;
    onAdd?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className={`producto-card-enterprise fade-in-up ${!productoDisponible ? 'agotado' : ''} ${bloqueado ? 'is-blocked' : ''}`}
      onClick={handleOpen}
      role="button"
      tabIndex={disponible ? 0 : -1}
      onKeyDown={handleKeyDown}
      aria-label={`${producto.nombre} - ${formatCurrency(producto.precio)}`}
    >
      <div className={`producto-card-media ${imageSrc ? '' : 'is-fallback'}`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={producto.nombre}
            className="producto-img"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width="640"
            height="640"
            onError={() => setImagenError(true)}
          />
        ) : (
          <div className="producto-card-media-fallback" aria-hidden="true">
            <span className="producto-card-media-monogram">{monogram}</span>
            <span className="producto-card-media-copy">Sin foto cargada</span>
          </div>
        )}

        <div className="producto-card-gradient" />

        {pillLabel ? (
          <span className={`producto-card-pill ${!productoDisponible ? 'soldout' : `signal ${pillTone}`}`}>
            {pillLabel}
          </span>
        ) : null}

        <button
          type="button"
          className={`producto-card-quick-add ${cantidadEnCarrito > 0 ? 'has-quantity' : ''}`}
          disabled={!disponible}
          onClick={handleAdd}
          aria-label={
            disponible
              ? cantidadEnCarrito > 0
                ? `${cantidadEnCarrito} unidades de ${producto.nombre} en la canasta`
                : `Personalizar ${producto.nombre}`
              : 'Producto no disponible'
          }
        >
          {cantidadEnCarrito > 0 ? cantidadEnCarrito : '+'}
        </button>
      </div>

      <div className="producto-info">
        <div className="producto-info-top">
          <div className="producto-price-row">
            <span className="producto-precio">{formatCurrency(producto.precio)}</span>
            <span className="producto-price-hint">Personalizable</span>
          </div>
          {descuento > 0 ? (
            <div className="producto-discount-row">
              <span className="producto-discount-badge">-{descuento}%</span>
              <span className="producto-old-price">{formatCurrency(precioAnterior)}</span>
            </div>
          ) : null}
          <h3 className="producto-nombre">{producto.nombre}</h3>
          <p className={`producto-descripcion ${!hasDescription ? 'is-muted' : ''}`}>
            {hasDescription
              ? producto.descripcion
              : 'Toca para ver foto completa, extras, instrucciones y llevarlo al pedido.'}
          </p>
          {senalComercial?.hint ? (
            <span className="producto-ai-hint">{senalComercial.hint}</span>
          ) : null}
          {alergenos ? (
            <span className="producto-allergen-hint">Alergenos: {alergenos}</span>
          ) : null}
          <span className="producto-stock-hint">
            {productoDisponible ? stockHint : 'Sin stock disponible ahora'}
          </span>
        </div>

        <div className="producto-info-bottom">
          <span className="producto-cta-copy">
            {productoDisponible ? (bloqueado ? 'Carta disponible' : 'Ver producto') : 'Agotado por ahora'}
          </span>
          <button
            type="button"
            className="producto-card-primary-action"
            disabled={!disponible}
            onClick={handleAdd}
            aria-label={disponible ? `Agregar ${producto.nombre}` : 'No disponible'}
          >
            {bloqueado ? 'No recibe pedidos' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductoCardEnterprise);
