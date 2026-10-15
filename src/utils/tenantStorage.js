'use strict';

export function normalizeTenantSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
}

export function getTenantSlugFromPath(pathname = '') {
  const [firstSegment = ''] = String(pathname || '')
    .split('/')
    .filter(Boolean);

  return normalizeTenantSlug(firstSegment);
}

export function getCurrentTenantSlug() {
  if (typeof window === 'undefined') return '';
  return getTenantSlugFromPath(window.location.pathname);
}

export function buildTenantStorageKey(baseKey, tenantSlug = getCurrentTenantSlug()) {
  const tenant = normalizeTenantSlug(tenantSlug) || 'global';
  return `${baseKey}:${tenant}`;
}

export function readJsonStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJsonStorage(key, payload) {
  localStorage.setItem(key, JSON.stringify(payload));
}

