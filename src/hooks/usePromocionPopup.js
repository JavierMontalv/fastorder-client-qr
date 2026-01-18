// ======================================================================
// 🎉 usePromocionPopup – Hook de Promociones FASTORDER (2026)
// ----------------------------------------------------------------------
// Este hook controla la lógica completa del popup de promociones:
//   • Cargar promociones activas del backend
//   • Mostrar solo 1 vez por sesión (sessionStorage)
//   • Registrar impresiones automáticamente
//   • Registrar clics de interacción
//   • Manejar cierres, delays y fallas de API
//
// Se integra con:
//   → PromocionPopup.jsx
//   → promocionesService.js
//   → Menu.jsx
// ======================================================================

import { useEffect, useState } from 'react';
import {
  obtenerPromociones,
  registrarClick,
  registrarImpresion
} from '../services/promocionesService';

const STORAGE_KEY = 'fastorder_promo_mostrada';

// ======================================================================
// 🧠 Hook Principal
// ======================================================================
export default function usePromocionPopup(restauranteId = 1) {
  const [promocion, setPromocion] = useState(null); // promoción actual a mostrar
  const [visible, setVisible] = useState(false); // controla si popup se muestra
  const [cargando, setCargando] = useState(true);

  // ====================================================================
  // 🚀 Inicializar promociones al abrir el menú
  // ====================================================================
  useEffect(() => {
    const init = async () => {
      try {
        setCargando(true);

        // Si ya la vio durante la sesión → no mostrar
        const yaMostrada = sessionStorage.getItem(STORAGE_KEY);
        if (yaMostrada) {
          setCargando(false);
          return;
        }

        // 1️⃣ Obtener promociones activas
        const promos = await obtenerPromociones(restauranteId);

        if (promos.length === 0) {
          setCargando(false);
          return;
        }

        // 2️⃣ Tomar la primera promoción activa (puedes cambiar a aleatoria)
        const promo = promos[0];
        setPromocion(promo);

        // 3️⃣ Delay suave tipo Uber Eats (UX Premium)
        setTimeout(() => {
          setVisible(true);
          registrarImpresion(promo.id); // registrar impresión
        }, 600);
      } catch (error) {
        console.error('❌ Error cargando popup de promoción:', error);
      } finally {
        setCargando(false);
      }
    };

    init();
  }, [restauranteId]);

  // ====================================================================
  // ❌ Cerrar popup
  // ====================================================================
  function cerrarPopup() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  // ====================================================================
  // 🖱 Registrar clic cuando usuario toca el botón
  // ====================================================================
  function clickPromo() {
    if (promocion?.id) {
      registrarClick(promocion.id);
    }
    cerrarPopup();
  }

  // ====================================================================
  // 🧩 Retorno del hook
  // ====================================================================
  return {
    promocion,
    visible,
    cargando,
    cerrarPopup,
    clickPromo
  };
}
