// ======================================================================
// 🚀 FASTORDER QR CLIENT 2026 – main.jsx (Enterprise Edition)
// ======================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

// Estado global tipo Shopify POS
import CarritoProvider from './context/CarritoContext';
import { MesaProvider } from './context/MesaContext';
import PedidoProvider from './context/PedidoContext';

// =======================================================
// 🔵 IMPORTAR LOS ESTILOS ENTERPRISE (OBLIGATORIO)
// =======================================================
import './index.css';
import './styles/Colors.css';
import './styles/Theme.css';

// =======================================================
// 🚀 Renderizado raíz optimizado
// =======================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MesaProvider>
        <PedidoProvider>
          <CarritoProvider>
            <App />
          </CarritoProvider>
        </PedidoProvider>
      </MesaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
