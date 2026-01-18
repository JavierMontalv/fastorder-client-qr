// ======================================================================
// 🍟 UpsellCard.jsx – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Componente visual para sugerencias automáticas de venta adicional:
//  • Mostrar producto sugerido ("Agrega papas", "Añadir postre")
//  • Fuerte conversión visual (CTA grande)
//  • Limpio, rápido y mobile-first
//
// Integración recomendada:
//  • Dentro de Checkout
//  • Al agregar un plato al carrito
//  • En pantalla posterior a compra
// ======================================================================

import '../styles/UpsellCard.css';

export default function UpsellCard({ producto, onAdd }) {
  if (!producto) return null; // protección

  return (
    <div className="upsell-card">
      {/* Imagen */}
      <div className="upsell-img-wrapper">
        <img
          src={producto.imagenUrl || '/no-image.png'}
          alt={producto.nombre}
          className="upsell-img"
        />
      </div>

      {/* Info */}
      <div className="upsell-info">
        <h3 className="upsell-titulo">{producto.nombre}</h3>

        <p className="upsell-descripcion">
          {producto.descripcion || 'Perfecto para complementar tu pedido 🤤'}
        </p>

        <div className="upsell-precio">${Number(producto.precio).toLocaleString()}</div>

        {/* Botón CTA */}
        <button className="upsell-btn" onClick={() => onAdd(producto)}>
          Añadir por ${Number(producto.precio).toLocaleString()}
        </button>
      </div>
    </div>
  );
}
