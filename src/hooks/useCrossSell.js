// ======================================================================
// 🎯 useCrossSell.js – Hook Enterprise FASTORDER QR 2026
// ----------------------------------------------------------------------
// Funciones Premium:
//  • Obtiene sugerencias de cross-selling para un producto
//  • Previene solicitudes repetidas (caching interno)
//  • Controla frecuencia de aparición (solo 1 vez por plato)
//  • Maneja errores del backend sin romper UI
//  • Preparado para IA (ranking de relevancia)
//
//  Uso:
//     const { sugerencias, cargando, cargarCrossSell } = useCrossSell();
// ======================================================================

import { useState, useRef } from "react";
import { obtenerCrossSell } from "../services/crossSellService";

export default function useCrossSell() {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cache para evitar solicitudes repetidas
  const cacheRef = useRef({});
  const yaMostradoRef = useRef({}); // evita mostrar cross-sell varias veces por plato

  // ====================================================================
  // 📌 cargarCrossSell(productoId)
  // --------------------------------------------------------------------
  //   Llama al backend, procesa sugerencias y guarda en estado
  // ====================================================================
  const cargarCrossSell = async (productoId, opciones = {}) => {
    if (!productoId) return;

    // Opciones enterprise
    const {
      evitarRepetir = true, // si es true, no volverá a mostrar la misma sugerencia en ese plato
      minPrecio = 0 // si deseas sugerir solo productos de cierto valor mínimo
    } = opciones;

    try {
      setCargando(true);
      setError(null);

      // 1️⃣ Revisar si ya fue mostrado (evita saturación)
      if (evitarRepetir && yaMostradoRef.current[productoId]) {
        return;
      }

      // 2️⃣ Revisar cache interno
      if (cacheRef.current[productoId]) {
        const filtrados = filtrarPorPrecio(cacheRef.current[productoId], minPrecio);
        setSugerencias(filtrados);
        yaMostradoRef.current[productoId] = true;
        return;
      }

      // 3️⃣ Llamada real al backend
      const data = await obtenerCrossSell(productoId);

      // 4️⃣ Guardar en cache
      cacheRef.current[productoId] = data;

      // 5️⃣ Filtrar reglas (ej: IA podría ordenar aquí)
      const filtrados = filtrarPorPrecio(data, minPrecio);

      setSugerencias(filtrados);
      yaMostradoRef.current[productoId] = true;
    } catch (err) {
      console.error("❌ Error en useCrossSell:", err);
      setError(err);
      setSugerencias([]);
    } finally {
      setCargando(false);
    }
  };

  // ====================================================================
  // 🎯 Filtrar por precio mínimo (regla simple, extensible a IA)
  // ====================================================================
  const filtrarPorPrecio = (lista, minPrecio) => {
    if (!Array.isArray(lista)) return [];
    return lista.filter((p) => Number(p.precio) >= minPrecio);
  };

  // ====================================================================
  // 🧠 Reset manual si se desea cargar otra vez
  // ====================================================================
  const resetCrossSell = () => {
    setSugerencias([]);
    setError(null);
    setCargando(false);
  };

  // ====================================================================
  // 📦 Exportación del hook
  // ====================================================================
  return {
    sugerencias,
    cargando,
    error,
    cargarCrossSell,
    resetCrossSell
  };
}
