// client-qr/src/hooks/useAITranslate.js
// ============================================================================
// 🤖 Hook: useAITranslate – FASTORDER QR (2026)
// ----------------------------------------------------------------------------
// Funciones enterprise:
//  • Traducción inteligente mediante backend IA (OpenAI)
//  • Cache de traducción por sesión (reduce costos ✓)
//  • Reactivo al idioma (i18n actual)
//  • Modo "menu", "producto", "promo" o "ui"
//  • Fallback seguro sin romper UI
// ============================================================================

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CACHE_KEY = 'fo_translate_cache_v1';

// ---------------------------------------------------------------
// 🗄️ Cargar cache existente
// ---------------------------------------------------------------
function loadCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------
// 💾 Guardar cache
// ---------------------------------------------------------------
function saveCache(cache) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ============================================================================
// 🎯 Hook principal
// ============================================================================
export function useAITranslate() {
  const { i18n } = useTranslation();
  const idiomaDestino = i18n.language || 'es';

  const [cache, setCache] = useState(loadCache());
  const [cargando, setCargando] = useState(false);

  // -------------------------------------------------------------------------
  // 🔧 Método principal: traducir texto
  // -------------------------------------------------------------------------
  const traducir = useCallback(
    async (texto, opciones = {}) => {
      if (!texto || idiomaDestino === 'es') return texto;

      const key = `${idiomaDestino}::${texto}`;

      // 1️⃣ Cache
      if (cache[key]) return cache[key];

      setCargando(true);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/traduccion/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texto,
            idiomaDestino,
            modo: opciones.modo || 'natural' // natural | literal
          })
        });

        const data = await res.json();

        if (!data?.success || !data?.traduccion) {
          return texto; // fallback
        }

        const traducido = data.traduccion;

        // 2️⃣ Guardar en cache
        const newCache = { ...cache, [key]: traducido };
        setCache(newCache);
        saveCache(newCache);

        return traducido;
      } catch (err) {
        console.error('❌ Error en useAITranslate:', err);
        return texto; // Fallback seguro
      } finally {
        setCargando(false);
      }
    },
    [idiomaDestino, cache]
  );

  // -------------------------------------------------------------------------
  // 🧠 Traducción masiva (lista de objetos)
  // -------------------------------------------------------------------------
  const traducirLista = useCallback(
    async (lista, campos = ['nombre', 'descripcion']) => {
      if (!Array.isArray(lista)) return lista;

      const nuevaLista = [];

      for (const item of lista) {
        const nuevoItem = { ...item };

        for (const campo of campos) {
          if (item[campo]) {
            nuevoItem[campo] = await traducir(item[campo], {
              modo: 'natural'
            });
          }
        }

        nuevaLista.push(nuevoItem);
      }

      return nuevaLista;
    },
    [traducir]
  );

  // -------------------------------------------------------------------------
  // 🎨 Traducir UI fija (usando i18n directo)
  // -------------------------------------------------------------------------
  const t = (key) => i18n.t(key);

  return {
    traducir,
    traducirLista,
    idiomaDestino,
    cargando,
    t
  };
}

export default useAITranslate;
