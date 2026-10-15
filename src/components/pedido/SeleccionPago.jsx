import '../../styles/SeleccionPago.css';

function CajaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="fo-pago-method-icon-svg">
      <path
        d="M4 7.75A1.75 1.75 0 0 1 5.75 6h12.5A1.75 1.75 0 0 1 20 7.75v8.5A1.75 1.75 0 0 1 18.25 18H5.75A1.75 1.75 0 0 1 4 16.25v-8.5Z"
        fill="currentColor"
      />
      <path
        d="M4.75 9.5h14.5v1.5H4.75V9.5Zm8.5 3.25a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0Z"
        fill="#fff"
      />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="fo-pago-method-icon-svg">
      <path
        d="M3.75 6.5A1.75 1.75 0 0 1 5.5 4.75h13A1.75 1.75 0 0 1 20.25 6.5v11A1.75 1.75 0 0 1 18.5 19.25h-13A1.75 1.75 0 0 1 3.75 17.5v-11Z"
        fill="currentColor"
      />
      <path
        d="M6.5 8.25h11v1.5h-11v-1.5Zm0 3h5.5v1.5H6.5v-1.5Zm0 3h7.5v1.5H6.5v-1.5Z"
        fill="#fff"
      />
    </svg>
  );
}

export default function SeleccionPago({
  tipoPedido = 'mesa',
  numeroMesa = null,
  clienteNombre = '',
  mesaConfirmada = false,
  contextoBloqueado = false,
  resolviendoMesa = false,
  sesionQrActiva = true,
  error = '',
  enviando = false,
  onAtras,
  onChangeClienteNombre,
  onSeleccionarMetodo,
  mostrarAtras = true
}) {
  const metodoCaja = tipoPedido === 'llevar' ? 'efectivo' : 'caja';
  const ctaCaja = tipoPedido === 'llevar' ? 'Pagar en efectivo' : 'Pagar en caja';
  const descripcionCaja =
    tipoPedido === 'llevar'
      ? 'Pagas al retirar el pedido en el punto de entrega.'
      : 'El equipo del restaurante registrara el pago en caja.';
  const contextoTitulo = contextoBloqueado
    ? resolviendoMesa
      ? 'Vinculando mesa desde el QR'
      : `Mesa ${numeroMesa || ''} confirmada desde el QR`
    : tipoPedido === 'mesa'
      ? 'Servicio en mesa'
      : 'Pedido para llevar';
  const contextoDetalle = contextoBloqueado
    ? resolviendoMesa
      ? 'Estamos validando la mesa asociada al codigo para enviar el pedido correctamente.'
      : 'Tu pedido quedara asociado a esta mesa automaticamente. No necesitas ingresarla de nuevo.'
    : tipoPedido === 'mesa'
      ? 'El pedido se enviara a cocina asociado a la mesa seleccionada.'
      : 'El pedido quedara listo para retiro en mostrador.';
  const bloqueoAccion =
    resolviendoMesa ||
    (tipoPedido === 'mesa' &&
      (!numeroMesa || (contextoBloqueado && (!mesaConfirmada || !sesionQrActiva))));
  const clienteNombreNormalizado = String(clienteNombre || '').trim();
  const clienteNombreValido = clienteNombreNormalizado.length >= 2;
  const puedeContinuar = !bloqueoAccion && clienteNombreValido && !enviando;
  const estadoContexto = resolviendoMesa
    ? 'Validando'
    : contextoBloqueado
      ? sesionQrActiva
        ? 'QR activo'
        : 'Reescanear'
      : 'Editable';
  const mensajeSesionQr =
    contextoBloqueado && !sesionQrActiva
      ? 'La sesion QR de esta mesa ya no esta activa. Vuelve a escanear el codigo para continuar.'
      : '';

  return (
    <div className="fo-pago-step">
      <div className="fo-pago-header">
        <span className="fo-pago-eyebrow">Paso 2 de 2</span>
        <h2 className="fo-pago-title">Selecciona como deseas finalizar tu pedido</h2>
        <p className="fo-pago-description">
          Elige el metodo de pago para enviar la orden con la trazabilidad correcta.
        </p>
      </div>

      <div className={`fo-pago-context-card ${contextoBloqueado ? 'is-locked' : ''}`}>
        <div className="fo-pago-context-copy">
          <span className="fo-pago-context-label">Contexto del pedido</span>
          <strong className="fo-pago-context-title">{contextoTitulo}</strong>
          <p className="fo-pago-context-text">{contextoDetalle}</p>
        </div>
        <span className={`fo-pago-context-status ${resolviendoMesa ? 'is-loading' : ''}`}>
          {estadoContexto}
        </span>
      </div>

      {(mensajeSesionQr || error) && (
        <div className="fo-pago-alert" role="alert">
          {mensajeSesionQr || error}
        </div>
      )}

      <div className="fo-pago-identidad-card">
        <div className="fo-pago-identidad-head">
          <div>
            <span className="fo-pago-identidad-label">Quien hace este pedido</span>
            <p className="fo-pago-identidad-help">
              Usaremos este nombre para que caja, cocina y entrega identifiquen mejor la orden.
            </p>
          </div>
          <span className="fo-pago-identidad-pill">Obligatorio</span>
        </div>

        <input
          type="text"
          className="fo-input fo-pago-identidad-input"
          value={clienteNombre}
          onChange={(e) => onChangeClienteNombre?.(e.target.value)}
          placeholder="Ej: Javier, Ana, Mesa familia Lopez"
          maxLength={120}
          autoComplete="name"
        />

        {!clienteNombreValido && (
          <small className="fo-pago-identidad-note">
            Escribe al menos un nombre corto para continuar con el pago.
          </small>
        )}
      </div>

      <div className="fo-pago-methods">
        <button
          type="button"
          className="fo-pago-method is-primary"
          onClick={() => onSeleccionarMetodo({ metodoPago: metodoCaja })}
          disabled={!puedeContinuar}
        >
          <span className="fo-pago-method-icon">
            <CajaIcon />
          </span>
          <span className="fo-pago-method-copy">
            <span className="fo-pago-method-title">{ctaCaja}</span>
            <span className="fo-pago-method-description">
              {enviando ? 'Estamos enviando tu pedido al restaurante...' : descripcionCaja}
            </span>
          </span>
        </button>

        <button
          type="button"
          className="fo-pago-method"
          onClick={() => onSeleccionarMetodo({ metodoPago: 'online' })}
          disabled={!puedeContinuar}
        >
          <span className="fo-pago-method-icon">
            <OnlineIcon />
          </span>
          <span className="fo-pago-method-copy">
            <span className="fo-pago-method-title">Pagar online</span>
            <span className="fo-pago-method-description">
              {enviando
                ? 'Estamos procesando tu pedido antes de abrir el pago.'
                : 'Finaliza de forma inmediata con el medio digital disponible.'}
            </span>
          </span>
        </button>
      </div>

      {mostrarAtras && (
        <button type="button" className="fo-btn fo-btn-outline fo-btn-block" onClick={onAtras}>
          Volver
        </button>
      )}
    </div>
  );
}
