// client-qr/src/components/pedido/InputDireccion.jsx
// ======================================================================
// 📍 InputDireccion.jsx – FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Responsabilidad ÚNICA:
// • Capturar y validar dirección para pedidos a domicilio
// • UX clara, encapsulada y reutilizable
// • SIN lógica de flujo
// • SIN dependencias externas
// ======================================================================

import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------
// ⚙️ Configuración mínima (escalable)
// ----------------------------------------------------------------------
const MIN_LONGITUD_DIRECCION = 6;

// ----------------------------------------------------------------------
// 🧩 Componente
// ----------------------------------------------------------------------
export default function InputDireccion({ direccion, onChange, onValidez }) {
  const [valor, setValor] = useState(direccion || '');
  const [error, setError] = useState(null);

  // --------------------------------------------------------------
  // 🧠 Validación mínima
  // --------------------------------------------------------------
  const validar = (texto) => {
    if (!texto || texto.trim().length < MIN_LONGITUD_DIRECCION) {
      return `Ingresa una dirección válida (mínimo ${MIN_LONGITUD_DIRECCION} caracteres)`;
    }
    return null;
  };

  // --------------------------------------------------------------
  // 🔁 Sincronizar valor externo + validez (CORRECCIÓN CRÍTICA)
  // --------------------------------------------------------------
  useEffect(() => {
    const nuevoValor = direccion || '';
    setValor(nuevoValor);

    const errorActual = validar(nuevoValor);
    setError(errorActual);

    if (typeof onValidez === 'function') {
      onValidez(!errorActual);
    }
  }, [direccion]);

  // --------------------------------------------------------------
  // ✍️ Manejo de cambio
  // --------------------------------------------------------------
  const manejarCambio = (e) => {
    const nuevoValor = e.target.value;
    setValor(nuevoValor);

    const errorValidacion = validar(nuevoValor);
    setError(errorValidacion);

    if (typeof onChange === 'function') {
      onChange(nuevoValor);
    }

    if (typeof onValidez === 'function') {
      onValidez(!errorValidacion);
    }
  };

  // --------------------------------------------------------------
  // 🖼️ Render
  // --------------------------------------------------------------
  return (
    <div className="space-y-1">
      <label className="fo-label">Dirección de entrega *</label>

      <input
        type="text"
        className={`fo-input ${error ? 'fo-input-error' : ''}`}
        placeholder="Ej: Calle 45 #12-34, Apto 301"
        value={valor}
        onChange={manejarCambio}
        autoComplete="street-address"
      />

      {error && <div className="fo-text-error text-sm">{error}</div>}
    </div>
  );
}
