import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Camera, Search, ScanLine, Share2, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import CategoryNavEnterprise from '../components/CategoryNavEnterprise';
import CarritoFlotante from '../components/CarritoFlotante';
import PedidoEnCursoBanner from '../components/PedidoEnCursoBanner';
import ProductoCardEnterprise from '../components/ProductoCardEnterprise';
import { useCarrito } from '../context/CarritoContext';
import { useMesa } from '../context/MesaContext';
import { usePedido } from '../context/PedidoContext';
import { usePedidoActivo } from '../context/PedidoActivoContext';
import { obtenerMenuPublico } from '../services/menuService';
import { crearPedidoPublico } from '../services/pedidosService';
import { obtenerMesaPorQr, obtenerMesaPublica } from '../services/publicApi';
import {
  obtenerPromocionEntradaPorSlug,
  registrarClick,
  registrarImpresion
} from '../services/promocionesService';
import { limpiarPedidoActivo } from '../utils/bloqueoPedido';
import { activarSonidoPedido } from '../utils/pedidoHaptics';
import '../styles/CategoryNavEnterprise.css';
import '../styles/Colors.css';
import '../styles/EstadoPedido.css';
import '../styles/Menu.css';
import '../styles/Theme.css';

const SPLASH_ACTIVA = 'activa';
const SPLASH_CERRADA = 'cerrada';
const MENU_SCROLL_OFFSET = 88;
const MENU_CACHE_TTL_MS = 60_000;
const MENU_CACHE_VERSION = 1;

const ProductoConfiguracionSheet = lazy(() => import('../components/pedido/ProductoConfiguracionSheet'));
const CompletarPedidoSheet = lazy(() => import('../components/pedido/CompletarPedidoSheet'));
const PromocionModal = lazy(() => import('../components/PromocionModal'));

function getMenuCacheKey(slug) {
  return `comanda:menu:${MENU_CACHE_VERSION}:${String(slug || '').trim().toLowerCase()}`;
}

