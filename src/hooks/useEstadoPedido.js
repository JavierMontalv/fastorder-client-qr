import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/env';
import { useMesa } from '../context/MesaContext';
import { obtenerEstadoPedido, obtenerEstadoPedidoPublico } from '../services/pedidosService';
import { actualizarEstadoPedido, actualizarPedidoActivo, obtenerPedidoActivo } from '../utils/bloqueoPedido';
import {
  vibrarCambioEstadoPedido,
  vibrarLlamadoPedido
} from '../utils/pedidoHaptics';

export default function useEstadoPedido(pedidoId, { slug, mesaId, restauranteId } = {}) {
  const { bloquearMesaHastaNuevoQr } = useMesa();
  const estadoActualRef = useRef(null);
  const [pedido, setPedido] = useState(() => {
    if (!pedidoId) return null;
    const pedidoLocal = obtenerPedidoActivo();
    if (!pedidoLocal || String(pedidoLocal.pedidoId) !== String(pedidoId)) return null;

    return {
      id: pedidoLocal.pedidoId,
      estado: pedidoLocal.estado,
      estadoPago: pedidoLocal.estadoPago,
      tipoPedido: pedidoLocal.tipoPedido,
      metodoPago: pedidoLocal.metodoPago,
      tiempoPreparacion: pedidoLocal.tiempoPreparacion,
      total: pedidoLocal.total,
      updatedAt: pedidoLocal.updatedAt,
      mesa: pedidoLocal.numeroMesa ? { numero: pedidoLocal.numeroMesa } : null,
      displayCall: null
    };
  });

  useEffect(() => {
    estadoActualRef.current = pedido?.estado || null;
  }, [pedido?.estado]);

  useEffect(() => {
    if (!pedidoId) return undefined;

    let activo = true;

    const cargarEstado = async () => {
      const data = slug
        ? await obtenerEstadoPedidoPublico(slug, pedidoId)
        : await obtenerEstadoPedido(pedidoId);
      if (!activo || !data) return;
      const pedidoLocal = obtenerPedidoActivo();
      const numeroMesaPersistida = pedidoLocal?.numeroMesa ?? data?.mesa?.numero ?? null;
      setPedido(data);
      actualizarEstadoPedido(data.estado);
      actualizarPedidoActivo({
        pedidoId: data.id || pedidoId,
        restauranteId: restauranteId ?? pedidoLocal?.restauranteId ?? data?.restauranteId ?? null,
        mesaId: data.mesaId ?? data?.mesa?.id ?? pedidoLocal?.mesaId ?? null,
        estado: data.estado,
        estadoPago: data.estadoPago,
        tipoPedido: data.tipoPedido ?? null,
        metodoPago: data.metodoPago ?? null,
        tiempoPreparacion: data.tiempoPreparacion ?? null,
        total: data.total ?? null,
        updatedAt: data.updatedAt ?? null,
        slug: slug ?? null,
        numeroMesa: numeroMesaPersistida,
        numeroMesaCuenta: data?.mesa?.numero ?? pedidoLocal?.numeroMesaCuenta ?? null,
        cuentaCompartidaActiva:
          pedidoLocal?.cuentaCompartidaActiva ?? Boolean(data?.mesa?.numero && numeroMesaPersistida && String(data.mesa.numero) !== String(numeroMesaPersistida))
      });
      if (data.estado === 'entregado') {
        bloquearMesaHastaNuevoQr('pedido_entregado');
      }
    };

    cargarEstado().catch(() => {});

    return () => {
      activo = false;
    };
  }, [bloquearMesaHastaNuevoQr, pedidoId, restauranteId, slug]);

  useEffect(() => {
    if (!pedidoId) return undefined;

    let activo = true;

    const refrescarEstado = async () => {
      try {
        const data = slug
          ? await obtenerEstadoPedidoPublico(slug, pedidoId)
          : await obtenerEstadoPedido(pedidoId);

        if (!activo || !data) return;
        const pedidoLocal = obtenerPedidoActivo();
        const numeroMesaPersistida = pedidoLocal?.numeroMesa ?? data?.mesa?.numero ?? null;
        const estadoAnterior = estadoActualRef.current;

        setPedido((prev) => ({
          ...(prev || {}),
          ...data
        }));
        actualizarEstadoPedido(data.estado);
        actualizarPedidoActivo({
          pedidoId: data.id || pedidoId,
          restauranteId: restauranteId ?? pedidoLocal?.restauranteId ?? data?.restauranteId ?? null,
          mesaId: data.mesaId ?? data?.mesa?.id ?? pedidoLocal?.mesaId ?? null,
          estado: data.estado,
          estadoPago: data.estadoPago,
          tipoPedido: data.tipoPedido ?? null,
          metodoPago: data.metodoPago ?? null,
          tiempoPreparacion: data.tiempoPreparacion ?? null,
          total: data.total ?? null,
          updatedAt: data.updatedAt ?? null,
          slug: slug ?? null,
          numeroMesa: numeroMesaPersistida,
          numeroMesaCuenta: data?.mesa?.numero ?? pedidoLocal?.numeroMesaCuenta ?? null,
          cuentaCompartidaActiva:
          pedidoLocal?.cuentaCompartidaActiva ?? Boolean(data?.mesa?.numero && numeroMesaPersistida && String(data.mesa.numero) !== String(numeroMesaPersistida))
        });
        vibrarCambioEstadoPedido({
          pedidoId,
          estadoAnterior,
          estadoNuevo: data.estado,
          fuente: 'legacy-polling'
        });
        estadoActualRef.current = data.estado ?? estadoActualRef.current;
        if (data.estado === 'entregado') {
          bloquearMesaHastaNuevoQr('pedido_entregado');
        }
      } catch {
        // El polling es respaldo; el socket mantiene el canal principal.
      }
    };

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 8000,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000
    });

    const unirseASala = () => {
      const pedidoLocal = obtenerPedidoActivo();
      const restauranteSalaId = restauranteId ?? pedidoLocal?.restauranteId ?? null;
      const mesaSalaId = mesaId ?? pedidoLocal?.mesaId ?? null;

      socket.emit('pedido:unirse', {
        pedidoId,
        restauranteId: restauranteSalaId
      });
      if (mesaSalaId && restauranteSalaId) {
        socket.emit('mesa:join', {
          mesaId: mesaSalaId,
          restauranteId: restauranteSalaId
        });
      }
      refrescarEstado();
    };

    socket.on('connect', unirseASala);
    socket.io.on('reconnect', unirseASala);
    socket.on('pedido:unido', refrescarEstado);
    socket.on('mesa:unida', refrescarEstado);

    socket.on('pedido:actualizado', (payload) => {
      const siguientePedido = payload?.pedido || payload;
      if (!siguientePedido?.id || String(siguientePedido.id) !== String(pedidoId)) return;

      const estadoAnterior = estadoActualRef.current;
      setPedido((prev) => ({
        ...(prev || {}),
        ...siguientePedido,
        displayCall:
          ['entregado', 'cancelado'].includes(siguientePedido.estado)
            ? null
            : (prev?.displayCall || null)
      }));
      const pedidoLocal = obtenerPedidoActivo();
      const numeroMesaPersistida = pedidoLocal?.numeroMesa ?? siguientePedido?.mesa?.numero ?? null;
      actualizarEstadoPedido(siguientePedido.estado);
      actualizarPedidoActivo({
          pedidoId: siguientePedido.id || pedidoId,
          restauranteId: restauranteId ?? pedidoLocal?.restauranteId ?? siguientePedido?.restauranteId ?? null,
          mesaId: siguientePedido.mesaId ?? siguientePedido?.mesa?.id ?? pedidoLocal?.mesaId ?? null,
          estado: siguientePedido.estado,
        estadoPago: siguientePedido.estadoPago,
        tipoPedido: siguientePedido.tipoPedido ?? null,
        metodoPago: siguientePedido.metodoPago ?? null,
        tiempoPreparacion: siguientePedido.tiempoPreparacion ?? null,
        total: siguientePedido.total ?? null,
        updatedAt: siguientePedido.updatedAt ?? null,
        slug: slug ?? null,
        numeroMesa: numeroMesaPersistida,
        numeroMesaCuenta: siguientePedido?.mesa?.numero ?? pedidoLocal?.numeroMesaCuenta ?? null,
        cuentaCompartidaActiva:
          pedidoLocal?.cuentaCompartidaActiva ?? Boolean(siguientePedido?.mesa?.numero && numeroMesaPersistida && String(siguientePedido.mesa.numero) !== String(numeroMesaPersistida))
      });
      vibrarCambioEstadoPedido({
        pedidoId,
        estadoAnterior,
        estadoNuevo: siguientePedido.estado,
        fuente: 'legacy-socket'
      });
      estadoActualRef.current = siguientePedido.estado ?? estadoActualRef.current;
      if (siguientePedido.estado === 'entregado') {
        bloquearMesaHastaNuevoQr('pedido_entregado');
      }
    });

    socket.on('pedido:llamado', (payload) => {
      if (!payload?.pedidoId || String(payload.pedidoId) !== String(pedidoId)) return;

      vibrarLlamadoPedido({
        pedidoId,
        eventId: payload.eventId,
        payload
      });
      setPedido((prev) => ({
        ...(prev || {}),
        displayCall: {
          ...payload,
          active: true
        }
      }));
    });

    socket.on('pedido:llamado:limpiar', (payload) => {
      if (!payload?.pedidoId || String(payload.pedidoId) !== String(pedidoId)) return;

      setPedido((prev) => ({
        ...(prev || {}),
        displayCall: null
      }));
    });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (['entregado', 'cancelado'].includes(estadoActualRef.current)) return;
      refrescarEstado();
    }, 6000);

    const burstTimeoutId = window.setTimeout(() => {
      refrescarEstado();
    }, 1200);

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        refrescarEstado();
      }
    };

    const handleWindowFocus = () => {
      refrescarEstado();
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      activo = false;
      window.clearInterval(intervalId);
      window.clearTimeout(burstTimeoutId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      socket.io.off('reconnect', unirseASala);
      socket.disconnect();
    };
  }, [bloquearMesaHastaNuevoQr, mesaId, pedidoId, restauranteId, slug]);

  return pedido;
}
