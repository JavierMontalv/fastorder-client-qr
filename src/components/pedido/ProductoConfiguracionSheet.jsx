// client-qr/src/components/pedido/ProductoConfiguracionSheet.jsx
// ======================================================================
// 🧠 ProductoConfiguracionSheet.jsx — FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// ORQUESTADOR DEL CONFIGURADOR (TIPO FUEGO BURGER)
// • Fuente única de estado
// • Consume productoService
// • ÚNICO lugar donde se toca el carrito
// • Orquesta UI desacoplada
// ======================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useCarrito } from '../../context/CarritoContext';
import { buildAssetUrl } from '../../config/env';
import { obtenerOpcionesProducto } from '../../services/productoService';

import ProductoConfiguracionAcompanantes from './ProductoConfiguracionAcompanantes';
import ProductoConfiguracionFooter from './ProductoConfiguracionFooter';
import ProductoConfiguracionInstrucciones from './ProductoConfiguracionInstrucciones';

import '../../styles/BottomSheets.css';
import '../../styles/ProductoConfiguracionSheet.css';

export default function ProductoConfiguracionSheet({ producto, onClose }) {
  // ------------------------------------------------------------------
  // 🛑 GUARDIA UX — producto inexistente
  // ------------------------------------------------------------------
  if (!producto) return null;

  // ------------------------------------------------------------------
  // 🛒 CARRITO — ÚNICO PUNTO DE ESCRITURA
  // ------------------------------------------------------------------
  const { agregarProducto } = useCarrito();

  // ------------------------------------------------------------------
  // 🧠 ESTADO LOCAL (FUENTE ÚNICA)
  // ------------------------------------------------------------------
  const [gruposOpciones, setGruposOpciones] = useState([]);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState({});
  const [instrucciones, setInstrucciones] = useState('');
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // 💰 PRECIO DINÁMICO (UI)
  // ------------------------------------------------------------------
  const totalExtras = Object.values(opcionesSeleccionadas)
    .flat()
    .reduce((acc, o) => acc + Number(o.precio || 0), 0);

  const precioTotal = Number(producto.precio) + totalExtras;

  // ------------------------------------------------------------------
  // 🔓 REGLA DE CONFIRMACIÓN (EXTENSIBLE)
  // ------------------------------------------------------------------
  const puedeConfirmar = !loading;

  // ------------------------------------------------------------------
  // 🚀 CARGA DE CONFIGURACIÓN DEL PRODUCTO
  // ------------------------------------------------------------------
  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        setLoading(true);
        const data = await obtenerOpcionesProducto(producto.id);
        if (!activo) return;

        setGruposOpciones(data?.gruposOpciones || []);
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [producto.id]);

  // ------------------------------------------------------------------
  // ✅ COMMIT FINAL AL CARRITO (ÚNICO LUGAR)
  // ------------------------------------------------------------------
  const confirmar = () => {
    agregarProducto({
      ...producto,
      extras: opcionesSeleccionadas,
      instrucciones,
      precioFinal: precioTotal
    });

    onClose?.();
  };

  // ------------------------------------------------------------------
  // 🖼️ IMAGEN DEL PRODUCTO (RUTA CONSISTENTE CON MENÚ)
  // ------------------------------------------------------------------
  const imagenProducto = producto.imagenUrl
    ? buildAssetUrl(`uploads/productos/${producto.imagenUrl}`)
    : '/no-image.png';

  // ------------------------------------------------------------------
  // 🧩 RENDER
  // ------------------------------------------------------------------
  return (
    <AnimatePresence>
      <motion.div
        className="fo-bottomsheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fo-bottomsheet snap-full"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        <div className="fo-bottomsheet-handle" />

        <div className="fo-bottomsheet-content producto-configuracion">
          <div className="producto-config-layout">
            <div className="producto-config-imagen">
              <img src={imagenProducto} alt={producto.nombre} />
            </div>

            <div className="producto-config-body">
              {/* ---------------------------------------------------------- */}
              {/* 🧾 PRODUCTO */}
              {/* ---------------------------------------------------------- */}
              <div className="producto-config-header">
                <h2>{producto.nombre}</h2>
                <span className="precio">${precioTotal.toLocaleString()}</span>
              </div>

              {producto.descripcion && <p className="descripcion">{producto.descripcion}</p>}

              {/* ---------------------------------------------------------- */}
              {/* ⏳ LOADING */}
              {/* ---------------------------------------------------------- */}
              {loading && <p className="loading">Cargando opciones…</p>}

              {/* ---------------------------------------------------------- */}
              {/* 🍟 OPCIONES / GRUPOS */}
              {/* ---------------------------------------------------------- */}
              {!loading && (
                <ProductoConfiguracionAcompanantes
                  gruposOpciones={gruposOpciones}
                  opcionesSeleccionadas={opcionesSeleccionadas}
                  onChange={setOpcionesSeleccionadas}
                />
              )}

              {/* ---------------------------------------------------------- */}
              {/* ✍️ INSTRUCCIONES */}
              {/* ---------------------------------------------------------- */}
              <ProductoConfiguracionInstrucciones
                value={instrucciones}
                onChange={setInstrucciones}
              />

              {/* ---------------------------------------------------------- */}
              {/* ✅ FOOTER */}
              {/* ---------------------------------------------------------- */}
              <ProductoConfiguracionFooter
                onCancelar={onClose}
                onConfirmar={confirmar}
                disabled={!puedeConfirmar}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
