// client-qr/src/services/traduccionesIA.js
// ======================================================================
// 🌍 Traducciones IA — FASTORDER CLIENT QR 2026
// Traducción automática de menú sin duplicar productos
// Multi-idioma · Escalable · Internacionalización real
// ======================================================================

'use strict';

import api from './api';

// ======================================================================
// 🌍 Traducir menú completo
// POST /api/ia/traducir-menu
// ======================================================================
export const traducirMenu = async ({ menu, idiomaDestino }) => {
  if (!Array.isArray(menu) || menu.length === 0) {
    throw new Error('El menú debe ser un arreglo de productos');
  }

  if (!idiomaDestino) {
    throw new Error('Debe especificar el idioma destino');
  }

  const res = await api.post('/ia/traducir-menu', {
    menu,
    idiomaDestino
  });

  return res.data;
};

// ======================================================================
// 🌐 Idiomas soportados (frontend reference)
// ======================================================================
export const IDIOMAS_SOPORTADOS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'pt', nombre: 'Português' },
  { codigo: 'fr', nombre: 'Français' },
  { codigo: 'de', nombre: 'Deutsch' }
];
