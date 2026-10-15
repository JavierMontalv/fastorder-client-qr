import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Banknote, ChevronRight, Clock3, Crown, MapPin, Minus, Plus, ReceiptText, Trash2, Utensils } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildAssetUrl } from '../../config/env';
import { useCarrito } from '../../context/CarritoContext';
import { useMesa } from '../../context/MesaContext';
import { usePedido } from '../../context/PedidoContext';
import { obtenerMesaPublica } from '../../services/publicApi';
import '../../styles/BottomSheets.css';
import '../../styles/ResumenPedido.css';
import { guardarPedidoActivo } from '../../utils/bloqueoPedido';
import formatearPrecio from '../../utils/formatearPrecio';
import { PASOS_PEDIDO, validarPedido } from '../../utils/validarPedido';

function resolveProductoImg(imagenUrl) {
  if (!imagenUrl) return null;
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl.replace(/^http:\/\//i, 'https://');
  const path = imagenUrl.includes('/') ? imagenUrl : `/uploads/productos/${imagenUrl}`;
  return buildAssetUrl(path);
}

function formatDiscount(item) {
  const precioBase = Number(item?.precio || 0);
  const precioUnitario = Number(item?.precioUnitario || precioBase);
  if (!precioBase || !precioUnitario || precioUnitario >= precioBase) return null;
  return `-${Math.round((1 - precioUnitario / precioBase) * 100)}%`;
}

const PAYMENT_METHODS = Object.freeze([
  {
    id: 'efectivo',
    label: 'Efectivo',
    title: 'Pagar en efectivo',
    description: 'Paga directamente en caja o al personal cuando el restaurante confirme tu pedido.',
    enabled: true
  },
  {
    id: 'pse',
    label: 'PSE',
    title: 'Pagar con PSE',
    description: 'Listo para activar cuando conectemos el recaudo bancario.',
    enabled: false
  }
]);

export default function CompletarPedidoSheet({
  onClose,
  onCrearPedido,
  pedidoInicial = null,
  slug = null,
  restaurante = null,
  complementos = []
}) {
  const {
    items,
    total,
    totalItems,
    agregarProducto,
    cambiarCantidad,
    quitarProducto,
    limpiarCarritoConfirmado
  } = useCarrito();
  const { setPedidoId } = usePedido();
  const {
    numeroMesa,
    restauranteId,
    mesaSesionToken,
    requiereReescaneoQr,
    bloquearMesaHastaNuevoQr
  } = useMesa();
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const contentRef = useRef(null);
  const [vista, setVista] = useState('canasta');

  const estadoBase = {
    tipoPedido: null,
    mesaId: null,
    numeroMesa: null,
    mesaCuentaNumero: null,
    cuentaCompartidaActiva: false,
    grupoMesas: [],
    clienteNombre: '',
    direccion: null,
    metodoPago: null
  };

  const pedidoInicialNormalizado = { ...estadoBase, ...(pedidoInicial || {}) };
  const mesaDetectadaEnQr = Boolean(
    pedidoInicialNormalizado.tipoPedido === 'mesa' && pedidoInicialNormalizado.numeroMesa
  );

  const [pedido, setPedido] = useState({
    ...pedidoInicialNormalizado,
    clienteNombre:
      pedidoInicialNormalizado.clienteNombre ||
      (pedidoInicialNormalizado.numeroMesa ? `Mesa ${pedidoInicialNormalizado.numeroMesa}` : 'Invitado'),
    metodoPago: pedidoInicialNormalizado.metodoPago || PAYMENT_METHODS[0].id
  });
  const [pedidoCreado, setPedidoCreado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resolviendoMesaQr, setResolviendoMesaQr] = useState(
    mesaDetectadaEnQr && !pedidoInicialNormalizado.mesaId
  );
  const productosComplemento = useMemo(
    () =>
      complementos
        .filter((producto) => !items.some((item) => Number(item.id) === Number(producto.id)))
        .slice(0, 8),
    [complementos, items]
  );
  const restauranteNombre = restaurante?.nombre || 'Tu pedido';
  const restauranteLogo = resolveProductoImg(restaurante?.logoUrl);
  const tipoPedidoActual = pedido?.tipoPedido || pedidoInicialNormalizado.tipoPedido || 'mesa';
  const mesaVisible = pedido?.numeroMesa || numeroMesa || pedidoInicialNormalizado.numeroMesa || null;
  const servicioLabel = tipoPedidoActual === 'mesa' ? (mesaVisible ? `Mesa ${mesaVisible}` : 'En mesa') : 'Para llevar';
  const detalleServicio =
    tipoPedidoActual === 'mesa'
      ? 'Lo enviaremos directo a cocina y el equipo lo atendera en tu mesa.'
      : 'Lo prepararemos para recoger en el punto del restaurante.';

  useEffect(() => {
    if (items.length === 0 && vista !== 'confirmacion') {
      onClose?.();
    }
  }, [items.length, onClose, vista]);

  useEffect(() => {
    if (!errorEnvio || !contentRef.current) return;
    contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [errorEnvio]);

  useEffect(() => {
    if (!mesaDetectadaEnQr || pedido?.mesaId || !slug || !pedido?.numeroMesa) {
      setResolviendoMesaQr(false);
      return undefined;
    }

    let cancelado = false;

    const resolverMesaDesdeQr = async () => {
      try {
        setResolviendoMesaQr(true);
        setErrorEnvio('');

        const mesa = await obtenerMesaPublica(slug, pedido.numeroMesa);
        if (cancelado) return;

        if (!mesa?.mesaId) {
          throw new Error('No pudimos vincular la mesa asociada a este QR.');
        }

        setPedido((prev) => ({
          ...prev,
          tipoPedido: 'mesa',
          mesaId: mesa.mesaId,
          numeroMesa: mesa.numero ?? prev.numeroMesa
        }));
      } catch (error) {
        if (cancelado) return;
        setErrorEnvio(
          error?.response?.data?.message ||
            error?.message ||
            'No pudimos identificar la mesa del QR. Intenta abrir el codigo nuevamente.'
        );
      } finally {
        if (!cancelado) {
          setResolviendoMesaQr(false);
        }
      }
    };

    resolverMesaDesdeQr();

    return () => {
      cancelado = true;
    };
  }, [mesaDetectadaEnQr, pedido?.mesaId, pedido?.numeroMesa, slug]);

  if (items.length === 0) return null;

  const sesionQrActiva = pedido?.tipoPedido !== 'mesa' || Boolean(mesaSesionToken && !requiereReescaneoQr);

  const cerrar = () => onClose?.();

  const crearPedidoYDecidirPago = async ({ metodoPago }) => {
    if (pedidoCreado || enviando) {
      return { valido: false };
    }

    if (pedido?.tipoPedido === 'mesa' && !sesionQrActiva) {
      const mensaje =
        'La sesion QR de esta mesa ya no esta activa. Vuelve a escanear el codigo para continuar con un nuevo pedido.';
      setErrorEnvio(mensaje);
      bloquearMesaHastaNuevoQr?.('reescanear_qr');
      return { valido: false };
    }

    const pedidoFinal = {
      ...pedido,
      clienteNombre: String(pedido?.clienteNombre || '').trim(),
      metodoPago,
      items
    };

    const resultado = validarPedido(pedidoFinal, PASOS_PEDIDO.PAGO);
    if (!resultado.valido) {
      return resultado;
    }

    try {
      setEnviando(true);
      setErrorEnvio('');

      const pedidoCreadoBackend = await onCrearPedido(pedidoFinal);
      if (!pedidoCreadoBackend?.id) {
        throw new Error('No fue posible confirmar el pedido');
      }

      guardarPedidoActivo(pedidoCreadoBackend, {
        slug,
        restauranteId,
        mesaId: pedidoFinal.mesaId || pedidoCreadoBackend.mesaId || null,
        numeroMesa: pedidoFinal.numeroMesa || numeroMesa || null,
        numeroMesaCuenta: pedidoFinal.mesaCuentaNumero || null,
        cuentaCompartidaActiva: Boolean(pedidoFinal.cuentaCompartidaActiva),
        tipoPedido: pedidoFinal.tipoPedido || null
      });

      setPedidoId(pedidoCreadoBackend.id);
      setPedido(pedidoCreadoBackend);
      setPedidoCreado(true);
      setVista('confirmacion');
      limpiarCarritoConfirmado?.();

      return { valido: true };
    } catch (error) {
      const mensaje = error?.response?.data?.message || error?.message || 'No fue posible enviar tu pedido';
      if (
        pedido?.tipoPedido === 'mesa' &&
        (error?.response?.status === 403 ||
          /sesion qr|vuelve a escanear|codigo qr|mesa ya se cerro/i.test(mensaje))
      ) {
        bloquearMesaHastaNuevoQr?.('reescanear_qr');
      }
      setErrorEnvio(mensaje);
      return { valido: false };
    } finally {
      setEnviando(false);
    }
  };

  const asegurarContextoYContinuar = async () => {
    setErrorEnvio('');

    if (tipoPedidoActual === 'mesa') {
      if (pedido?.mesaId) {
        setVista('pago');
        return;
      }

      if (!slug || !mesaVisible) {
        setErrorEnvio('No pudimos identificar la mesa de este pedido.');
        return;
      }

      try {
        setResolviendoMesaQr(true);
        const mesa = await obtenerMesaPublica(slug, mesaVisible);
        setPedido((prev) => ({
          ...prev,
          tipoPedido: 'mesa',
          mesaId: mesa?.mesaCuentaId ?? mesa?.mesaId ?? null,
          numeroMesa: mesa?.numero ?? mesaVisible,
          mesaCuentaNumero: mesa?.mesaCuentaNumero ?? mesa?.numero ?? mesaVisible,
          cuentaCompartidaActiva: Boolean(mesa?.cuentaCompartidaActiva),
          grupoMesas: Array.isArray(mesa?.grupoMesas) ? mesa.grupoMesas : []
        }));
        setVista('pago');
      } catch (error) {
        setErrorEnvio(
          error?.response?.data?.message ||
            error?.message ||
            'No pudimos validar la mesa. Vuelve a escanear el QR o intenta de nuevo.'
        );
      } finally {
        setResolviendoMesaQr(false);
      }
      return;
    }

    setVista('pago');
  };

  const confirmarPedido = () => crearPedidoYDecidirPago({ metodoPago: pedido?.metodoPago || PAYMENT_METHODS[0].id });

  return (
    <>
      <div className="fo-checkout-overlay" />

      <div className="fo-checkout-sheet">
        <div className="fo-checkout-statusbar" aria-hidden="true">
          <span>11:16</span>
          <span>LTE</span>
        </div>

        <div className="fo-checkout-content" ref={contentRef}>
          <header className="fo-checkout-topbar">
            <button type="button" className="fo-checkout-back" onClick={vista === 'canasta' ? cerrar : () => setVista('canasta')}>
              <ArrowLeft aria-hidden="true" />
            </button>

            {vista === 'canasta' ? (
              <div className="fo-checkout-brand">
                {restauranteLogo ? <img src={restauranteLogo} alt="" /> : <span>{restauranteNombre.charAt(0)}</span>}
                <strong>{restauranteNombre}</strong>
              </div>
            ) : (
              <strong className="fo-checkout-title">Terminar y pagar</strong>
            )}

            <Crown className="fo-checkout-crown" aria-hidden="true" />
          </header>

          {errorEnvio ? <div className="fo-resumen-error-banner fo-checkout-error">{errorEnvio}</div> : null}

          <AnimatePresence mode="wait">
            {vista === 'canasta' ? (
              <MotionDiv
                key="canasta"
                className="fo-cart-view"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <div className="fo-cart-items">
                  {items.map((item) => {
                    const lineId = item.lineId || item.id;
                    const image = resolveProductoImg(item.imagenUrl || item.imagen);
                    const discount = formatDiscount(item);
                    const precioOriginal = Number(item.precio || 0) * Number(item.cantidad || 1);

                    return (
                      <article className="fo-cart-item-rappi" key={lineId}>
                        <div className="fo-cart-item-image">
                          {image ? <img src={image} alt="" /> : <Utensils aria-hidden="true" />}
                        </div>
                        <div className="fo-cart-item-copy">
                          <h2>{item.nombre}</h2>
                          <strong>{formatearPrecio(Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 1))}</strong>
                          {discount ? (
                            <div className="fo-cart-discount-line">
                              <span>{discount}</span>
                              <s>{formatearPrecio(precioOriginal)}</s>
                            </div>
                          ) : null}
                          <p>
                            {item.modificaciones?.flatMap((grupo) => (grupo.opciones || []).map((opcion) => opcion.nombre)).join(', ') ||
                              item.extras?.map((extra) => extra.nombre).join(', ') ||
                              item.instrucciones ||
                              'Listo para enviar a cocina'}
                          </p>
                        </div>

                        <div className="fo-cart-qty-rappi">
                          <button type="button" onClick={() => quitarProducto(lineId)} aria-label="Eliminar producto">
                            <Trash2 aria-hidden="true" />
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(lineId, Number(item.cantidad || 1) + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="fo-cart-free-banner">
                  <Crown aria-hidden="true" />
                  <span>Tu pedido se envia directo al restaurante. Sin filas, sin espera innecesaria.</span>
                </div>

                <button type="button" className="fo-cart-empty" onClick={() => limpiarCarritoConfirmado?.()}>
                  Vaciar canasta
                </button>

                <section className="fo-cart-complements">
                  <h2>Complementa tu pedido</h2>
                  <p>Personas con tu mismo pedido agregaron:</p>

                  <div className="fo-cart-complements-row">
                    {productosComplemento.length > 0 ? (
                      productosComplemento.map((producto) => {
                        const image = resolveProductoImg(producto.imagenUrl || producto.imagen);
                        return (
                          <button
                            type="button"
                            className="fo-cart-complement-card"
                            key={producto.id || producto.lineId}
                            onClick={() => agregarProducto({ ...producto, cantidad: 1 })}
                          >
                            <span className="fo-cart-complement-add">
                              <Plus aria-hidden="true" />
                            </span>
                            <span className="fo-cart-complement-image">
                              {image ? <img src={image} alt="" /> : <Utensils aria-hidden="true" />}
                            </span>
                            <strong>{producto.nombre}</strong>
                            <small>{producto.descripcion || 'Ideal para completar tu pedido'}</small>
                            <b>{formatearPrecio(producto.precioUnitario || producto.precio)}</b>
                          </button>
                        );
                      })
                    ) : (
                      [1, 2, 3].map((item) => (
                        <div className="fo-cart-complement-card is-placeholder" key={item}>
                          <span className="fo-cart-complement-image">
                            <Utensils aria-hidden="true" />
                          </span>
                          <strong>Mas opciones pronto</strong>
                          <small>Este espacio queda listo para vender adicionales</small>
                          <b>&nbsp;</b>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </MotionDiv>
            ) : null}

            {vista === 'pago' ? (
              <MotionDiv
                key="pago"
                className="fo-payment-view"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <section className="fo-payment-map">
                  <div className="fo-payment-map-grid" />
                  <div className="fo-payment-map-pin">
                    <Utensils aria-hidden="true" />
                  </div>
                  <button type="button">Confirmar punto del pedido</button>
                </section>

                <div className="fo-payment-list">
                  <button type="button" className="fo-payment-row">
                    <MapPin aria-hidden="true" />
                    <span>
                      <strong>{servicioLabel}</strong>
                      <small>{restauranteNombre}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>

                  <label className="fo-payment-row fo-payment-row-input">
                    <ReceiptText aria-hidden="true" />
                    <span>
                      <strong>Detalles</strong>
                      <input
                        value={pedido?.clienteNombre || ''}
                        onChange={(event) => setPedido((prev) => ({ ...prev, clienteNombre: event.target.value }))}
                        placeholder="Nombre para identificar tu pedido"
                      />
                    </span>
                  </label>

                  <button type="button" className="fo-payment-row">
                    <Utensils aria-hidden="true" />
                    <span>
                      <strong>{tipoPedidoActual === 'mesa' ? 'Yo recibo el pedido en mi mesa' : 'Yo recojo el pedido en mostrador'}</strong>
                      <small>{detalleServicio}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>

                <section className="fo-payment-estimate">
                  <h2>
                    <Clock3 aria-hidden="true" />
                    Preparacion estimada
                  </h2>
                  <div className="fo-payment-option muted">
                    <span />
                    <div>
                      <strong>Mas rapido</strong>
                      <small>10 - 15 min</small>
                    </div>
                    <b>No disponible</b>
                  </div>
                  <div className="fo-payment-option selected">
                    <span>✓</span>
                    <div>
                      <strong>Estandar</strong>
                      <small>15 - 25 min</small>
                    </div>
                  </div>
                </section>

                <section className="fo-payment-method">
                  <div>
                    <h2>Metodo de pago</h2>
                    <button type="button" disabled title="PSE listo para activar en la siguiente fase">
                      Efectivo
                    </button>
                  </div>
                  {PAYMENT_METHODS.filter((method) => method.enabled).map((method) => (
                    <label className="fo-payment-method-card" key={method.id}>
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={(pedido?.metodoPago || PAYMENT_METHODS[0].id) === method.id}
                        onChange={() => setPedido((prev) => ({ ...prev, metodoPago: method.id }))}
                      />
                      <span className="fo-payment-method-icon" aria-hidden="true">
                        <Banknote />
                      </span>
                      <span className="fo-payment-method-copy">
                        <em>{method.label}</em>
                        <strong>{method.title}</strong>
                        <small>{method.description}</small>
                      </span>
                    </label>
                  ))}
                </section>
              </MotionDiv>
            ) : null}

            {vista === 'confirmacion' ? (
              <MotionDiv
                key="confirmacion"
                className="fo-confirmacion-pedido"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2>Pedido enviado</h2>
                <p>Tu pedido fue recibido correctamente.</p>
                <p>El restaurante ya lo esta procesando.</p>

                <button
                  type="button"
                  className="fo-btn-primario"
                  onClick={() => {
                    onClose?.();
                    if (slug) navigate(`/${slug}/estado-pedido`);
                  }}
                >
                  Ver estado del pedido
                </button>

                <button type="button" className="fo-btn-secundario" onClick={cerrar}>
                  Volver al menu
                </button>
              </MotionDiv>
            ) : null}
          </AnimatePresence>
        </div>

        {vista !== 'confirmacion' ? (
          <footer className="fo-checkout-footer">
            <div>
              <span>{vista === 'canasta' ? 'Subtotal' : 'Total a pagar'}</span>
              <strong>{formatearPrecio(total)}</strong>
            </div>
            <button
              type="button"
              onClick={vista === 'canasta' ? asegurarContextoYContinuar : confirmarPedido}
              disabled={resolviendoMesaQr || enviando || totalItems === 0 || (vista === 'pago' && String(pedido?.clienteNombre || '').trim().length < 2)}
            >
              {resolviendoMesaQr ? 'Validando...' : enviando ? 'Enviando...' : 'Continuar'}
            </button>
          </footer>
        ) : null}
      </div>
    </>
  );
}
