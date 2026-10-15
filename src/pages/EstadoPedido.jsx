import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Armchair,
  Camera,
  Check,
  ChevronDown,
  CookingPot,
  HandPlatter,
  HelpCircle,
  ReceiptText,
  ScanLine,
  X
} from 'lucide-react';

import { usePedidoActivo } from '../context/PedidoActivoContext';
import { usePedido } from '../context/PedidoContext';
import { useMesa } from '../context/MesaContext';
import { limpiarPedidoActivo, obtenerPedidoActivo, obtenerRutaMenuPedido } from '../utils/bloqueoPedido';
import { activarSonidoPedido } from '../utils/pedidoHaptics';
import '../styles/EstadoPedido.css';

const BASE_STEPS = [
  {
    id: 'recibido',
    label: 'Pedido recibido',
    desc: 'Tu orden entro al sistema y esta esperando confirmacion del restaurante.',
    Icon: Check
  },
  {
    id: 'cocinando',
    label: 'En cocina',
    desc: 'El equipo ya esta preparando tus productos.',
    Icon: CookingPot
  },
  {
    id: 'sirviendo',
    label: 'Camino a tu mesa',
    desc: 'Tu pedido esta listo para llevarlo a tu mesa o al punto de entrega.',
    Icon: HandPlatter
  },
  {
    id: 'cerrado',
    label: 'Entregado',
    desc: 'El pedido fue entregado y quedo cerrado correctamente.',
    Icon: Armchair
  }
];

const STAGE_MAP = {
  recibido: 'recibido',
  pendiente: 'recibido',
  aceptado: 'cocinando',
  preparacion: 'cocinando',
  listo: 'sirviendo',
  entregado: 'cerrado',
  cancelado: 'recibido'
};

const STATUS_UI = {
  recibido: {
    badge: 'Pedido recibido',
    title: 'El restaurante recibio tu pedido',
    description: 'Tu orden ya esta en el panel del restaurante y pronto pasara a cocina.',
    helper: 'Puedes seguir explorando el menu mientras el equipo confirma la preparacion.',
    tone: 'recibido'
  },
  cocinando: {
    badge: 'En cocina',
    title: 'El restaurante esta preparando tu pedido',
    description: 'La cocina ya esta trabajando tu orden.',
    helper: 'Te avisaremos en tiempo real cuando este listo para llevarlo a tu mesa.',
    tone: 'cocinando'
  },
  sirviendo: {
    badge: 'Listo para entregar',
    title: 'Tu pedido va hacia tu mesa',
    description: 'El restaurante marco tu orden como lista.',
    helper: 'Un miembro del equipo lo entregara en mesa o te llamara en mostrador segun el servicio.',
    tone: 'sirviendo'
  },
  cerrado: {
    badge: 'Entregado',
    title: 'Pedido entregado',
    description: 'Gracias por pedir con Comanda. Tu orden ya fue entregada correctamente.',
    helper: 'Para proteger la mesa, la sesion queda cerrada hasta un nuevo escaneo del QR.',
    tone: 'cerrado'
  }
};

function buildSteps(tipoPedido) {
  const esMesa = tipoPedido === 'mesa';
  return BASE_STEPS.map((step) => {
    if (step.id !== 'sirviendo') return step;
    return {
      ...step,
      label: esMesa ? 'Camino a tu mesa' : 'Listo para recoger',
      desc: esMesa
        ? 'Tu pedido esta listo para llevarlo a tu mesa.'
        : 'Tu pedido esta listo en el punto de entrega del restaurante.'
    };
  });
}

function getTitleForStage(ui, stage, tipoPedido) {
  if (stage !== 'sirviendo') return ui.title;
  return tipoPedido === 'mesa' ? 'Tu pedido va hacia tu mesa' : 'Tu pedido esta listo para recoger';
}

function getStage(estado) {
  return STAGE_MAP[estado] ?? 'recibido';
}

function getProgress(stage) {
  const index = BASE_STEPS.findIndex((step) => step.id === stage);
  if (index < 0) return 12;
  if (BASE_STEPS.length <= 1) return 100;
  return (index / (BASE_STEPS.length - 1)) * 100;
}

