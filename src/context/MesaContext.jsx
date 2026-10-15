import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  guardarSesionMesaQr,
  limpiarSesionMesaQr,
  obtenerSesionMesaQr,
  requerirReescaneoMesaQr as persistirReescaneoMesaQr
} from '../utils/mesaQrSesion';

const MesaContext = createContext(null);

function buildInitialState() {
  const sesion = obtenerSesionMesaQr();

  return {
    mesaId: sesion?.mesaId ?? null,
    numeroMesa: sesion?.numeroMesa ?? null,
    restauranteId: sesion?.restauranteId ?? null,
    mesaCuentaNumero: sesion?.mesaCuentaNumero ?? null,
    cuentaCompartidaActiva: Boolean(sesion?.cuentaCompartidaActiva),
    grupoMesas: Array.isArray(sesion?.grupoMesas) ? sesion.grupoMesas : [],
    mesaSesionToken: sesion?.token ?? null,
    requiereReescaneoQr: Boolean(sesion?.requiereReescaneo),
    motivoBloqueoQr: sesion?.motivoBloqueo ?? null,
    slugMesaQr: sesion?.slug ?? null
  };
}

export function MesaProvider({ children }) {
  const initialState = buildInitialState();

  const [mesaId, setMesaId] = useState(initialState.mesaId);
  const [numeroMesa, setNumeroMesa] = useState(initialState.numeroMesa);
  const [restauranteId, setRestauranteId] = useState(initialState.restauranteId);
  const [mesaCuentaNumero, setMesaCuentaNumero] = useState(initialState.mesaCuentaNumero);
  const [cuentaCompartidaActiva, setCuentaCompartidaActiva] = useState(initialState.cuentaCompartidaActiva);
  const [grupoMesas, setGrupoMesas] = useState(initialState.grupoMesas);
  const [mesaSesionToken, setMesaSesionToken] = useState(initialState.mesaSesionToken);
  const [requiereReescaneoQr, setRequiereReescaneoQr] = useState(initialState.requiereReescaneoQr);
  const [motivoBloqueoQr, setMotivoBloqueoQr] = useState(initialState.motivoBloqueoQr);
  const [slugMesaQr, setSlugMesaQr] = useState(initialState.slugMesaQr);

  useEffect(() => {
    const hayContextoMesa = Boolean(
      mesaId ||
      numeroMesa ||
      restauranteId ||
      mesaCuentaNumero ||
      cuentaCompartidaActiva ||
      grupoMesas.length ||
      mesaSesionToken ||
      requiereReescaneoQr ||
      slugMesaQr
    );

    if (!hayContextoMesa) {
      limpiarSesionMesaQr();
      return;
    }

    guardarSesionMesaQr({
      slug: slugMesaQr,
      numeroMesa,
      mesaId,
      restauranteId,
      mesaCuentaNumero,
      cuentaCompartidaActiva,
      grupoMesas,
      token: mesaSesionToken,
      requiereReescaneo: requiereReescaneoQr,
      motivoBloqueo: motivoBloqueoQr
    });
  }, [
    cuentaCompartidaActiva,
    grupoMesas,
    mesaCuentaNumero,
    mesaId,
    mesaSesionToken,
    motivoBloqueoQr,
    numeroMesa,
    requiereReescaneoQr,
    restauranteId,
    slugMesaQr
  ]);

  const hidratarMesaQr = useCallback((payload = {}) => {
    setMesaId(payload.mesaId ?? null);
    setNumeroMesa(payload.numeroMesa ?? null);
    setRestauranteId(payload.restauranteId ?? null);
    setMesaCuentaNumero(payload.mesaCuentaNumero ?? null);
    setCuentaCompartidaActiva(Boolean(payload.cuentaCompartidaActiva));
    setGrupoMesas(Array.isArray(payload.grupoMesas) ? payload.grupoMesas : []);
    setMesaSesionToken(payload.mesaSesionToken ?? null);
    setRequiereReescaneoQr(Boolean(payload.requiereReescaneoQr));
    setMotivoBloqueoQr(payload.motivoBloqueoQr ?? null);
    setSlugMesaQr(payload.slug ?? null);
  }, []);

  const bloquearMesaHastaNuevoQr = useCallback((motivoBloqueo = 'pedido_entregado') => {
    if (!numeroMesa && !mesaId && !slugMesaQr) return;

    setMesaSesionToken(null);
    setRequiereReescaneoQr(true);
    setMotivoBloqueoQr(motivoBloqueo);
    persistirReescaneoMesaQr(motivoBloqueo);
  }, [mesaId, numeroMesa, slugMesaQr]);

  const limpiarMesaQr = useCallback(() => {
    setMesaId(null);
    setNumeroMesa(null);
    setRestauranteId(null);
    setMesaCuentaNumero(null);
    setCuentaCompartidaActiva(false);
    setGrupoMesas([]);
    setMesaSesionToken(null);
    setRequiereReescaneoQr(false);
    setMotivoBloqueoQr(null);
    setSlugMesaQr(null);
    limpiarSesionMesaQr();
  }, []);

  return (
    <MesaContext.Provider
      value={{
        mesaId,
        setMesaId,
        numeroMesa,
        setNumeroMesa,
        restauranteId,
        setRestauranteId,
        mesaCuentaNumero,
        setMesaCuentaNumero,
        cuentaCompartidaActiva,
        setCuentaCompartidaActiva,
        grupoMesas,
        setGrupoMesas,
        mesaSesionToken,
        setMesaSesionToken,
        requiereReescaneoQr,
        setRequiereReescaneoQr,
        motivoBloqueoQr,
        setMotivoBloqueoQr,
        slugMesaQr,
        setSlugMesaQr,
        hidratarMesaQr,
        bloquearMesaHastaNuevoQr,
        limpiarMesaQr
      }}
    >
      {children}
    </MesaContext.Provider>
  );
}

export function useMesa() {
  const ctx = useContext(MesaContext);
  if (!ctx) {
    throw new Error('useMesa debe usarse dentro de MesaProvider');
  }
  return ctx;
}
