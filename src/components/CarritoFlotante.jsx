import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

import { buildAssetUrl } from '../config/env';
import { useCarrito } from '../context/CarritoContext';
import '../styles/Menu.css';

function formatearPrecio(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function resolveProductoImg(imagenUrl) {
  if (!imagenUrl) return null;
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl.replace(/^http:\/\//i, 'https://');
  const path = imagenUrl.includes('/') ? imagenUrl : `/uploads/productos/${imagenUrl}`;
  return buildAssetUrl(path);
}

export default function CarritoFlotante({ onClick, hidden = false }) {
  const MotionButton = motion.button;
  const { items, total, totalItems } = useCarrito();
  const visible = useMemo(() => totalItems > 0 && !hidden, [totalItems, hidden]);
  const primerProducto = items[0] || null;
  const imagenProducto = resolveProductoImg(primerProducto?.imagenUrl || primerProducto?.imagen);

  return (
    <AnimatePresence>
      {visible ? (
        <MotionButton
          key="carrito-flotante"
          type="button"
          onClick={onClick}
          className="carrito-flotante"
          aria-label={`Ir a canasta. ${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}, ${formatearPrecio(total)}`}
          initial={{ opacity: 0, y: 96 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 96 }}
          transition={{ type: 'spring', stiffness: 330, damping: 30, mass: 0.8 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="carrito-preview">
            {imagenProducto ? <img src={imagenProducto} alt="" /> : <span aria-hidden="true">CM</span>}
            <strong>{totalItems}</strong>
          </span>

          <span className="carrito-info">
            <span className="carrito-items">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
            <span className="carrito-total">{formatearPrecio(total)}</span>
          </span>

          <span className="carrito-cta" aria-hidden="true">Ir a canasta</span>
        </MotionButton>
      ) : null}
    </AnimatePresence>
  );
}