function readCachedMenu(slug) {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(getMenuCacheKey(slug)) || 'null');
    if (!cached?.savedAt || Date.now() - cached.savedAt > MENU_CACHE_TTL_MS) return null;
    if (!cached.data?.restaurante || !Array.isArray(cached.data?.categorias)) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function cacheMenu(slug, data) {
  try {
    window.sessionStorage.setItem(getMenuCacheKey(slug), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // El menú sigue funcionando si el navegador bloquea el almacenamiento.
  }
}

function resolveRestaurantImage(assetUrl) {
  if (!assetUrl) return null;
  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl.replace(/^http:\/\//i, 'https://');
  }
  return assetUrl;
}

function getCategoryDescription(categoria) {
  if (categoria?.descripcion?.trim()) return categoria.descripcion.trim();

  const nombre = String(categoria?.nombre || '').toLowerCase();
  if (nombre.includes('descuento') || nombre.includes('oferta')) {
    return 'Las mejores ofertas para ti';
  }
  if (nombre.includes('popular')) return 'Los favoritos de nuestros clientes';
  if (nombre.includes('combo')) return 'Combina tus favoritos y disfruta mas';
  return '';
}

function getRestaurantMonogram(nombre = '') {
  return nombre
    .split(' ')
    .map((parte) => parte.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, numero } = useParams();
  const { items, limpiarCarritoConfirmado } = useCarrito();
  const { clearPedidoId } = usePedido();
  const { pedido: pedidoActivo } = usePedidoActivo();
  const {
    mesaId,
    numeroMesa,
    restauranteId,
    mesaCuentaNumero,
    cuentaCompartidaActiva,
    grupoMesas,
    mesaSesionToken,
    requiereReescaneoQr,
    motivoBloqueoQr,
    slugMesaQr,
    hidratarMesaQr,
    limpiarMesaQr
  } = useMesa();

  const sectionRefs = useRef({});
  const videoScannerRef = useRef(null);
  const streamScannerRef = useRef(null);
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [inteligenciaVenta, setInteligenciaVenta] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [productoEnConfiguracion, setProductoEnConfiguracion] = useState(null);
  const [sheetPedidoAbierto, setSheetPedidoAbierto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [splashFase, setSplashFase] = useState(SPLASH_CERRADA);
  const [promocionActiva, setPromocionActiva] = useState(null);
  const [modalLlamadoVisible, setModalLlamadoVisible] = useState(false);
  const [ultimoLlamadoEventoId, setUltimoLlamadoEventoId] = useState(null);
  const [scannerActivo, setScannerActivo] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const qrAcceso = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('qr');
    return value ? String(value).trim() : null;
  }, [location.search]);
  const validandoNuevoQr = Boolean(numero && qrAcceso);

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

        const { default: decodeQr } = await import('jsqr');

        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerError('Este navegador no permite abrir la camara desde aqui. Usa la camara del celular para leer el QR fisico.');
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
              const codigo = decodeQr(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });
              const valor = codigo?.data?.trim();

              if (valor) {
                detenerCamara();
                clearPedidoId();
                limpiarPedidoActivo();
                limpiarMesaQr?.();
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
        setScannerError('No pudimos abrir la camara. Revisa permisos o usa la camara del celular.');
      }
    };

    iniciarScanner();

    return () => {
      cancelado = true;
      detenerCamara();
    };
  }, [clearPedidoId, limpiarMesaQr, scannerActivo]);
  const contextoMesaCoincideConRuta = useMemo(
    () =>
      Boolean(
        slug &&
        numero &&
        String(slugMesaQr || '') === String(slug) &&
        String(numeroMesa || '') === String(numero)
      ),
    [numero, numeroMesa, slug, slugMesaQr]
  );
  const mesaAutorizadaPorQr = useMemo(
    () =>
      Boolean(
        numero &&
        mesaSesionToken &&
        !requiereReescaneoQr &&
        contextoMesaCoincideConRuta
      ),
    [contextoMesaCoincideConRuta, mesaSesionToken, numero, requiereReescaneoQr]
  );
  const debeReescanearQr = Boolean(numero) && !validandoNuevoQr && !mesaAutorizadaPorQr;
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
        <p>Centra el QR de la mesa dentro del recuadro para abrir una nueva cuenta segura.</p>
        {scannerError ? <span className="estado-scanner-error">{scannerError}</span> : null}
      </div>
    </div>
  ) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug, numero]);

  useEffect(() => {
    if (!slugMesaQr) return;
    if (String(slugMesaQr) === String(slug || '')) return;
    limpiarMesaQr();
  }, [limpiarMesaQr, slug, slugMesaQr]);

  useEffect(() => {
    if (!slug || !numero) return;

    if (qrAcceso) {
      clearPedidoId();
      limpiarPedidoActivo();
    }

    if (!qrAcceso && contextoMesaCoincideConRuta) {
      return;
    }

    const validarMesa = async () => {
      try {
        const mesa = qrAcceso
          ? await obtenerMesaPorQr(qrAcceso)
          : await obtenerMesaPublica(slug, numero);

        if (!mesa?.mesaId || !mesa?.restauranteId) throw new Error('Mesa invalida');

        if (String(mesa.slug || slug) !== String(slug) || String(mesa.numero || numero) !== String(numero)) {
          throw new Error('El QR no corresponde a esta mesa');
        }

        hidratarMesaQr({
          slug,
          mesaId: mesa.mesaCuentaId || mesa.mesaId,
          numeroMesa: mesa.numero,
          restauranteId: mesa.restauranteId,
          mesaCuentaNumero: mesa.mesaCuentaNumero || mesa.numero || null,
          cuentaCompartidaActiva: Boolean(mesa.cuentaCompartidaActiva),
          grupoMesas: Array.isArray(mesa.grupoMesas) ? mesa.grupoMesas : [],
          mesaSesionToken: qrAcceso ? mesa.sesionMesaToken || null : mesaAutorizadaPorQr ? mesaSesionToken : null,
          requiereReescaneoQr: qrAcceso ? false : !mesaAutorizadaPorQr,
          motivoBloqueoQr: qrAcceso ? null : mesaAutorizadaPorQr ? null : 'reescanear_qr'
        });

        if (qrAcceso) {
          navigate(location.pathname, { replace: true });
        }
      } catch {
        navigate(slug ? `/${slug}` : '/', { replace: true });
      }
    };

    validarMesa();
  }, [
    hidratarMesaQr,
    location.pathname,
    slug,
    numero,
    qrAcceso,
    contextoMesaCoincideConRuta,
    mesaAutorizadaPorQr,
    mesaSesionToken,
    clearPedidoId,
    navigate,
  ]);

  useEffect(() => {
    if (!slug) return;

    let cancelado = false;
    const cachedMenu = readCachedMenu(slug);

    if (cachedMenu) {
      setRestaurante(cachedMenu.restaurante);
      setCategorias(cachedMenu.categorias);
      setInteligenciaVenta(cachedMenu.inteligenciaVenta || null);
      setError(false);
      setLoading(false);
      return () => {
        cancelado = true;
      };
    }

    const cargarMenu = async () => {
      try {
        setLoading(true);
        setError(false);
        const {
          restaurante: restauranteData,
          categorias: categoriasData,
          inteligenciaVenta: inteligenciaVentaData
        } = await obtenerMenuPublico(slug);
        if (!restauranteData) throw new Error('Menú no disponible');
        if (cancelado) return;
        setRestaurante(restauranteData);
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        setInteligenciaVenta(inteligenciaVentaData || null);
        cacheMenu(slug, {
          restaurante: restauranteData,
          categorias: Array.isArray(categoriasData) ? categoriasData : [],
          inteligenciaVenta: inteligenciaVentaData || null
        });
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargarMenu();

    return () => {
      cancelado = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return undefined;

    let cancelado = false;

    const cargarPromocion = async () => {
      try {
        const promo = await obtenerPromocionEntradaPorSlug(slug);
        if (cancelado) return;

        if (promo?.id) {
          setPromocionActiva(promo);
          setSplashFase(SPLASH_ACTIVA);
        } else {
          setPromocionActiva(null);
          setSplashFase(SPLASH_CERRADA);
        }
      } catch {
        if (!cancelado) {
          setPromocionActiva(null);
          setSplashFase(SPLASH_CERRADA);
        }
      }
    };

    cargarPromocion();

    return () => {
      cancelado = true;
    };
  }, [slug]);

  useEffect(() => {
    if (splashFase !== SPLASH_ACTIVA) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [splashFase]);

  useEffect(() => {
    const eventId = pedidoActivo?.displayCall?.eventId;
    if (!eventId || eventId === ultimoLlamadoEventoId) return;

    setUltimoLlamadoEventoId(eventId);
    setModalLlamadoVisible(true);
  }, [pedidoActivo?.displayCall?.eventId, ultimoLlamadoEventoId]);

  const categoriasVisibles = useMemo(
    () => categorias.filter((categoria) => Array.isArray(categoria.productos) && categoria.productos.length > 0),
    [categorias]
  );
  const destacadosMenu = useMemo(
    () => (Array.isArray(inteligenciaVenta?.destacadosMenu) ? inteligenciaVenta.destacadosMenu.slice(0, 3) : []),
    [inteligenciaVenta]
  );
  const productoSignalsMap = useMemo(
    () => inteligenciaVenta?.productoSignalsMap || {},
    [inteligenciaVenta]
  );
  const sugerenciasCarrito = useMemo(
    () => (Array.isArray(inteligenciaVenta?.sugerenciasCarrito) ? inteligenciaVenta.sugerenciasCarrito : []),
    [inteligenciaVenta]
  );
  const carritoProductIds = useMemo(
    () => new Set(items.map((item) => Number(item.id))),
    [items]
  );
  const cantidadesPorProducto = useMemo(
    () =>
      items.reduce((acc, item) => {
        const productoId = Number(item.id);
        acc[productoId] = (acc[productoId] || 0) + Number(item.cantidad || 0);
        return acc;
      }, {}),
    [items]
  );
  const sugerenciaCarritoActiva = useMemo(
    () =>
      sugerenciasCarrito.find(
        (item) =>
          carritoProductIds.has(Number(item.anchorProductId)) &&
          !carritoProductIds.has(Number(item.suggestedProductId))
      ) || null,
    [carritoProductIds, sugerenciasCarrito]
  );
  const sugerenciaProductoActiva = useMemo(() => {
    if (!productoEnConfiguracion?.id) return null;

    return (
      sugerenciasCarrito.find(
        (item) =>
          Number(item.anchorProductId) === Number(productoEnConfiguracion.id) &&
          !carritoProductIds.has(Number(item.suggestedProductId))
      ) || null
    );
  }, [carritoProductIds, productoEnConfiguracion, sugerenciasCarrito]);
  const productosComplementoCheckout = useMemo(
    () =>
      categoriasVisibles
        .flatMap((categoria) => categoria.productos || [])
        .filter((producto) => producto?.disponible !== false && producto?.estado !== 'inactivo')
        .filter((producto) => !carritoProductIds.has(Number(producto.id)))
        .slice(0, 8),
    [carritoProductIds, categoriasVisibles]
  );

  useEffect(() => {
    if (!categoriasVisibles.length) {
      setCategoriaActiva(null);
      return;
    }

    setCategoriaActiva((previa) => {
      if (categoriasVisibles.some((categoria) => categoria.id === previa)) return previa;
      return categoriasVisibles[0].id;
    });
  }, [categoriasVisibles]);

  useEffect(() => {
    if (!categoriasVisibles.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visibles.length) return;

        const categoriaId = visibles[0].target.getAttribute('data-category-id');
        if (categoriaId) {
          setCategoriaActiva((previa) => (String(previa) === String(categoriaId) ? previa : categoriaId));
        }
      },
      {
        rootMargin: '-18% 0px -58% 0px',
        threshold: [0.12, 0.3, 0.55]
      }
    );

    categoriasVisibles.forEach((categoria) => {
      const section = sectionRefs.current[categoria.id];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [categoriasVisibles]);

  const scrollToCategoria = useCallback((categoriaId) => {
    const section = sectionRefs.current[categoriaId];
    if (!section) return;

    setCategoriaActiva(categoriaId);
    const nextTop = section.getBoundingClientRect().top + window.scrollY - MENU_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
  }, []);
  const restauranteCerrado = restaurante?.estadoOperacion === 'cerrado';
  const pedidosDisponibles = Boolean(restaurante?.features?.pedidosQR);

  const abrirProducto = useCallback((producto) => {
    if (!producto || producto.disponible === false) return;
    if (!pedidosDisponibles) return;
    setProductoEnConfiguracion(producto);
  }, [pedidosDisponibles]);

  const cerrarPromocion = useCallback(() => setSplashFase(SPLASH_CERRADA), []);

  const colorPrimario = restaurante?.colorPrimario || '#f12954';
  const colorSecundario = restaurante?.colorSecundario || '#111827';
  const splashVisible = splashFase === SPLASH_ACTIVA;
  const portadaUrl = resolveRestaurantImage(restaurante?.portadaUrl);
  const logoUrl = resolveRestaurantImage(restaurante?.logoUrl);
  const mesaDetectadaPorQr = Boolean(numero);
  const mesaLabel = numero ? `Mesa ${numero}` : null;
  const cuentaCompartidaLabel =
    cuentaCompartidaActiva && mesaCuentaNumero && String(mesaCuentaNumero) !== String(numeroMesa || numero || '')
      ? `Cuenta unificada en Mesa ${mesaCuentaNumero}`
      : cuentaCompartidaActiva && mesaCuentaNumero
        ? `Cuenta compartida activa en Mesa ${mesaCuentaNumero}`
        : null;
  const monograma = getRestaurantMonogram(restaurante?.nombre || 'Menu');
  const descripcionHero = restaurante?.descripcion?.trim()
    ? restaurante.descripcion.trim()
    : numero
      ? 'Escanea, explora el menu y envia tu pedido directo a cocina sin esperar a que llegue un mesero.'
      : 'Conoce la carta, revisa fotos reales de los productos y arma tu pedido en pocos pasos.';

  const pedidoInicial = useMemo(
    () => {
      if (mesaDetectadaPorQr) {
        return {
          tipoPedido: 'mesa',
          mesaId: mesaAutorizadaPorQr ? mesaId || null : null,
          numeroMesa: numeroMesa || numero || null,
          mesaCuentaNumero: mesaCuentaNumero || numeroMesa || numero || null,
          cuentaCompartidaActiva,
          grupoMesas
        };
      }

      if (mesaId) {
        return {
          tipoPedido: 'mesa',
          mesaId,
          numeroMesa: numeroMesa || null,
          mesaCuentaNumero: mesaCuentaNumero || numeroMesa || null,
          cuentaCompartidaActiva,
          grupoMesas
        };
      }

      return {
        tipoPedido: 'llevar'
      };
    },
    [
      cuentaCompartidaActiva,
      grupoMesas,
      mesaAutorizadaPorQr,
      mesaCuentaNumero,
      mesaDetectadaPorQr,
      mesaId,
      numeroMesa,
      numero
    ]
  );
  const carritoOculto = !pedidosDisponibles || Boolean(productoEnConfiguracion) || sheetPedidoAbierto || debeReescanearQr;

  useEffect(() => {
    if (!debeReescanearQr) return;

    setProductoEnConfiguracion(null);
    setSheetPedidoAbierto(false);
    if (items.length > 0) {
      limpiarCarritoConfirmado?.();
    }
  }, [debeReescanearQr, items.length, limpiarCarritoConfirmado]);

  const normalizarModificacionesParaPedido = (modificaciones = []) =>
    (Array.isArray(modificaciones) ? modificaciones : [])
      .map((grupo) => {
        const grupoId = Number(grupo?.grupoId || grupo?.grupoModificadorId || grupo?.id || 0);
        const opciones = Array.isArray(grupo?.opciones)
          ? grupo.opciones
              .map((opcion) => {
                const opcionId = Number(opcion?.opcionId || opcion?.id || opcion || 0);
                return opcionId ? { opcionId } : null;
              })
              .filter(Boolean)
          : [];

        if (!grupoId || opciones.length === 0) return null;
        return { grupoId, opciones };
      })
      .filter(Boolean);

  const crearPedidoDesdeQr = async (pedidoFinal) => {
    if (!pedidosDisponibles) {
      throw new Error('Este restaurante tiene activo solo menu QR.');
    }

    if (pedidoFinal?.tipoPedido === 'mesa' && !mesaSesionToken) {
      throw new Error('La sesion QR de esta mesa ya se cerro. Vuelve a escanear el codigo para seguir pidiendo.');
    }

    const payload = {
      restauranteId: restauranteId || restaurante?.id,
      mesaId: pedidoFinal?.tipoPedido === 'mesa' ? pedidoFinal?.mesaId || mesaId : null,
      tipoPedido: pedidoFinal?.tipoPedido || pedidoInicial.tipoPedido,
      clienteNombre: String(pedidoFinal?.clienteNombre || '').trim(),
      metodoPago: pedidoFinal?.metodoPago || 'caja',
      nota: pedidoFinal?.nota || '',
      origenPedido: 'qr',
      sesionMesaToken: pedidoFinal?.tipoPedido === 'mesa' ? mesaSesionToken : null,
      items: items.map((item) => ({
        productoId: item.id,
        cantidad: item.cantidad,
        modificaciones: normalizarModificacionesParaPedido(item.modificaciones),
        instrucciones: String(item.instrucciones || '').trim()
      }))
    };

    const response = await crearPedidoPublico(payload);
    if (response?.sesionMesaToken) {
      hidratarMesaQr({
        slug,
        mesaId: pedidoFinal?.mesaId || mesaId || null,
        numeroMesa: pedidoFinal?.numeroMesa || numeroMesa || numero || null,
        restauranteId: restauranteId || restaurante?.id || null,
        mesaCuentaNumero: pedidoFinal?.mesaCuentaNumero || mesaCuentaNumero || numeroMesa || numero || null,
        cuentaCompartidaActiva: Boolean(pedidoFinal?.cuentaCompartidaActiva),
        grupoMesas,
        mesaSesionToken: response.sesionMesaToken,
        requiereReescaneoQr: false,
        motivoBloqueoQr: null
      });
    }
    return response?.data || null;
  };

  return (
    <div
      className="menu-page menu-page-clean"
      style={{
        '--menu-brand-primary': colorPrimario,
        '--menu-brand-secondary': colorSecundario
      }}
    >
      {splashVisible ? (
        <Suspense fallback={null}>
          <PromocionModal
            promo={promocionActiva}
            visible={splashVisible}
            cargando={false}
            onClose={cerrarPromocion}
            registrarImpresion={registrarImpresion}
            registrarClick={registrarClick}
          />
        </Suspense>
      ) : null}

      {modalLlamadoVisible && pedidoActivo?.displayCall && (
        <div className="estado-modal-backdrop" onClick={() => setModalLlamadoVisible(false)}>
          <div className="estado-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="estado-modal-head">
              <span className="estado-modal-tag">Comanda avisa</span>
              <span className="estado-modal-live">En vivo</span>
            </div>

            <div className="estado-modal-hero">
              <div>
                <h2>{pedidoActivo.displayCall.titulo || 'Tu pedido esta listo'}</h2>
                <p>{pedidoActivo.displayCall.mensaje || 'El restaurante acaba de llamar tu pedido.'}</p>
              </div>
              <div className="estado-modal-turno-card">
                <span>Turno</span>
                <strong>{pedidoActivo.displayCall.numeroPedido ?? pedidoActivo.id}</strong>
              </div>
            </div>

            <div className="estado-modal-message-card">
              <span>Instruccion final</span>
              <strong>{pedidoActivo.displayCall.submensaje || 'Estate atento al equipo del local.'}</strong>
              <small>Este aviso tambien aparece aunque sigas navegando el menu.</small>
            </div>

            <button
              type="button"
              className="btn-finalizar"
              onClick={() => {
                activarSonidoPedido();
                setModalLlamadoVisible(false);
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {!loading && !error && restaurante && (
        <section className="menu-hero fade-in">
          <div className={`menu-hero-cover ${portadaUrl ? '' : 'is-placeholder'}`}>
            {portadaUrl ? (
              <img
                src={portadaUrl}
                alt={`Portada de ${restaurante.nombre}`}
                className="menu-hero-cover-img"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="menu-hero-cover-placeholder" aria-hidden="true" />
            )}
            <div className="menu-hero-cover-gradient" />
            <div className="menu-hero-rappi-toolbar" aria-label="Acciones del menu">
              <button
                type="button"
                className="menu-hero-rappi-action menu-hero-rappi-close"
                onClick={() => navigate(-1)}
                aria-label="Volver"
              >
                <X aria-hidden="true" />
              </button>
              <div className="menu-hero-rappi-title">{restaurante.nombre}</div>
              <div className="menu-hero-rappi-actions">
                <button type="button" className="menu-hero-rappi-action" aria-label="Compartir menu">
                  <Share2 aria-hidden="true" />
                </button>
                <button type="button" className="menu-hero-rappi-action" aria-label="Buscar en el menu">
                  <Search aria-hidden="true" />
                </button>
                <button type="button" className="menu-hero-rappi-action" aria-label="Guardar restaurante">
                  <Bookmark aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="menu-hero-strip">
            <div className="menu-hero-logo">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`Logo de ${restaurante.nombre}`}
                  className="menu-hero-logo-img"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <span className="menu-hero-logo-fallback" aria-hidden="true">
                  {monograma}
                </span>
              )}
            </div>

            <div className="menu-hero-copy">
              <div className="menu-hero-eyebrow">
                <span className={`menu-hero-status ${restauranteCerrado ? 'closed' : 'open'}`}>
                  <span className="menu-hero-status-dot" />
                  {restauranteCerrado ? 'Cerrado ahora' : 'Abierto ahora'}
                </span>
                {mesaLabel ? <span className="menu-hero-mesa-badge">{mesaLabel}</span> : null}
                {cuentaCompartidaLabel ? <span className="menu-hero-service-badge">{cuentaCompartidaLabel}</span> : null}
                <span className="menu-hero-service-badge">
                  {mesaLabel ? 'Pedido desde QR' : 'Menu digital'}
                </span>
              </div>

              <h1 className="menu-hero-name">{restaurante.nombre}</h1>
              <p className="menu-hero-desc">{descripcionHero}</p>

              <div className="menu-hero-facts" aria-label="Informacion del servicio">
                <div className="menu-hero-fact">
                  <span>Preparacion</span>
                  <strong>15 min</strong>
                </div>
                <div className="menu-hero-fact">
                  <span>Servicio</span>
                  <strong>{mesaLabel ? 'En mesa' : 'Directo'}</strong>
                </div>
                <div className="menu-hero-fact">
                  <span>Estado</span>
                  <strong>{restauranteCerrado ? 'Cerrado' : 'Abierto'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && debeReescanearQr && (
        <div className="menu-qr-guard-backdrop">
          <section className="menu-qr-guard-card fade-in-up">
            <div className="menu-qr-guard-kicker">Sesion QR cerrada</div>
            <h2 className="menu-qr-guard-title">Vuelve a escanear el QR para abrir una nueva cuenta segura</h2>
            <p className="menu-qr-guard-copy">
              El restaurante ya marco tu pedido como entregado. Para proteger la operacion, cerramos automaticamente
              esta sesion de mesa y bloqueamos nuevos pedidos desde este celular hasta que se escanee otra vez el QR fisico.
            </p>
            <div className="menu-qr-guard-steps">
              <div className="menu-qr-guard-step">
                <span className="menu-qr-guard-step-index">1</span>
                <div>
                  <strong>Pedido cerrado</strong>
                  <p>La orden ya fue entregada y la cuenta operativa quedo finalizada.</p>
                </div>
              </div>
              <div className="menu-qr-guard-step">
                <span className="menu-qr-guard-step-index">2</span>
                <div>
                  <strong>Sesion invalidada</strong>
                  <p>Este acceso QR ya no puede seguir creando pedidos desde fuera del restaurante.</p>
                </div>
              </div>
              <div className="menu-qr-guard-step">
                <span className="menu-qr-guard-step-index">3</span>
                <div>
                  <strong>Escaneo obligatorio</strong>
                  <p>Abre nuevamente el QR fisico de la mesa para habilitar una nueva sesion segura.</p>
                </div>
              </div>
            </div>
            <div className="menu-qr-guard-meta">
              <span className="menu-qr-guard-pill">Mesa {numeroMesa || numero}</span>
              {mesaCuentaNumero ? <span className="menu-qr-guard-pill">Cuenta en Mesa {mesaCuentaNumero}</span> : null}
              <span className="menu-qr-guard-pill menu-qr-guard-pill--alert">
                {motivoBloqueoQr === 'pedido_entregado' ? 'Pedido entregado' : 'Nueva validacion requerida'}
              </span>
            </div>
            <button type="button" className="menu-qr-guard-scan" onClick={abrirScannerQr}>
              <Camera aria-hidden="true" />
              Escanear QR con camara
            </button>
          </section>
          {scannerQrOverlay}
        </div>
      )}

      <PedidoEnCursoBanner />

      {!loading && categoriasVisibles.length > 0 && !debeReescanearQr && (
        <CategoryNavEnterprise
          categorias={categoriasVisibles}
          categoriaActiva={categoriaActiva}
          onChange={scrollToCategoria}
        />
      )}

      <main className="menu-content menu-content-clean">
        {!loading && restauranteCerrado && (
          <div className="menu-aviso-cerrado">
            Este restaurante se encuentra cerrado en este momento. Puedes explorar la carta, pero no se
            aceptan pedidos hasta que vuelva a abrir.
          </div>
        )}

        {!loading && !error && !pedidosDisponibles && (
          <div className="menu-aviso-cerrado">
            Este restaurante tiene activo menu QR informativo. Puedes revisar la carta y contactar al local para ordenar.
          </div>
        )}

        {loading && (
          <div className="menu-skeleton-stack">
            <div className="menu-section-header skeleton-version">
              <div className="menu-section-copy">
                <div className="menu-hero-skeleton-name skeleton-box" />
                <div className="skeleton-line short" />
              </div>
            </div>
            <div className="menu-skeleton-list">
              {[1, 2, 3, 4].map((index) => (
                <SkeletonProducto key={index} />
              ))}
            </div>
          </div>
        )}

        {error && <p className="menu-error">Error cargando el menu. Intenta nuevamente.</p>}

        {!loading && !error && categoriasVisibles.length === 0 && (
          <p className="menu-empty">No hay productos disponibles por ahora.</p>
        )}

        {!loading && !error && debeReescanearQr && (
          <section className="menu-rescan-panel fade-in-up">
            <div className="menu-rescan-kicker">Escaneo obligatorio</div>
            <h2 className="menu-rescan-title">Vuelve a escanear el QR para seguir pidiendo</h2>
            <p className="menu-rescan-copy">
              Cuando el restaurante marca tu pedido como entregado, cerramos la sesion operativa de la mesa para evitar
              pedidos remotos o reutilizacion indebida del menu fuera del local.
            </p>
            <div className="menu-rescan-meta">
              <span className="menu-rescan-pill">Mesa {numeroMesa || numero}</span>
              {mesaCuentaNumero ? <span className="menu-rescan-pill">Cuenta en Mesa {mesaCuentaNumero}</span> : null}
              <span className="menu-rescan-pill menu-rescan-pill--alert">
                {motivoBloqueoQr === 'pedido_entregado' ? 'Pedido entregado' : 'Sesion cerrada'}
              </span>
            </div>
            <div className="menu-rescan-note">
              Abre nuevamente el QR fisico de la mesa para habilitar una nueva sesion segura de pedido.
            </div>
            <button type="button" className="menu-qr-guard-scan" onClick={abrirScannerQr}>
              <Camera aria-hidden="true" />
              Escanear QR con camara
            </button>
          </section>
        )}

        {!loading && !error && !debeReescanearQr && categoriasVisibles.length > 0 && (
          <div className="menu-sections-stack">
            {categoriasVisibles.map((categoria) => (
              <section
                key={categoria.id}
                ref={(node) => {
                  sectionRefs.current[categoria.id] = node;
                }}
                data-category-id={categoria.id}
                className={`menu-category-section ${
                  String(categoriaActiva) === String(categoria.id) ? 'is-active' : ''
                }`}
              >
                <div className="menu-section-header">
                  <div className="menu-section-copy">
                    <div className="menu-section-title-row">
                      <span className="menu-section-icon" aria-hidden="true">
                        {categoria.icono || '•'}
                      </span>
                      <div>
                        <h2 className="menu-section-title">{categoria.nombre}</h2>
                      </div>
                      <span className="menu-section-count">
                        {(categoria.productos || []).length}{' '}
                        {(categoria.productos || []).length === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                    {getCategoryDescription(categoria) ? (
                      <p className="menu-section-description">{getCategoryDescription(categoria)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="menu-productos-grid">
                  {(categoria.productos || []).map((producto) => (
                    <ProductoCardEnterprise
                      key={producto.id}
                      producto={producto}
                      senalComercial={productoSignalsMap[producto.id] || null}
                      cantidadEnCarrito={cantidadesPorProducto[Number(producto.id)] || 0}
                      bloqueado={restauranteCerrado || !pedidosDisponibles}
                      onAdd={() => abrirProducto(producto)}
                      onOpen={() => abrirProducto(producto)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !error && !debeReescanearQr && pedidosDisponibles && destacadosMenu.length > 0 && (
          <section className="menu-smart-panel fade-in-up">
            <div className="menu-smart-panel-head">
              <div>
                <span className="menu-smart-kicker">Selecciones destacadas</span>
                <h2 className="menu-smart-title">Opciones recomendadas del menu</h2>
                <p className="menu-smart-copy">
                  {inteligenciaVenta?.summary?.description ||
                    'Encuentra opciones destacadas y combinaciones sugeridas para elegir con mas claridad.'}
                </p>
              </div>

              {sugerenciaCarritoActiva ? (
                <div className="menu-smart-sidehint">
                  <span className="menu-smart-sidehint-label">Sugerencia del momento</span>
                  <strong>{sugerenciaCarritoActiva.title}</strong>
                  <p>{sugerenciaCarritoActiva.description}</p>
                </div>
              ) : null}
            </div>

            <div className="menu-smart-grid">
              {destacadosMenu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="menu-smart-card"
                  onClick={() => abrirProducto(item.producto)}
                >
                  <span className="menu-smart-badge">{item.badge}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <div className="menu-smart-meta">
                    <span>{item.metric || 'Listo para pedir'}</span>
                    {item.acompanante ? <span>Combina con {item.acompanante.nombre}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {productoEnConfiguracion ? (
        <Suspense fallback={null}>
          <ProductoConfiguracionSheet
            producto={productoEnConfiguracion}
            sugerenciaUpsell={sugerenciaProductoActiva}
            onClose={() => setProductoEnConfiguracion(null)}
          />
        </Suspense>
      ) : null}

      <CarritoFlotante
        hidden={carritoOculto}
        suggestion={sugerenciaCarritoActiva}
        onClick={() => setSheetPedidoAbierto(true)}
      />

      {sheetPedidoAbierto ? (
        <Suspense fallback={null}>
          <CompletarPedidoSheet
            key={`pedido-${pedidoInicial.tipoPedido}-${pedidoInicial.mesaId ?? 'sin-mesa'}-${pedidoInicial.numeroMesa ?? 'sin-numero'}`}
            slug={slug}
            restaurante={restaurante}
            complementos={productosComplementoCheckout}
            pedidoInicial={pedidoInicial}
            onClose={() => setSheetPedidoAbierto(false)}
            onCrearPedido={crearPedidoDesdeQr}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function SkeletonProducto() {
  return (
    <div className="producto-card-enterprise fo-card skeleton premium-skeleton">
      <div className="producto-img-wrapper skeleton-box" />
      <div className="producto-info">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}
