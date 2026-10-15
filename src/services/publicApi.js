// ======================================================================
// frontend/client-qr/src/services/publicApi.js
// ======================================================================
// 🌐 API pública QR — COMANDA CLIENT 2026
// ----------------------------------------------------------------------
// • SOLO lectura
// • Sin auth
// • Endpoints públicos estables
// ======================================================================

import api from './api';

// ------------------------------------------------------
// 🏪 Restaurante público por slug
// ------------------------------------------------------
export async function obtenerRestaurantePublico(slug) {
  if (!slug) throw new Error('slug requerido');

  const { data } = await api.get(`/public/restaurantes/${encodeURIComponent(String(slug).trim())}`);
  return data?.data ?? null;
}

// ------------------------------------------------------
// 🪑 Mesa por QR (OPCIÓN A)
// ------------------------------------------------------
export async function obtenerMesaPorQr(qrCodigo) {
  if (!qrCodigo) return null;

  try {
    const { data } = await api.get(`/public/mesas/qr/${encodeURIComponent(String(qrCodigo).trim())}`);
    return data?.data ?? null;
  } catch (error) {
    if (error?.response?.status && error.response.status < 500 && error.response.status !== 404) {
      throw error;
    }

    const { data } = await api.get(`/public/mesa/${encodeURIComponent(String(qrCodigo).trim())}`);
    return data?.data ?? null;
  }
}

// ------------------------------------------------------
// 🪑 Mesa por slug + número (OPCIÓN B)
// ------------------------------------------------------
export async function obtenerMesaPublica(slug, numero) {
  if (!slug || !numero) {
    throw new Error('slug y número de mesa requeridos');
  }

  const slugSeguro = encodeURIComponent(String(slug).trim());
  const numeroSeguro = encodeURIComponent(String(numero).trim());
  const { data } = await api.get(`/public/restaurantes/${slugSeguro}/mesa/${numeroSeguro}`);

  return data?.data ?? null;
}

