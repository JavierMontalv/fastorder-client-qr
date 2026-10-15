// client-qr/src/context/PedidoActivoContext.jsx
// =============================================================================
// Contexto centralizado del pedido activo.
//
// Responsabilidad única:
//   · Mantener UNA sola conexión Socket.IO para el pedido en curso
//   · Proveer estado en tiempo real a TODOS los consumidores (banner + EstadoPedido)
//   · Polling de respaldo (10 s) cuando el socket no está disponible
//   · Sincronización al volver a tab visible / foco de ventana
//
// Ventaja clave: cuando el usuario navega entre el menú y EstadoPedido,
// el estado ya está disponible de inmediato — sin reconexión ni nueva llamada API.
// =============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { io } from 'socket.io-client';

import { SOCKET_BASE_URL } from '../config/env';
import { useMesa } from './MesaContext';
import { usePedido } from './PedidoContext';
import { obtenerEstadoPedidoPublico } from '../services/pedidosService';
import {
  actualizarEstadoPedido,
  actualizarPedidoActivo,
  obtenerPedidoActivo
} from '../utils/bloqueoPedido';
import { registerPushNotifications } from '../push/registerPush';
import { listenPushMessages } from '../push/listenPush';
import {
  prepararHapticaPedido,
  vibrarCambioEstadoPedido,
  vibrarLlamadoPedido
} from '../utils/pedidoHaptics';

// ─── Estados terminales — socket se desconecta en estos ─────────────
const ESTADOS_TERMINALES = new Set(['entregado', 'cancelado']);

// ─── Hydratación inicial desde localStorage ──────────────────────────
function hydratarDesdeLocal(pedidoIdActual) {
  if (!pedidoIdActual) return null;
  const local = obtenerPedidoActivo();
  if (!local || String(local.pedidoId) !== String(pedidoIdActual)) return null;
  return {
    id: local.pedidoId,
    estado: local.estado ?? null,
    estadoPago: local.estadoPago ?? null,
    tipoPedido: local.tipoPedido ?? null,
    metodoPago: local.metodoPago ?? null,
    tiempoPreparacion: local.tiempoPreparacion ?? null,
    total: local.total ?? null,
    updatedAt: local.updatedAt ?? null,
    mesa: local.numeroMesa ? { numero: local.numeroMesa } : null,
    displayCall: null
  };
}

// ─── Normaliza la actualización persistida ──────────────────────────
function persistirActualizacion(data, pedidoId, restauranteId) {
  const local = obtenerPedidoActivo();
  actualizarEstadoPedido(data.estado);
  actualizarPedidoActivo({
    pedidoId: data.id || pedidoId,
    restauranteId: restauranteId ?? local?.restauranteId ?? null,
    mesaId: data.mesaId ?? data?.mesa?.id ?? local?.mesaId ?? null,
    estado: data.estado,
    estadoPago: data.estadoPago ?? null,
    tipoPedido: data.tipoPedido ?? null,
    metodoPago: data.metodoPago ?? null,
    tiempoPreparacion: data.tiempoPreparacion ?? null,
    total: data.total ?? null,
    updatedAt: data.updatedAt ?? null,
    slug: local?.slug ?? null,
    numeroMesa: local?.numeroMesa ?? data?.mesa?.numero ?? null,
    numeroMesaCuenta: data?.mesa?.numero ?? local?.numeroMesaCuenta ?? null,
    cuentaCompartidaActiva: local?.cuentaCompartidaActiva ?? false
  });
}

// ─── Contexto ───────────────────────────────────────────────────────
const PedidoActivoContext = createContext(null);

