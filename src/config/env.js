const FALLBACK_API_BASE_URL = '/api';
const FALLBACK_ASSETS_BASE_URL = '';

function normalizeBaseUrl(value, fallback) {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized) return fallback;
  return normalized.replace(/\/+$/, '');
}

function stripApiSuffix(value) {
  return value.replace(/\/api$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL,
  FALLBACK_API_BASE_URL
);

export const ASSETS_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_ASSETS_URL,
  stripApiSuffix(API_BASE_URL) || FALLBACK_ASSETS_BASE_URL
);

export const SOCKET_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_SOCKET_URL,
  stripApiSuffix(API_BASE_URL)
);

export function buildAssetUrl(path = '') {
  const sanitizedPath = `${path}`.replace(/^\/+/, '');
  if (!sanitizedPath) return ASSETS_BASE_URL || '/';
  if (!ASSETS_BASE_URL) return `/${sanitizedPath}`;
  return `${ASSETS_BASE_URL}/${sanitizedPath}`;
}
