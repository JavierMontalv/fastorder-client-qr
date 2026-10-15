// client-qr/src/main.jsx
// =============================================================================
// Árbol de providers — orden estricto de dependencias:
//   MesaProvider → PedidoProvider → PedidoActivoProvider → CarritoProvider
//
// PedidoActivoProvider vive aquí para que TODOS los componentes compartan
// el mismo socket y el mismo estado del pedido activo sin reconexiones.
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import CarritoProvider from './context/CarritoContext';
import { MesaProvider } from './context/MesaContext';
import PedidoProvider from './context/PedidoContext';
import { PedidoActivoProvider } from './context/PedidoActivoContext';

import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';

import './index.css';
import './styles/Colors.css';
import './styles/Theme.css';
import './styles/PremiumHD.css';
import './styles/RappiMenu.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MesaProvider>
        <PedidoProvider>
          <PedidoActivoProvider>
            <CarritoProvider>
              <App />
            </CarritoProvider>
          </PedidoActivoProvider>
        </PedidoProvider>
      </MesaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