export function PedidoActivoProvider({ children }) {
  const { pedidoId } = usePedido();
  const { mesaId, restauranteId, bloquearMesaHastaNuevoQr } = useMesa();

  // Hydratación instantánea desde localStorage — sin parpadeo en UI
  const [pedido, setPedido] = useState(() => hydratarDesdeLocal(pedidoId));
  const [conectado, setConectado] = useState(false);

  // El slug se lee de localStorage porque este contexto vive a nivel de app
  // (fuera del alcance de useParams). Se actualiza cuando cambia pedidoId.
  const [slugActivo, setSlugActivo] = useState(
    () => obtenerPedidoActivo()?.slug ?? null
  );

  // Refs estables para evitar dependencias en useCallback
  const estadoRef = useRef(pedido?.estado ?? null);
  const slugRef = useRef(slugActivo);

  useEffect(() => {
    estadoRef.current = pedido?.estado ?? null;
  }, [pedido?.estado]);

  useEffect(() => {
    slugRef.current = slugActivo;
  }, [slugActivo]);

  useEffect(() => {
    prepararHapticaPedido();
    listenPushMessages();
  }, []);

  useEffect(() => {
    if (!pedidoId || !restauranteId) return undefined;

    let cancelado = false;
    let registrado = false;
    let registroEnCurso = false;

    const registrar = () => {
      if (cancelado || registrado || registroEnCurso) return;
      registroEnCurso = true;
      registerPushNotifications({
        pedidoId,
        restauranteId
      })
        .then((subscription) => {
          if (subscription) registrado = true;
        })
        .finally(() => {
          registroEnCurso = false;
        });
    };

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      registrar();
      return undefined;
    }

    const intentoInmediatoId = window.setTimeout(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        registrar();
      }
    }, 800);

    const eventos = ['pointerdown', 'touchstart', 'click'];
    eventos.forEach((eventName) => window.addEventListener(eventName, registrar, {
      once: true,
      passive: true,
      capture: true
    }));

    return () => {
      cancelado = true;
      window.clearTimeout(intentoInmediatoId);
      eventos.forEach((eventName) => window.removeEventListener(eventName, registrar, {
        capture: true
      }));
    };
  }, [pedidoId, restauranteId]);

  // Cuando cambia pedidoId (nuevo pedido creado), re-leer slug y estado del localStorage
  useEffect(() => {
    const local = obtenerPedidoActivo();
    setSlugActivo(local?.slug ?? null);
    slugRef.current = local?.slug ?? null;
    // Re-hydratar con el nuevo pedido
    setPedido(hydratarDesdeLocal(pedidoId));
  }, [pedidoId]);

  // ── Función de refresco (polling + mount) ──────────────────────────
  const refrescar = useCallback(async () => {
    const pid = pedidoId;
    const slug = slugRef.current;
    if (!pid || !slug) return;
    if (ESTADOS_TERMINALES.has(estadoRef.current)) return;

    try {
      const data = await obtenerEstadoPedidoPublico(slug, pid);
      if (!data) return;
      const estadoAnterior = estadoRef.current;
      setPedido((prev) => ({ ...(prev ?? {}), ...data }));
      persistirActualizacion(data, pid, restauranteId);
      vibrarCambioEstadoPedido({
        pedidoId: pid,
        estadoAnterior,
        estadoNuevo: data.estado,
        fuente: 'polling'
      });
      estadoRef.current = data.estado ?? estadoRef.current;
      if (data.estado === 'entregado') {
        bloquearMesaHastaNuevoQr('pedido_entregado');
      }
    } catch {
      // Silencioso — el socket es el canal primario
    }
  }, [bloquearMesaHastaNuevoQr, pedidoId, restauranteId]);

  // ── Socket.IO + polling ────────────────────────────────────────────
  useEffect(() => {
    if (!pedidoId) {
      setPedido(null);
      setConectado(false);
      return undefined;
    }

    // Fetch inicial inmediato (burst a 200ms para hidratación rápida)
    const burstId = window.setTimeout(refrescar, 200);

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 4000,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000
    });

    const unirse = () => {
      const local = obtenerPedidoActivo();
      const restauranteSalaId = restauranteId ?? local?.restauranteId ?? null;
      const mesaSalaId = mesaId ?? local?.mesaId ?? null;

      setConectado(true);
      socket.emit('pedido:unirse', { pedidoId, restauranteId: restauranteSalaId });
      if (mesaSalaId && restauranteSalaId) {
        socket.emit('mesa:join', { mesaId: mesaSalaId, restauranteId: restauranteSalaId });
      }
    };

    socket.on('connect', unirse);
    socket.io.on('reconnect', unirse);
    socket.on('pedido:unido', refrescar);
    socket.on('mesa:unida', refrescar);
    socket.on('disconnect', () => setConectado(false));
    socket.on('connect_error', () => setConectado(false));

    socket.on('pedido:actualizado', (payload) => {
      const siguiente = payload?.pedido ?? payload;
      if (!siguiente?.id || String(siguiente.id) !== String(pedidoId)) return;
      // Defensa en profundidad: ignorar si el evento viene de otro restaurante
      if (restauranteId && siguiente.restauranteId &&
          Number(siguiente.restauranteId) !== Number(restauranteId)) return;

      const estadoAnterior = estadoRef.current;
      setPedido((prev) => ({
        ...(prev ?? {}),
        ...siguiente,
        displayCall: ESTADOS_TERMINALES.has(siguiente.estado)
          ? null
          : (prev?.displayCall ?? null)
      }));
      persistirActualizacion(siguiente, pedidoId, restauranteId);
      vibrarCambioEstadoPedido({
        pedidoId,
        estadoAnterior,
        estadoNuevo: siguiente.estado,
        fuente: 'socket'
      });
      estadoRef.current = siguiente.estado ?? estadoRef.current;
      if (siguiente.estado === 'entregado') {
        bloquearMesaHastaNuevoQr('pedido_entregado');
      }
    });

    socket.on('pedido:llamado', (payload) => {
      if (!payload?.pedidoId || String(payload.pedidoId) !== String(pedidoId)) return;
      if (restauranteId && payload.restauranteId &&
          Number(payload.restauranteId) !== Number(restauranteId)) return;
      vibrarLlamadoPedido({
        pedidoId,
        eventId: payload.eventId,
        payload
      });
      setPedido((prev) => ({
        ...(prev ?? {}),
        displayCall: { ...payload, active: true }
      }));
    });

    socket.on('pedido:llamado:limpiar', (payload) => {
      if (!payload?.pedidoId || String(payload.pedidoId) !== String(pedidoId)) return;
      if (restauranteId && payload.restauranteId &&
          Number(payload.restauranteId) !== Number(restauranteId)) return;
      setPedido((prev) => ({ ...(prev ?? {}), displayCall: null }));
    });

    // Polling de respaldo cada 10 s (el socket es el canal principal)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (ESTADOS_TERMINALES.has(estadoRef.current)) return;
      refrescar();
    }, 10_000);

    // Sincronización al volver a la tab / foco
    const onVisible = () => {
      if (document.visibilityState === 'visible') refrescar();
    };
    const onFocus = () => refrescar();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearTimeout(burstId);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      socket.io.off('reconnect', unirse);
      socket.disconnect();
      setConectado(false);
    };
  }, [pedidoId, mesaId, restauranteId, refrescar]);

  return (
    <PedidoActivoContext.Provider value={{ pedido, conectado, refrescar }}>
      {children}
    </PedidoActivoContext.Provider>
  );
}

export function usePedidoActivo() {
  const ctx = useContext(PedidoActivoContext);
  if (!ctx) {
    throw new Error('usePedidoActivo debe usarse dentro de <PedidoActivoProvider>');
  }
  return ctx;
}
