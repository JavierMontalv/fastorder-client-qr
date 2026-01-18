// client-qr/src/components/pedido/SeleccionContexto.jsx
// ======================================================================
// 🧭 SeleccionContexto.jsx – FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Paso OBLIGATORIO
// • Mesa / Domicilio (excluyentes)
// • Mesa requiere número obligatorio
// • Domicilio requiere dirección válida obligatoria
// • NO permite avanzar sin selección válida
// ======================================================================

import { useState } from 'react';

import { PASOS_PEDIDO, validarPedido } from '../../utils/validarPedido';
import InputDireccion from './InputDireccion';

export default function SeleccionContexto({ pedido, onContinuar }) {
  const [tipoPedido, setTipoPedido] = useState(pedido.tipoPedido);
  const [mesaId, setMesaId] = useState(pedido.mesaId);
  const [direccion, setDireccion] = useState(pedido.direccion);
  const [direccionValida, setDireccionValida] = useState(false);
  const [error, setError] = useState(null);

  const continuar = () => {
    if (tipoPedido === 'domicilio' && !direccionValida) {
      setError('Debes ingresar una dirección válida');
      return;
    }

    const estado = {
      tipoPedido,
      mesaId: tipoPedido === 'mesa' ? mesaId : null,
      direccion: tipoPedido === 'domicilio' ? direccion : null
    };

    const resultado = validarPedido({ ...pedido, ...estado }, PASOS_PEDIDO.CONTEXTO);

    if (!resultado.valido) {
      setError(resultado.errores[0]?.mensaje);
      return;
    }

    onContinuar(estado);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">¿Cómo deseas tu pedido?</h2>

      {error && <div className="fo-alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <button
          className={`fo-btn ${tipoPedido === 'mesa' ? 'fo-btn-primary' : 'fo-btn-outline'}`}
          onClick={() => {
            setTipoPedido('mesa');
            setDireccion(null);
            setDireccionValida(false);
            setError(null);
          }}
        >
          🍽️ En mesa
        </button>

        <button
          className={`fo-btn ${tipoPedido === 'domicilio' ? 'fo-btn-primary' : 'fo-btn-outline'}`}
          onClick={() => {
            setTipoPedido('domicilio');
            setMesaId(null);
            setError(null);
          }}
        >
          🏠 Domicilio
        </button>
      </div>

      {tipoPedido === 'mesa' && (
        <div>
          <label className="fo-label">Número de mesa *</label>
          <input
            type="number"
            className="fo-input"
            value={mesaId || ''}
            onChange={(e) => setMesaId(e.target.value)}
            placeholder="Ej: 5"
          />
        </div>
      )}

      {tipoPedido === 'domicilio' && (
        <InputDireccion
          direccion={direccion}
          onChange={setDireccion}
          onValidez={setDireccionValida}
        />
      )}

      <div className="pt-2">
        <button
          className="fo-btn fo-btn-primary w-full"
          onClick={continuar}
          disabled={
            !tipoPedido ||
            (tipoPedido === 'mesa' && !mesaId) ||
            (tipoPedido === 'domicilio' && !direccionValida)
          }
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