function getContextCopy(pedido, stage) {
  const tipo = pedido?.tipoPedido ?? 'mesa';
  const pago = pedido?.metodoPago ?? 'efectivo';

  if (stage === 'cerrado') {
    return tipo === 'mesa'
      ? 'El pedido ya fue entregado y la sesion operativa de la mesa se cerro para evitar pedidos remotos.'
      : 'Tu pedido ya fue entregado o retirado correctamente.';
  }

  if (stage === 'sirviendo') {
    if (tipo === 'mesa') {
      return pago === 'efectivo'
        ? 'Nuestro equipo te lo llevara a la mesa. El pago se confirma en efectivo con el personal.'
        : 'Nuestro equipo te lo llevara a la mesa.';
    }
    return pago === 'efectivo'
      ? 'Acercate al punto de entrega y paga en efectivo cuando te llamen.'
      : 'Tu pedido ya puede pasar a entrega o recogida.';
  }

  if (stage === 'cocinando') {
    return tipo === 'mesa'
      ? 'Te lo llevaremos a la mesa apenas quede listo.'
      : 'Lo tendras listo para recoger apenas salga de cocina.';
  }

  return tipo === 'mesa'
    ? 'Tu pedido sigue asociado a la mesa para que el equipo lo gestione sin friccion.'
    : 'Tu pedido para llevar ya esta en la cola correcta del restaurante.';
}

