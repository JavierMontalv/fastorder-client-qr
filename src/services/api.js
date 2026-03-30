// ======================================================================
// 🌐 API Axios – FASTORDER QR Client 2026 (Enterprise Edition)
// ----------------------------------------------------------------------
// • Optimizado para menú QR sin autenticación obligatoria
// • Evita enviar "Bearer null" o "Bearer undefined"
// • Interceptores con logs tipo Shopify/Rappi
// • Manejo de errores QR para UX estable en restaurantes
// • Compatible con peticiones públicas y privadas
// ======================================================================

import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// ----------------------------------------------------------------------
// 🔗 Instancia API principal
// ----------------------------------------------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // QR necesita más tolerancia por redes lentas
  headers: {
    'Content-Type': 'application/json'
  }
});

// ----------------------------------------------------------------------
// 🟦 INTERCEPTOR REQUEST:
// Añade token solo si existe → evita enviar “Bearer null”
// ----------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('fastorder_token');

      if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Marca quién está consumiendo la API (útil en logs backend)
      config.headers['x-fastorder-client'] = 'qr-2026';

      return config;
    } catch (err) {
      console.warn('⚠️ Error leyendo token:', err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------------------
// 🟥 INTERCEPTOR RESPONSE:
// Manejo empresarial de errores para evitar que QR se rompa
// ----------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Caso: servidor caído, internet malo, timeout
    if (!error.response) {
      console.error('❌ API offline o timeout:', error.message);
      return Promise.reject({
        offline: true,
        message: 'Servidor no disponible. Intenta nuevamente.'
      });
    }

    // Log profesional
    console.error('❌ Error API QR:', {
      status: error.response.status,
      url: error.config?.url,
      data: error.response.data
    });

    return Promise.reject(error);
  }
);

export default api;
