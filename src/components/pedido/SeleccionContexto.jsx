import { useMemo, useState } from 'react';

import { obtenerMesaPublica } from '../../services/publicApi';
import formatearPrecio from '../../utils/formatearPrecio';
import { PASOS_PEDIDO, validarPedido } from '../../utils/validarPedido';
import '../../styles/Formulario.css';
import '../../styles/SeleccionContexto.css';

function MesaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="fo-contexto-option-icon-svg">
      <path
        d="M6.75 4.75a.75.75 0 0 1 .75.75v4h9v-4a.75.75 0 0 1 1.5 0v4.25A1.25 1.25 0 0 1 16.75 11H13v7.25a.75.75 0 0 1-1.5 0V11H7.25A1.25 1.25 0 0 1 6 9.75V5.5a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
      />
      <path
        d="M4.75 11.5A.75.75 0 0 1 5.5 12v6.25a.75.75 0 0 1-1.5 0V12a.75.75 0 0 1 .75-.75Zm14.5 0A.75.75 0 0 1 20 12v6.25a.75.75 0 0 1-1.5 0V12a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

function TakeawayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="fo-contexto-option-icon-svg">
      <path
        d="M7.25 8.5h9.5l-.74 9.02A1.5 1.5 0 0 1 14.52 19H9.48a1.5 1.5 0 0 1-1.49-1.48L7.25 8.5Z"
        fill="currentColor"
      />
      <path
        d="M8.25 8.5V7a3.75 3.75 0 1 1 7.5 0v1.5h-1.5V7a2.25 2.25 0 0 0-4.5 0v1.5h-1.5Zm-2.5 0h12.5a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1 0-1.5Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export default function SeleccionContexto({
  pedido,
  items = [],
  slug = null,
  contextoBloqueado = false,
  mesaConfirmada = false,
  onContinuar
}) {
  const [tipoPedido, setTipoPedido] = useState(pedido.tipoPedido);
  const [numeroMesa, setNumeroMesa] = useState(pedido.numeroMesa ?? null);
  const [error, setError] = useState(null);
  const [resolviendoMesa, setResolviendoMesa] = useState(false);

  const mesaInputValue = useMemo(
    () => (numeroMesa == null ? '' : String(numeroMesa)),
    [numeroMesa]
  );
  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0),
    [items]
  );
  const totalPedido = useMemo(
    () =>
      items.reduce(
        (acc, item) =>
          acc + Number(item?.precioUnitario || item?.precio || 0) * Number(item?.cantidad || 0),
        0
      ),
    [items]
  );
  const resumenCantidad = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`;
  const mesaQrDetectada = Boolean(
    (pedido?.numeroMesa ?? numeroMesa) && (contextoBloqueado || pedido?.tipoPedido === 'mesa')
  );
  const numeroMesaVisible = pedido?.numeroMesa ?? numeroMesa;
  const cuentaCompartidaActiva = Boolean(pedido?.cuentaCompartidaActiva);
  const mesaCuentaNumero = pedido?.mesaCuentaNumero || numeroMesaVisible;
  const grupoMesas = Array.isArray(pedido?.grupoMesas) ? pedido.grupoMesas : [];

  const continuar = async () => {
    setError(null);

    let estado = {
      tipoPedido,
      mesaId: null,
      numeroMesa: null,
      direccion: null
    };

    if (tipoPedido === 'mesa') {
      if (!slug) {
        setError('No pudimos identificar el restaurante para validar la mesa.');
        return;
      }

      if (mesaQrDetectada && pedido?.mesaId) {
        estado = {
          ...estado,
          mesaId: pedido.mesaId,
          numeroMesa: numeroMesaVisible,
          mesaCuentaNumero,
          cuentaCompartidaActiva,
          grupoMesas
        };
      } else {
      try {
        setResolviendoMesa(true);
        const mesa = await obtenerMesaPublica(slug, numeroMesa);
        estado = {
          ...estado,
          mesaId: mesa?.mesaCuentaId ?? mesa?.mesaId ?? null,
          numeroMesa: mesa?.numero ?? numeroMesa,
          mesaCuentaNumero: mesa?.mesaCuentaNumero ?? mesa?.numero ?? numeroMesa,
          cuentaCompartidaActiva: Boolean(mesa?.cuentaCompartidaActiva),
          grupoMesas: Array.isArray(mesa?.grupoMesas) ? mesa.grupoMesas : []
        };
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'No pudimos validar esa mesa. Revisa el numero e intenta nuevamente.'
        );
        setResolviendoMesa(false);
        return;
      }
      }
    }

    const resultado = validarPedido({ ...pedido, ...estado, items }, PASOS_PEDIDO.CONTEXTO);

    if (!resultado.valido) {
      setError(resultado.errores[0]?.mensaje);
      setResolviendoMesa(false);
      return;
    }

    setResolviendoMesa(false);
    onContinuar(estado);
  };

  return (
    <div className="fo-contexto-step">
      <div className="fo-contexto-header">
        <span className="fo-contexto-eyebrow">Paso 1 de 2</span>
        <h2 className="fo-contexto-title">
          {mesaQrDetectada ? 'Confirma el contexto de tu pedido' : 'Como deseas recibir tu pedido'}
        </h2>
        <p className="fo-contexto-description">
          {mesaQrDetectada
            ? 'La mesa del QR ya viene asociada. Revisa el contexto y continua con el pago.'
            : 'Define la modalidad de atencion para continuar con el pago y el envio a cocina.'}
        </p>
      </div>

      <div className="fo-contexto-summary-card">
        <div>
          <span className="fo-contexto-summary-label">Pedido actual</span>
          <strong className="fo-contexto-summary-value">{resumenCantidad}</strong>
        </div>
        <div className="fo-contexto-summary-total">{formatearPrecio(totalPedido)}</div>
      </div>

      {error && <div className="fo-alert-error">{error}</div>}

      {mesaQrDetectada ? (
        <div className="fo-contexto-locked-card">
          <div className="fo-contexto-locked-icon">
            <MesaIcon />
          </div>
          <div className="fo-contexto-locked-copy">
            <span className="fo-contexto-locked-label">Mesa detectada desde QR</span>
            <strong className="fo-contexto-locked-title">
              Mesa {numeroMesaVisible} confirmada desde el QR
            </strong>
            <p className="fo-contexto-locked-text">
              {cuentaCompartidaActiva
                ? `Tu mesa forma parte de una cuenta unificada. El pedido se sumara a Mesa ${mesaCuentaNumero}.`
                : 'Tu pedido quedara asociado automaticamente a esta mesa. No necesitas ingresarla de nuevo.'}
            </p>
            {cuentaCompartidaActiva && grupoMesas.length > 1 ? (
              <small className="fo-contexto-locked-text">
                Grupo activo: {grupoMesas.map((mesa) => `Mesa ${mesa.numero}`).join(' · ')}
              </small>
            ) : null}
          </div>
          <span className={`fo-contexto-locked-status ${mesaConfirmada ? 'is-confirmed' : ''}`}>
            {mesaConfirmada ? 'Confirmada' : 'Validando'}
          </span>
        </div>
      ) : (
        <div className="fo-contexto-options" role="radiogroup" aria-label="Tipo de pedido">
          <button
            type="button"
            className={`fo-contexto-option ${tipoPedido === 'mesa' ? 'is-selected' : ''}`}
            onClick={() => {
              setTipoPedido('mesa');
              setError(null);
            }}
            aria-pressed={tipoPedido === 'mesa'}
          >
            <span className="fo-contexto-option-icon">
              <MesaIcon />
            </span>
            <span className="fo-contexto-option-copy">
              <span className="fo-contexto-option-title">En mesa</span>
              <span className="fo-contexto-option-description">
                Para servicio en el restaurante con identificacion de mesa.
              </span>
            </span>
            <span className="fo-contexto-option-check" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`fo-contexto-option ${tipoPedido === 'llevar' ? 'is-selected' : ''}`}
            onClick={() => {
              setTipoPedido('llevar');
              setNumeroMesa(null);
              setError(null);
            }}
            aria-pressed={tipoPedido === 'llevar'}
          >
            <span className="fo-contexto-option-icon">
              <TakeawayIcon />
            </span>
            <span className="fo-contexto-option-copy">
              <span className="fo-contexto-option-title">Para llevar</span>
              <span className="fo-contexto-option-description">
                Prepararemos el pedido para entrega rapida en empaque.
              </span>
            </span>
            <span className="fo-contexto-option-check" aria-hidden="true" />
          </button>
        </div>
      )}

      {tipoPedido === 'mesa' && !mesaQrDetectada && (
        <div className="fo-contexto-mesa-card">
          <div className="fo-contexto-mesa-head">
            <div>
              <span className="fo-contexto-mesa-label">Numero de mesa</span>
              <p className="fo-contexto-mesa-help">
                Ingresa la mesa para direccionar correctamente la atencion del pedido.
              </p>
            </div>
            <span className="fo-contexto-required-pill">Obligatorio</span>
          </div>

          <input
            type="number"
            inputMode="numeric"
            min="1"
            className={`fo-input fo-contexto-mesa-input ${error ? 'fo-input-error' : ''}`}
            value={mesaInputValue}
            onChange={(e) => {
              setNumeroMesa(e.target.value ? Number(e.target.value) : null);
              if (error) setError(null);
            }}
            placeholder="Ej: 5"
          />
        </div>
      )}

      {tipoPedido && (
        <div className="fo-contexto-footnote">
          {mesaQrDetectada
            ? 'La mesa detectada desde el QR se usara automaticamente durante todo el proceso de compra.'
            : tipoPedido === 'mesa'
            ? 'Validaremos la mesa antes de continuar para evitar errores en la entrega.'
            : 'Tu pedido quedara marcado para entrega en mostrador o retiro.'}
        </div>
      )}

      <div className="fo-contexto-cta">
        <button
          type="button"
          className="fo-btn fo-btn-primary fo-btn-block fo-btn-lg"
          onClick={continuar}
          disabled={
            resolviendoMesa ||
            !tipoPedido ||
            (tipoPedido === 'mesa' && !mesaQrDetectada && !numeroMesa) ||
            (mesaQrDetectada && !mesaConfirmada)
          }
        >
          {resolviendoMesa ? 'Validando mesa...' : mesaQrDetectada ? 'Continuar al pago' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
