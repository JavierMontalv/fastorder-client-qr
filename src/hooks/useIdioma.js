// ======================================================================
// 🌐 useIdioma.js — FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Hook global para manejo avanzado de idioma:
//  • Obtener idioma actual
//  • Cambiar idioma con persistencia
//  • Integración profunda con i18next
//  • Soporte para IA (traducciones dinámicas)
// ======================================================================

import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';

const STORAGE_KEY = 'fastorder_lang';

export default function useIdioma() {
  const [idioma, setIdioma] = useState(i18n.language || 'es');

  // ================================================================
  // 🔄 Cargar idioma guardado al iniciar
  // ================================================================
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== idioma) {
      setIdioma(saved);
      i18n.changeLanguage(saved);
    }
  }, []);

  // ================================================================
  // 🌐 Escuchar cambios externos de i18n
  // (por si otro componente cambia el idioma)
  // ================================================================
  useEffect(() => {
    const listener = (lng) => setIdioma(lng);

    i18n.on('languageChanged', listener);
    return () => i18n.off('languageChanged', listener);
  }, []);

  // ================================================================
  // 🛠 Cambiar idioma manualmente (con persistencia)
  // ================================================================
  const cambiarIdioma = useCallback((nuevo) => {
    if (!nuevo) return;

    setIdioma(nuevo);
    i18n.changeLanguage(nuevo);
    localStorage.setItem(STORAGE_KEY, nuevo);
  }, []);

  // ================================================================
  // 🚀 Hook listo para IA de traducciones dinámicas
  // ================================================================
  const traducirIA = useCallback(async (texto) => {
    // Este método se implementará más adelante con ChatGPT
    console.warn('🔮 traducirIA() aún no implementado.');
    return texto;
  }, []);

  // ================================================================
  // 📦 Exportado limpio
  // ================================================================
  return {
    idioma,
    cambiarIdioma,
    traducirIA
  };
}
