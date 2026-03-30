// ======================================================================
// 🎯 Hook: useUpsell – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Funcionalidades premium:
//  • Llamar al backend para obtener productos sugeridos
//  • No mostrar upsell más de una vez por plato
//  • Cooldown para evitar spam
//  • Controlar cuándo mostrar la tarjeta de upsell
//  • Preparado para IA en el backend
// ======================================================================

import { useEffect, useRef, useState } from 'react';
import { getUpsell } from '../services/upsellService';

// Tiempo mínimo entre upsell (ms)
const COOLDOWN = 20_000; // 20 segundos → ajustable

// Clave localStorage para no repetir upsell por plato
const KEY_VISTOS = 'fastorder_upsell_vistos';

export default function useUpsell(productoId) {
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarUpsell, setMostrarUpsell] = useState(false);

  const cooldownRef = useRef(0);

  // ======================================================
  // 📌 Cargar upsell desde backend
  // ======================================================
  useEffect(() => {
    const cargarUpsell = async () => {
      if (!productoId) return;

      // 1️⃣ Ver si ya se mostró este upsell
      const vistos = JSON.parse(localStorage.getItem(KEY_VISTOS) || '[]');
      if (vistos.includes(productoId)) {
        return;
      }

      // 2️⃣ Cooldown: evitar saturar
      const ahora = Date.now();
      if (ahora < cooldownRef.current) {
        return;
      }

      // 3️⃣ Llamar servicio
      const data = await getUpsell(productoId);

      if (data.length > 0) {
        setSugerencias(data);
        setMostrarUpsell(true);

        // Registrar como visto
        localStorage.setItem(KEY_VISTOS, JSON.stringify([...vistos, productoId]));

        // Activar cooldown
        cooldownRef.current = Date.now() + COOLDOWN;
      }
    };

    cargarUpsell();
  }, [productoId]);

  // ======================================================
  // 📌 Funciones públicas
  // ======================================================
  const cerrarUpsell = () => setMostrarUpsell(false);

  return {
    sugerencias,
    mostrarUpsell,
    cerrarUpsell
  };
}