function formatUpdatedAt(value) {
  if (!value) return 'Sincronizando en tiempo real';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sincronizando en tiempo real';
  return `Actualizado ${date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function EstadoPedido() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { numeroMesa } = useMesa();
  const { pedidoId, clearPedidoId } = usePedido();
  const { pedido } = usePedidoActivo();

  const pedidoPersistido = useMemo(() => obtenerPedidoActivo(), []);
  const pedidoIdActivo = pedidoId ?? pedidoPersistido?.pedidoId ?? null;
  const slugActivo = slug ?? pedidoPersistido?.slug ?? null;
  const numeroMesaActiva = numeroMesa ?? pedidoPersistido?.numeroMesa ?? null;

  const menuPath = useMemo(
    () => obtenerRutaMenuPedido(slugActivo, numeroMesaActiva),
    [slugActivo, numeroMesaActiva]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [scannerActivo, setScannerActivo] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const ultimoEventoIdRef = useRef(null);
  const videoScannerRef = useRef(null);
  const streamScannerRef = useRef(null);

  useEffect(() => {
    if (!pedidoIdActivo) navigate(menuPath, { replace: true });
  }, [menuPath, navigate, pedidoIdActivo]);

  useEffect(() => {
    const eventId = pedido?.displayCall?.eventId;
    if (!eventId || eventId === ultimoEventoIdRef.current) return;
    ultimoEventoIdRef.current = eventId;
    const modalTimer = window.setTimeout(() => setModalVisible(true), 0);
    return () => window.clearTimeout(modalTimer);
  }, [pedido?.displayCall?.eventId]);

  useEffect(() => {
    if (!scannerActivo) return undefined;

    let cancelado = false;
    let rafId = 0;
    let ultimoIntento = 0;
    const canvas = document.createElement('canvas');
    const contexto = canvas.getContext('2d', { willReadFrequently: true });

    const detenerCamara = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      streamScannerRef.current?.getTracks?.().forEach((track) => track.stop());
      streamScannerRef.current = null;
    };

    const iniciarScanner = async () => {
      try {
        setScannerError('');

        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerError('Este navegador no permite abrir la camara desde aqui. Abre el QR fisico desde la camara del celular.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (cancelado) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamScannerRef.current = stream;
        const video = videoScannerRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        setScannerError('Camara abierta. Centra el QR dentro del recuadro; si no lo lee, usa la camara nativa del celular.');

        const leerQr = (timestamp = 0) => {
          if (cancelado || !videoScannerRef.current) return;
          try {
            const videoActivo = videoScannerRef.current;
            const videoListo = videoActivo.readyState >= 2 && videoActivo.videoWidth && videoActivo.videoHeight;

            if (contexto && videoListo && timestamp - ultimoIntento > 160) {
              ultimoIntento = timestamp;
              const maxSide = 720;
              const scale = Math.min(1, maxSide / Math.max(videoActivo.videoWidth, videoActivo.videoHeight));
              canvas.width = Math.max(1, Math.floor(videoActivo.videoWidth * scale));
              canvas.height = Math.max(1, Math.floor(videoActivo.videoHeight * scale));
              contexto.drawImage(videoActivo, 0, 0, canvas.width, canvas.height);

              const imageData = contexto.getImageData(0, 0, canvas.width, canvas.height);
              const codigo = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });
              const valor = codigo?.data?.trim();

              if (valor) {
                detenerCamara();
                clearPedidoId();
                limpiarPedidoActivo();
                setScannerActivo(false);
                window.location.href = valor;
                return;
              }
            }
          } catch {
            setScannerError('Manten el QR centrado y con buena luz para leerlo.');
          }
          rafId = window.requestAnimationFrame(leerQr);
        };

        rafId = window.requestAnimationFrame(leerQr);
      } catch {
        setScannerError('No pudimos abrir la camara. Revisa permisos o escanea el QR con la camara del celular.');
      }
    };

    iniciarScanner();

    return () => {
      cancelado = true;
      detenerCamara();
    };
  }, [clearPedidoId, scannerActivo]);

  const stage = useMemo(() => getStage(pedido?.estado), [pedido?.estado]);
  const ui = STATUS_UI[stage] ?? STATUS_UI.recibido;
  const uiTitle = getTitleForStage(ui, stage, pedido?.tipoPedido);
  const contextCopy = useMemo(() => getContextCopy(pedido, stage), [pedido, stage]);
  const ultimaActualizacion = useMemo(() => formatUpdatedAt(pedido?.updatedAt), [pedido?.updatedAt]);

  const servicioPrincipal = useMemo(() => {
    if (pedido?.tipoPedido === 'mesa') {
      return pedidoPersistido?.cuentaCompartidaActiva
        ? `Mesa ${numeroMesaActiva ?? 'asignada'} - cuenta en Mesa ${pedidoPersistido?.numeroMesaCuenta ?? pedido?.mesa?.numero ?? numeroMesaActiva ?? 'principal'}`
        : `Mesa ${pedido?.mesa?.numero ?? numeroMesaActiva ?? 'asignada'}`;
    }
    return 'Recoger en mostrador';
  }, [numeroMesaActiva, pedido, pedidoPersistido]);

  const servicioDetalle = pedido?.tipoPedido === 'mesa'
    ? 'El equipo entregara el pedido directamente en la mesa vinculada a este QR.'
    : 'Cuando este listo, acercate al punto de entrega del restaurante.';

  const totalPedido = pedido?.total ? `$${Number(pedido.total).toLocaleString('es-CO')}` : 'Total pendiente';
  const cantidadProductos = Number(pedido?.items?.length || pedido?.productos?.length || pedidoPersistido?.totalItems || 1);
  const textoResumen = `${cantidadProductos} ${cantidadProductos === 1 ? 'producto' : 'productos'} - ${totalPedido}`;
  const rangoEstimado = useMemo(() => {
    const base = Number(pedido?.tiempoPreparacion || 15);
    const min = Math.max(5, base);
    const max = min + 10;
    return `${min} - ${max} min`;
  }, [pedido?.tiempoPreparacion]);

  const trackingSteps = useMemo(() => buildSteps(pedido?.tipoPedido), [pedido?.tipoPedido]);

  const timeline = useMemo(() => {
    const currentIndex = trackingSteps.findIndex((step) => step.id === stage);
    return trackingSteps.map((step, index) => ({ ...step, active: index <= currentIndex }));
  }, [stage, trackingSteps]);

  const resumen = useMemo(() => [
    { label: pedido?.tipoPedido === 'mesa' ? 'Mesa' : 'Servicio', value: servicioPrincipal },
    { label: 'Pago', value: pedido?.metodoPago === 'pse' ? 'PSE' : pedido?.metodoPago === 'online' ? 'Online' : 'Efectivo' },
    { label: 'Total', value: totalPedido },
    { label: 'Sincronizacion', value: ultimaActualizacion }
  ], [pedido?.metodoPago, pedido?.tipoPedido, servicioPrincipal, totalPedido, ultimaActualizacion]);

  const volverAlMenu = () => {
    clearPedidoId();
    limpiarPedidoActivo();
    navigate(menuPath, { replace: true });
  };

  const abrirScannerQr = () => {
    setScannerError('');
    setScannerActivo(true);
  };

  const cerrarScannerQr = () => {
    setScannerActivo(false);
    setScannerError('');
  };

  const scannerQrOverlay = scannerActivo ? (
    <div className="estado-scanner-backdrop" role="dialog" aria-modal="true" aria-label="Escanear QR de mesa">
      <div className="estado-scanner-card">
        <div className="estado-scanner-head">
          <button type="button" onClick={cerrarScannerQr} aria-label="Cerrar camara">
            <X aria-hidden="true" />
          </button>
          <strong>Escanea el QR fisico</strong>
        </div>
        <div className="estado-scanner-frame">
          <video ref={videoScannerRef} playsInline muted />
          <ScanLine aria-hidden="true" />
        </div>
        <p>
          Centra el QR de la mesa dentro del recuadro para abrir una nueva sesion segura.
        </p>
        {scannerError ? <span className="estado-scanner-error">{scannerError}</span> : null}
        <button type="button" className="estado-scanner-fallback" onClick={volverAlMenu}>
          Ir al menu manualmente
        </button>
      </div>
    </div>
  ) : null;

  const mostrarCierreQr =
    pedido?.estado === 'entregado' && (pedido?.tipoPedido === 'mesa' || pedidoPersistido?.tipoPedido === 'mesa');

  if (!pedido) {
    return (
      <div className="estado-container">
        <div className="estado-loading-shell">
          <div className="estado-orbit">
            <span className="estado-orbit-core">...</span>
            <span className="estado-orbit-dot estado-orbit-dot--one" />
            <span className="estado-orbit-dot estado-orbit-dot--two" />
            <span className="estado-orbit-dot estado-orbit-dot--three" />
          </div>
          <span className="estado-loading-badge">Comanda en vivo</span>
          <h1 className="estado-loading-title">Conectando tu pedido</h1>
          <p className="estado-loading-copy">
            Estamos entrando al seguimiento en tiempo real para mostrarte el estado sin que tengas que recargar.
          </p>
        </div>
      </div>
    );
  }

  if (mostrarCierreQr) {
    return (
      <div className="estado-container">
        <div className="estado-security-shell">
          <span className="estado-security-kicker">Operacion protegida</span>
          <h1 className="estado-security-title">Vuelve a escanear el QR para iniciar un nuevo pedido</h1>
          <p className="estado-security-copy">
            El restaurante ya marco este pedido como entregado. Por seguridad, cerramos la sesion de la mesa para evitar
            pedidos remotos o reuso indebido del menu fuera del local.
          </p>

          <div className="estado-security-card">
            <div className="estado-security-step">
              <span className="estado-security-index">1</span>
              <div>
                <strong>Pedido entregado</strong>
                <p>La orden quedo cerrada correctamente en la mesa.</p>
              </div>
            </div>
            <div className="estado-security-step">
              <span className="estado-security-index">2</span>
              <div>
                <strong>Sesion QR finalizada</strong>
                <p>Este acceso ya no puede seguir enviando pedidos con la validacion anterior.</p>
              </div>
            </div>
            <div className="estado-security-step">
              <span className="estado-security-index">3</span>
              <div>
                <strong>Nuevo escaneo requerido</strong>
                <p>Abre otra vez el QR fisico de la mesa para habilitar una nueva sesion segura.</p>
              </div>
            </div>
          </div>

          <div className="estado-security-meta">
            <span className="estado-security-pill">Pedido #{pedidoIdActivo}</span>
            {numeroMesaActiva ? <span className="estado-security-pill">Mesa {numeroMesaActiva}</span> : null}
            {pedidoPersistido?.numeroMesaCuenta ? (
              <span className="estado-security-pill">Cuenta en Mesa {pedidoPersistido.numeroMesaCuenta}</span>
            ) : null}
          </div>

          <button className="btn-finalizar" onClick={volverAlMenu}>
            Abrir menu
          </button>

          <button className="estado-rescan-camera-button" onClick={abrirScannerQr}>
            <Camera aria-hidden="true" />
            Escanear QR con camara
          </button>
        </div>

        {scannerQrOverlay}
      </div>
    );
  }

  return (
    <div className="estado-container estado-container--tracking">
      {modalVisible && pedido?.displayCall && (
        <div className="estado-modal-backdrop" onClick={() => setModalVisible(false)}>
          <div className="estado-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="estado-modal-head">
              <span className="estado-modal-tag">Comanda avisa</span>
              <span className="estado-modal-live">En vivo</span>
            </div>
            <div className="estado-modal-hero">
              <div>
                <h2>{pedido.displayCall.titulo}</h2>
                <p>{pedido.displayCall.mensaje}</p>
              </div>
              <div className="estado-modal-turno-card">
                <span>Turno</span>
                <strong>{pedido.displayCall.numeroPedido ?? pedidoIdActivo}</strong>
              </div>
            </div>
            <div className="estado-modal-message-card">
              <span>Instruccion final</span>
              <strong>{pedido.displayCall.submensaje}</strong>
              <small>Este aviso esta sincronizado con la pantalla del local y con el estado en vivo de tu pedido.</small>
            </div>
            <button
              type="button"
              className="btn-finalizar"
              onClick={() => {
                activarSonidoPedido();
                setModalVisible(false);
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <header className="estado-rappi-header">
        <button type="button" className="estado-round-action" onClick={() => navigate(menuPath, { replace: true })} aria-label="Cerrar seguimiento">
          <X aria-hidden="true" />
        </button>
        <button type="button" className="estado-help-button">
          <HelpCircle aria-hidden="true" />
          Ayuda
        </button>
      </header>

      <section className={`estado-tracking-hero estado-tracking-hero--${ui.tone}`}>
        <span className="estado-tracking-badge">{ui.badge}</span>
        <h1>{uiTitle}</h1>
        <p>{ui.description}</p>
        <p className="estado-estimado">
          Tiempo estimado: <strong>{rangoEstimado}</strong>
        </p>

        <div className="estado-rappi-progress" aria-label={`Estado actual: ${ui.badge}`}>
          <span className="estado-rappi-progress-line" />
          <span className="estado-rappi-progress-fill" style={{ width: `${getProgress(stage)}%` }} />
          {trackingSteps.map((step, index) => {
            const currentIndex = trackingSteps.findIndex((trackingStep) => trackingStep.id === stage);
            const active = index <= currentIndex;
            const current = step.id === stage;
            return (
              <span key={step.id} className={`estado-rappi-step ${active ? 'is-active' : ''} ${current ? 'is-current' : ''}`}>
                {createElement(step.Icon, { 'aria-hidden': true })}
              </span>
            );
          })}
        </div>
      </section>

      <section className="estado-service-card">
        <div>
          <span>Detalles del servicio</span>
          <strong>{servicioPrincipal}</strong>
          <p>{servicioDetalle}</p>
        </div>
        <button type="button" aria-label="Ver detalles del servicio">
          <ChevronDown aria-hidden="true" />
        </button>
      </section>

      <section className="estado-order-summary">
        <div className="estado-summary-logo">
          <ReceiptText aria-hidden="true" />
        </div>
        <div>
          <span>Resumen del pedido</span>
          <strong>{textoResumen}</strong>
          <p>Pedido #{pedidoIdActivo} - {contextCopy}</p>
        </div>
        <button type="button" aria-label="Ver resumen del pedido">
          <ChevronDown aria-hidden="true" />
        </button>
      </section>

      {pedido?.displayCall && (
        <div className="estado-callout">
          <div className="estado-callout-copy">
            <span className="estado-callout-kicker">{pedido.displayCall.titulo}</span>
            <strong>{pedido.displayCall.mensaje}</strong>
            <p>{pedido.displayCall.submensaje}</p>
          </div>
          <div className="estado-callout-ticket">
            <span>Turno</span>
            <strong>{pedido.displayCall.numeroPedido ?? pedidoIdActivo}</strong>
          </div>
          <button type="button" className="estado-callout-action" onClick={() => setModalVisible(true)}>
            Ver aviso
          </button>
        </div>
      )}

      <section className="estado-live-card">
        <div className="estado-live-card-head">
          <span>Seguimiento en vivo</span>
          <strong>{trackingSteps.find((step) => step.id === stage)?.label ?? ui.badge}</strong>
          <p>{ui.helper}</p>
        </div>
        <div className="estado-timeline">
          {timeline.map((step) => {
            const StepIcon = step.Icon;
            return (
            <div key={step.id} className={`estado-step ${step.active ? 'activo' : ''}`}>
              <div className="estado-step-dot">{createElement(StepIcon, { 'aria-hidden': true })}</div>
              <div>
                <div className="estado-step-label">{step.label}</div>
                <div className="estado-step-desc">{step.desc}</div>
              </div>
            </div>
          );})}
        </div>
      </section>

      <div className="estado-snapshot-grid estado-snapshot-grid--compact">
        {resumen.map((item) => (
          <div key={item.label} className="estado-snapshot-card">
            <span className="estado-snapshot-label">{item.label}</span>
            <strong className="estado-snapshot-value">{item.value}</strong>
          </div>
        ))}
      </div>

      {pedido.estado === 'entregado' ? (
        <button className="estado-rescan-camera-button" onClick={abrirScannerQr}>
          <Camera aria-hidden="true" />
          Escanear QR con camara
        </button>
      ) : (
        <button className="btn-volver" onClick={() => navigate(menuPath, { replace: true })}>
          Volver al menu
        </button>
      )}
      {scannerQrOverlay}
    </div>
  );
}
