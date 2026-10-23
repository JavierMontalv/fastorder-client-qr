// ===================================================================
// 📌 App.jsx – COMANDA QR Client (2026) – Enterprise Edition
// -------------------------------------------------------------------
// Layout raíz del cliente QR
//
// Arquitectura CORRECTA:
// • App = contenedor visual + animaciones
// • Router vive en router.jsx
// • Providers viven en main.jsx
// • App NO conoce rutas
//
// Patrón aplicado:
// Shopify / UberEats / Stripe-style architecture
// ===================================================================

import Router from './router';

export default function App() {
  return (
    <div className="qr-app-container">
      <Router />
    </div>
  );
}

