// ======================================================================
// frontend/client-qr/src/services/publicApi.js
// ======================================================================
// 🌐 API pública QR — FASTORDER CLIENT 2026
// ----------------------------------------------------------------------
// • SOLO lectura
// • Sin auth
// • Endpoints públicos estables
// ======================================================================

import api from '../api/axiosConfig';

// ------------------------------------------------------
// 🏪 Restaurante público por slug
// ------------------------------------------------------
export async function obtenerRestaurantePublico(slug) {
  if (!slug) throw new Error('slug requerido');

  const { data } = await api.get(`/public/restaurante/${slug}`);
  return data?.data ?? null;
}

// ------------------------------------------------------
// 🪑 Mesa por QR (OPCIÓN A)
// ------------------------------------------------------
export async function obtenerMesaPorQr(qrCodigo) {
  if (!qrCodigo) return null;

  const { data } = await api.get(`/public/mesas/qr/${qrCodigo}`);
  return data?.data ?? null;
}

// ------------------------------------------------------
// 🪑 Mesa por slug + número (OPCIÓN B)
// ------------------------------------------------------
export async function obtenerMesaPublica(slug, numero) {
  if (!slug || !numero) {
    throw new Error('slug y número de mesa requeridos');
  }

  const { data } = await api.get(`/public/restaurante/${slug}/mesa/${numero}`);

  return data?.data ?? null;
}
