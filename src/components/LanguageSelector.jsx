// ======================================================================
// 🌐 LanguageSelector.jsx — FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Selector de idioma premium:
//  • i18next integrado
//  • Banderas animadas
//  • Glass UI estilo Shopify / Stripe
//  • Persistencia automática en localStorage
// ======================================================================

import { useEffect, useState } from 'react';
import i18n from '../i18n';
import '../styles/LanguageSelector.css';

export default function LanguageSelector() {
  const [lang, setLang] = useState(i18n.language || 'es');
  const [open, setOpen] = useState(false);

  // ================================================================
  // 🔄 Persistir idioma en localStorage
  // ================================================================
  useEffect(() => {
    const saved = localStorage.getItem('fastorder_lang');
    if (saved) {
      setLang(saved);
      i18n.changeLanguage(saved);
    }
  }, []);

  const cambiarIdioma = (codigo) => {
    setLang(codigo);
    i18n.changeLanguage(codigo);
    localStorage.setItem('fastorder_lang', codigo);
    setOpen(false);
  };

  // ================================================================
  // 🌎 Bandera por idioma
  // ================================================================
  const flags = {
    es: '🇨🇴',
    en: '🇺🇸',
    pt: '🇧🇷'
  };

  // ================================================================
  // 🎨 Render
  // ================================================================
  return (
    <div className="lang-selector-container">
      {/* Botón principal */}
      <button className="lang-selector-btn" onClick={() => setOpen(!open)}>
        <span className="lang-flag">{flags[lang]}</span>
        <span className="lang-code">{lang.toUpperCase()}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="lang-dropdown">
          {['es', 'en', 'pt'].map((idioma) => (
            <button
              key={idioma}
              className={`lang-item ${lang === idioma ? 'active' : ''}`}
              onClick={() => cambiarIdioma(idioma)}
            >
              <span className="lang-flag">{flags[idioma]}</span>
              <span>{idioma.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
