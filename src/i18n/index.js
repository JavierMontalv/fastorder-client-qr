// ============================================================================
// 🌎 i18n/index.js – FASTORDER Client-QR (2026 Enterprise)
// ---------------------------------------------------------------------------
// Sistema multilenguaje tipo Uber Eats / Airbnb:
//  • Detección automática del idioma del navegador
//  • fallback en ES
//  • Carga modular de traducciones
//  • Preparado para i18n asistido por IA (ChatGPT) en el futuro
// ============================================================================

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ===============================================================
// 📁 Importar catálogos
// ===============================================================
import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";

// ===============================================================
// 🚀 Inicialización
// ===============================================================
i18n
  .use(LanguageDetector) // Detecta idioma de navegador, cookies, localStorage, etc.
  .use(initReactI18next) // Vincula React + i18n
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt }
    },

    fallbackLng: "es", // Siempre español si falla
    supportedLngs: ["es", "en", "pt"],

    interpolation: {
      escapeValue: false // React ya protege contra XSS
    },

    detection: {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"]
    },

    react: {
      useSuspense: false
    }
  });

// ============================================================================
// 🤖 (Opcional) MODO IA — soporte para traducciones generadas por ChatGPT
// ---------------------------------------------------------------------------
// 📌 Esta función convierte strings dinámicas en traducciones generadas por IA.
//    • Útil para menú dinámico cargado desde el backend (nombres de platos)
//    • Se puede activar en restaurantes premium con plan empresarial
//
// Ejemplo de uso:
//    const textoTraducido = await i18nIA("Hamburguesa doble", "en");
//
// NOTA: Esto requiere tu clave de OpenAI en backend o vía servidor proxy.
// ============================================================================
export async function i18nIA(texto, targetLang = "en") {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ia/traducir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, targetLang })
    });

    const data = await res.json();
    return data?.traduccion || texto;
  } catch (err) {
    console.error("❌ Error traduciendo con IA:", err);
    return texto; // fallback seguro
  }
}

export default i18n;
