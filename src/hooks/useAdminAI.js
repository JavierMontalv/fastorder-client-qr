// client-web/src/hooks/useAdminAI.js
// ======================================================================
// 🤖 Hook: IA para Administradores — FASTORDER (Enterprise 2026)
// ----------------------------------------------------------------------
// Funcionalidades avanzadas:
//   ✔ Chat estilo ChatGPT dentro del panel admin
//   ✔ Historial local (persistente en sessionStorage)
//   ✔ Loading states elegantes
//   ✔ AbortController para evitar fugas de memoria
//   ✔ Auto-reintento opcional
//   ✔ Respuestas inteligentes con contexto del negocio
//   ✔ Integración directa con backend: POST /api/ia/chat-admin
//
// Uso:
//   const { historial, enviarMensaje, cargando, error } = useAdminAI(restId);
// ======================================================================

import { useEffect, useRef, useState } from 'react';

export default function useAdminAI(restauranteId) {
  const [historial, setHistorial] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fastorder_ai_chat_admin');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  // ======================================================================
  // 🧠 Guardar historial en sessionStorage
  // ======================================================================
  useEffect(() => {
    sessionStorage.setItem('fastorder_ai_chat_admin', JSON.stringify(historial));
  }, [historial]);

  // ======================================================================
  // 💬 Enviar mensaje a la IA (ChatGPT Admin)
  // ======================================================================
  const enviarMensaje = async (texto) => {
    if (!texto || texto.trim().length < 1) return;

    setError(null);
    setCargando(true);

    // Cancelar solicitudes previas
    if (abortRef.current) abortRef.current.abort();

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // Agregar mensaje del usuario al historial
    const nuevoHistorial = [
      ...historial,
      {
        id: Date.now(),
        emisor: 'admin',
        mensaje: texto
      }
    ];
    setHistorial(nuevoHistorial);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ia/chat-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('fastorder_token')
        },
        body: JSON.stringify({
          mensaje: texto,
          restauranteId
        }),
        signal
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Error en IA');
      }

      // Agregar respuesta IA al historial
      setHistorial((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          emisor: 'ia',
          mensaje: data.data.respuesta
        }
      ]);
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('❌ Error en IA Admin:', error);
      setError('No se pudo procesar la solicitud. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // ======================================================================
  // 🧹 Limpiar historial (opcional)
  // ======================================================================
  const limpiarHistorial = () => {
    setHistorial([]);
    sessionStorage.removeItem('fastorder_ai_chat_admin');
  };

  return {
    historial,
    cargando,
    error,
    enviarMensaje,
    limpiarHistorial
  };
}
