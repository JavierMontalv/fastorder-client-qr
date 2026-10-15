import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Info, Share2, X } from 'lucide-react';

import { buildAssetUrl } from '../../config/env';
import { useCarrito } from '../../context/CarritoContext';
import { useMesa } from '../../context/MesaContext';
import { obtenerOpcionesProducto } from '../../services/productoService';
import ProductoConfiguracionAcompanantes from './ProductoConfiguracionAcompanantes';
import ProductoConfiguracionFooter from './ProductoConfiguracionFooter';
import ProductoConfiguracionInstrucciones from './ProductoConfiguracionInstrucciones';
import '../../styles/BottomSheets.css';
import '../../styles/ProductoConfiguracionSheet.css';

function resolveProductoImg(imagenUrl) {
  if (!imagenUrl) return null;
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl.replace(/^http:\/\//i, 'https://');
  const path = imagenUrl.includes('/') ? imagenUrl : `/uploads/productos/${imagenUrl}`;
  return buildAssetUrl(path);
}

function formatCurrency(value) {
  return `$${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(Number(value || 0))}`;
}

function obtenerModificacionesSeleccionadas(gruposOpciones, opcionesSeleccionadas) {
  return (gruposOpciones || [])
    .map((grupo) => {
      const opciones = Array.isArray(opcionesSeleccionadas?.[grupo.id]) ? opcionesSeleccionadas[grupo.id] : [];
      if (!opciones.length) return null;

      return {
        grupoId: grupo.id,
        nombre: grupo.nombre,
        opciones: opciones.map((opcion) => ({
          id: opcion.id,
          opcionId: opcion.id,
          nombre: opcion.nombre,
          precioExtra: Number(opcion.precioExtra || 0),
          tipo: opcion.tipo || 'opcion'
        }))
      };
    })
    .filter(Boolean);
}

function obtenerGruposPendientes(gruposOpciones, opcionesSeleccionadas) {
  return (gruposOpciones || []).filter((grupo) => {
    const seleccionadas = Array.isArray(opcionesSeleccionadas?.[grupo.id]) ? opcionesSeleccionadas[grupo.id] : [];
    const minSeleccion = Number(grupo.minSeleccion || 0);
    const requeridas = Boolean(grupo.obligatorio) || minSeleccion > 0;

    if (!requeridas) return false;
    return seleccionadas.length < Math.max(minSeleccion, 1);
  });
}

function getProductMonogram(nombre = '') {
  return nombre
    .split(' ')
    .map((parte) => parte.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProductoConfiguracionSheet({ producto, sugerenciaUpsell = null, onClose }) {
  const { agregarProducto } = useCarrito();
  const { restauranteId } = useMesa();
  const MotionDiv = motion.div;
  const [gruposOpciones, setGruposOpciones] = useState([]);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState({});
  const [instrucciones, setInstrucciones] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [configuracionFallback, setConfiguracionFallback] = useState(false);
  const [imagenError, setImagenError] = useState(false);
  const [upsellAgregado, setUpsellAgregado] = useState(false);
  const [headerCompacto, setHeaderCompacto] = useState(false);

  useEffect(() => {
    setImagenError(false);
    setSubmitError('');
    setUpsellAgregado(false);
  }, [producto.id, producto.imagenUrl, sugerenciaUpsell?.id]);

  useEffect(() => {
    let activo = true;

    async function cargarConfiguracion() {
      try {
        setLoading(true);
        setError('');
        setSubmitError('');
        setConfiguracionFallback(false);
        const data = await obtenerOpcionesProducto(producto.id, restauranteId);
        if (!activo) return;
        setGruposOpciones(Array.isArray(data?.gruposOpciones) ? data.gruposOpciones : []);
      } catch (requestError) {
        if (!activo) return;
        setGruposOpciones([]);

        const serverMessage = requestError?.response?.data?.message || requestError?.message || '';
        const isConnectivityIssue = Boolean(requestError?.offline) || /servidor no disponible/i.test(serverMessage);

        if (isConnectivityIssue) {
          setConfiguracionFallback(true);
          setError('');
        } else {
          setConfiguracionFallback(true);
          setError('');
        }
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargarConfiguracion();

    return () => {
      activo = false;
    };
  }, [producto.id, restauranteId]);

  const modificaciones = useMemo(
    () => obtenerModificacionesSeleccionadas(gruposOpciones, opcionesSeleccionadas),
    [gruposOpciones, opcionesSeleccionadas]
  );

  const totalExtras = useMemo(
    () =>
      modificaciones.reduce(
        (acc, grupo) =>
          acc +
          (grupo.opciones || []).reduce(
            (grupoAcc, opcion) => grupoAcc + Number(opcion.precioExtra || 0),
            0
          ),
        0
      ),
    [modificaciones]
  );

  const precioBase = Number(producto.precio || 0);
  const precioAnterior = Number(
    producto.precioAnterior || producto.precioOriginal || producto.precioRegular || 0
  );
  const descuento =
    precioAnterior > precioBase
      ? Math.round(((precioAnterior - precioBase) / precioAnterior) * 100)
      : 0;
  const precioUnitario = precioBase + totalExtras;
  const precioTotal = precioUnitario * cantidad;
  const gruposPendientes = obtenerGruposPendientes(gruposOpciones, opcionesSeleccionadas);
  const puedeConfirmar = !loading && gruposPendientes.length === 0;
  const imagenProducto = resolveProductoImg(producto.imagenUrl);
  const mostrarImagen = Boolean(imagenProducto) && !imagenError;
  const monograma = getProductMonogram(producto.nombre || 'PR');
  const productoUpsell = sugerenciaUpsell?.productoSugerido || null;
  const alergenosProducto = producto?.plato?.alergenos || producto?.alergenos || '';

  const agregarUpsell = () => {
    if (!productoUpsell || upsellAgregado) return;

    const agregado = agregarProducto({
      ...productoUpsell,
      cantidad: 1,
      instrucciones: '',
      modificaciones: [],
      extras: [],
      precioUnitario: Number(productoUpsell.precio || 0),
      precioFinal: Number(productoUpsell.precio || 0)
    });

    if (agregado) {
      setUpsellAgregado(true);
    }
  };

  const confirmar = () => {
    if (!puedeConfirmar) return;

    setSubmitError('');

    const agregado = agregarProducto({
      ...producto,
      cantidad,
      imagenUrl: imagenProducto,
      instrucciones,
      modificaciones,
      extras: [],
      precioUnitario,
      precioFinal: precioUnitario
    });

    if (!agregado) {
      setSubmitError('No fue posible agregar este producto al carrito. Intenta nuevamente.');
      return;
    }

    onClose?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fo-bottomsheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <MotionDiv
        className={`fo-bottomsheet snap-full ${headerCompacto ? 'is-scrolled' : ''}`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300, mass: 0.82 }}
      >
        <div
          className="fo-bottomsheet-content producto-configuracion"
          onScroll={(event) => {
            const contenido = event.currentTarget;
            if (contenido.scrollLeft !== 0) contenido.scrollLeft = 0;
            setHeaderCompacto(contenido.scrollTop > 320);
          }}
        >
          <div className="producto-config-layout premium">
            <div className="producto-config-stickybar">
              <button type="button" className="producto-config-sticky-button" onClick={onClose} aria-label="Cerrar">
                <X aria-hidden="true" />
              </button>
              <strong>{producto.nombre}</strong>
              <div className="producto-config-sticky-actions">
                <button type="button" className="producto-config-sticky-button" aria-label="Compartir producto">
                  <Share2 aria-hidden="true" />
                </button>
                <button type="button" className="producto-config-sticky-button" aria-label="Guardar producto">
                  <Bookmark aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="producto-config-imagen premium">
              {mostrarImagen ? (
                <img
                  src={imagenProducto}
                  alt={producto.nombre}
                  onError={() => {
                    setImagenError(true);
                  }}
                />
              ) : (
                <div className="producto-config-image-fallback" aria-hidden="true">
                  <span className="producto-config-image-fallback-badge">{monograma}</span>
                  <div className="producto-config-image-fallback-copy">
                    <strong>{producto.nombre}</strong>
                    <span>Imagen no disponible por ahora</span>
                  </div>
                </div>
              )}

              <div className="producto-config-topbar">
                <button type="button" className="producto-config-topbar-button" onClick={onClose} aria-label="Cerrar">
                  <X aria-hidden="true" />
                </button>
                <div className="producto-config-topbar-actions">
                  <button type="button" className="producto-config-topbar-button" aria-label="Compartir producto">
                    <Share2 aria-hidden="true" />
                  </button>
                  <button type="button" className="producto-config-topbar-button" aria-label="Guardar producto">
                    <Bookmark aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="producto-config-body premium">
              <div className="producto-config-summary">
                <div className="producto-config-header premium">
                  <div>
                    <div className="producto-config-price-line">
                      <span className="precio">{formatCurrency(precioTotal)}</span>
                      {descuento > 0 ? (
                        <span className="producto-config-discount">-{descuento}%</span>
                      ) : null}
                      {descuento > 0 ? (
                        <span className="producto-config-old-price">{formatCurrency(precioAnterior)}</span>
                      ) : null}
                    </div>
                    {descuento > 0 ? (
                      <div className="producto-config-discount-note">
                        <Info aria-hidden="true" />
                        <span>El descuento no aplica sobre ingredientes con costo adicional</span>
                      </div>
                    ) : null}
                    <h3>{producto.nombre}</h3>
                    <p className="producto-config-summary-copy">
                      {producto.descripcion?.trim() ||
                        (gruposOpciones.length
                          ? 'Elige tus opciones y personaliza este producto.'
                          : 'Producto listo para agregar a tu pedido.')}
                    </p>
                    {alergenosProducto ? (
                      <div className="producto-config-allergen-note">
                        <Info aria-hidden="true" />
                        <div>
                          <strong>Informacion de alergenos</strong>
                          <span>
                            Puede contener: {alergenosProducto}. Si tienes una restriccion alimentaria,
                            confirma con el equipo antes de finalizar.
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {productoUpsell ? (
                  <div className="producto-config-upsell">
                    <div className="producto-config-upsell-copy">
                      <span className="producto-config-upsell-kicker">
                        {sugerenciaUpsell?.label || 'Sugerencia inteligente'}
                      </span>
                      <strong>{sugerenciaUpsell?.title || `Combina con ${productoUpsell.nombre}`}</strong>
                      <p>
                        {sugerenciaUpsell?.description ||
                          `Agregar ${productoUpsell.nombre} puede ayudar a completar la compra con mejor ticket.`}
                      </p>
                    </div>

                    <div className="producto-config-upsell-card">
                      <div>
                        <span>{productoUpsell.nombre}</span>
                        <strong>{formatCurrency(productoUpsell.precio)}</strong>
                      </div>
                      <button type="button" onClick={agregarUpsell} disabled={upsellAgregado}>
                        {upsellAgregado ? 'Agregado' : sugerenciaUpsell?.ctaLabel || 'Agregar tambien'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {loading && <p className="loading">Preparando configuracion del producto...</p>}
              {!loading && error ? <div className="producto-config-alert">{error}</div> : null}

              {!loading && configuracionFallback && !error ? (
                <div className="producto-config-alert subtle">
                  Personalizacion no disponible en este momento. Puedes agregar el producto base y usar instrucciones especiales si lo necesitas.
                </div>
              ) : null}

              {!loading && !error && gruposOpciones.length > 0 ? (
                <ProductoConfiguracionAcompanantes
                  gruposOpciones={gruposOpciones}
                  opcionesSeleccionadas={opcionesSeleccionadas}
                  onChange={setOpcionesSeleccionadas}
                />
              ) : null}

              <ProductoConfiguracionInstrucciones value={instrucciones} onChange={setInstrucciones} />

              {gruposPendientes.length > 0 ? (
                <div className="producto-config-alert warning">
                  Completa estos pasos antes de agregar: {gruposPendientes.map((grupo) => grupo.nombre).join(', ')}.
                </div>
              ) : null}

              {submitError ? <div className="producto-config-alert">{submitError}</div> : null}

              <ProductoConfiguracionFooter
                onConfirmar={confirmar}
                disabled={!puedeConfirmar}
                actionLabel="Agregar"
                priceLabel={formatCurrency(precioTotal)}
                cantidad={cantidad}
                onDecrease={() => setCantidad((prev) => Math.max(1, prev - 1))}
                onIncrease={() => setCantidad((prev) => Math.min(12, prev + 1))}
              />
            </div>
          </div>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
