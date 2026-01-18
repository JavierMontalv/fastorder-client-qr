// client-qr/src/components/AITextGenerator.jsx
// ======================================================================
// 🤖 AITextGenerator – FASTORDER QR CLIENT (2026)
// ----------------------------------------------------------------------
// Componente elegante para generar textos con IA:
//   • Popup moderno tipo ChatGPT mini
//   • Ideal para sugerencias, traducción o aclaraciones
//   • Animación glass UI para QR Client
//   • Totalmente touch-friendly y responsive
//
// Uso:
//   <AITextGenerator
//       abierto={mostrar}
//       onCerrar={() => setMostrar(false)}
//       onGenerar={async (texto) => { ... }}
//   />
// ======================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import '../styles/AITextGenerator.css';

export default function AITextGenerator({ abierto = false, onCerrar, onGenerar }) {
  const [texto, setTexto] = useState('');
  const [respuestaIA, setRespuestaIA] = useState('');
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);

  // Enfocar input cuando se abre
  useEffect(() => {
    if (abierto && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 200);
    }
  }, [abierto]);

  // ======================================================================
  // 🎯 Manejar envío a IA
  // ======================================================================
  const manejarEnviar = async () => {
    if (!texto.trim() || cargando) return;

    setCargando(true);
    setRespuestaIA('');

    try {
      const respuesta = await onGenerar(texto);
      setRespuestaIA(respuesta || 'No recibí una respuesta válida.');
    } catch (error) {
      console.error('❌ Error IA QR:', error);
      setRespuestaIA('No se pudo generar respuesta.');
    } finally {
      setCargando(false);
    }
  };

  // ======================================================================
  // 🎨 Render
  // ======================================================================
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="ai-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="ai-modal"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          >
            {/* HEADER */}
            <div className="ai-header">
              <h3 className="ai-title">Asistente Inteligente</h3>
              <button className="ai-close" onClick={onCerrar}>
                ✕
              </button>
            </div>

            {/* INPUT */}
            <textarea
              ref={inputRef}
              className="ai-input"
              placeholder="Escribe lo que deseas generar, traducir o preguntar…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
            />

            {/* BOTÓN */}
            <button
              disabled={cargando || !texto.trim()}
              className={`ai-submit ${cargando ? 'ai-loading' : ''}`}
              onClick={manejarEnviar}
            >
              {cargando ? 'Generando…' : 'Generar con IA'}
            </button>

            {/* RESPUESTA */}
            {respuestaIA && (
              <motion.div
                className="ai-result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {respuestaIA}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
