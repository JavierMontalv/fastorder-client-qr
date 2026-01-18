// client-qr/src/components/pedido/CompletarPedidoSheet.jsx
// ======================================================================
// 🧠 CompletarPedidoSheet.jsx – FASTORDER Client QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Bottom Sheet PRINCIPAL (CORE REAL FASE 6)
// • Orquesta pasos: Contexto → Pago → Confirmación
// • Fuente única de estado del flujo
// • Anti-duplicados local + bloqueo global
// • El pedido activo se guarda JUSTO al crear pedido
// • CONFIRMACIÓN FINAL = click en “Entendido”
//   → limpia carrito
//   → mantiene pedido activo
//   → vuelve al menú
// ======================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import ItemResumenPedido from './ItemResumenPedido';
import SeleccionContexto from './SeleccionContexto';
import SeleccionPago from './SeleccionPago';

import { useCarrito } from '../../context/CarritoContext';
import { guardarPedidoActivo } from '../../utils/bloqueoPedido';
import { PASOS_PEDIDO, validarPedido } from '../../utils/validarPedido';

import '../../styles/BottomSheets.css';
import '../../styles/ResumenPedido.css';

export default function CompletarPedidoSheet({ onClose, onCrearPedido }) {
  // ------------------------------------------------------------------
  // 🛒 Fuente única de verdad de los ítems
  // ------------------------------------------------------------------
  const { items, limpiarCarritoConfirmado } = useCarrito();

  // ------------------------------------------------------------------
  // 🧠 Estado del flujo (SIN items)
  // ------------------------------------------------------------------
  const [pasoActual, setPasoActual] = useState(PASOS_PEDIDO.CONTEXTO);
  const [pedido, setPedido] = useState({
    tipoPedido: null,
    mesaId: null,
    direccion: null,
    metodoPago: null
  });

  const [pedidoCreado, setPedidoCreado] = useState(false);

  // ------------------------------------------------------------------
  // 🛑 GUARDIA UX — carrito vacío
  // ------------------------------------------------------------------
  useEffect(() => {
    if (items.length === 0) {
      onClose?.();
    }
  }, [items.length, onClose]);

  if (items.length === 0) return null;

  // ------------------------------------------------------------------
  // ➡️ Avanzar de paso con validación dura
  // ------------------------------------------------------------------
  const avanzar = (nuevoEstado, siguientePaso) => {
    const pedidoActualizado = { ...pedido, ...nuevoEstado };

    const resultado = validarPedido({ ...pedidoActualizado, items }, pasoActual);

    if (!resultado.valido) {
      return resultado;
    }

    setPedido(pedidoActualizado);
    setPasoActual(siguientePaso);
    return { valido: true };
  };

  // ------------------------------------------------------------------
  // ✅ CONFIRMACIÓN FINAL (UberEats style)
  // ------------------------------------------------------------------
  const cerrar = () => {
    limpiarCarritoConfirmado?.();
    onClose?.();
  };

  // ------------------------------------------------------------------
  // 🧠 Crear pedido y decidir camino de pago (PUNTO CORRECTO DE DOMINIO)
  // ------------------------------------------------------------------
  const crearPedidoYDecidirPago = async ({ metodoPago }) => {
    if (pedidoCreado) {
      return { valido: false };
    }

    const pedidoFinal = {
      ...pedido,
      metodoPago,
      items
    };

    const resultado = validarPedido(pedidoFinal, PASOS_PEDIDO.PAGO);

    if (!resultado.valido) {
      return resultado;
    }

    const pedidoCreadoBackend = await onCrearPedido(pedidoFinal);

    guardarPedidoActivo(pedidoCreadoBackend);

    setPedido(pedidoCreadoBackend);
    setPedidoCreado(true);
    setPasoActual(PASOS_PEDIDO.CONFIRMACION);

    return { valido: true };
  };

  // ------------------------------------------------------------------
  // 🧩 Render
  // ------------------------------------------------------------------
  return (
    <>
      <div className="fo-bottomsheet-overlay" />

      <div className="fo-bottomsheet snap-full">
        <div className="fo-bottomsheet-handle" />

        <div className="fo-bottomsheet-content">
          {items.length > 0 && pasoActual !== PASOS_PEDIDO.CONFIRMACION && (
            <div className="fo-resumen-pedido">
              {items.map((item) => (
                <ItemResumenPedido key={item.id} item={item} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {pasoActual === PASOS_PEDIDO.CONTEXTO && (
              <SeleccionContexto
                key="contexto"
                pedido={pedido}
                onContinuar={(data) => avanzar(data, PASOS_PEDIDO.PAGO)}
              />
            )}

            {pasoActual === PASOS_PEDIDO.PAGO && (
              <SeleccionPago
                key="pago"
                onAtras={() => {
                  setPedido((prev) => ({
                    ...prev,
                    mesaId: null,
                    direccion: null,
                    metodoPago: null
                  }));
                  setPasoActual(PASOS_PEDIDO.CONTEXTO);
                }}
                onSeleccionarMetodo={({ metodoPago }) => crearPedidoYDecidirPago({ metodoPago })}
              />
            )}

            {pasoActual === PASOS_PEDIDO.CONFIRMACION && (
              <motion.div
                key="confirmacion"
                className="fo-confirmacion-pedido"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2>✅ Pedido enviado</h2>
                <p>Tu pedido fue recibido correctamente.</p>
                <p>Puedes seguir su estado desde la pantalla.</p>

                <button type="button" className="fo-btn-primario" onClick={cerrar}>
                  Entendido
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
