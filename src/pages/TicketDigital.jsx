// ======================================================================
// 🧾 TicketDigital.jsx – FASTORDER QR Client (Enterprise 2026)
// ----------------------------------------------------------------------
// Pantalla que se muestra tras crear el pedido:
//  • Ticket visual tipo recibo digital
//  • Código QR interno del pedido
//  • Resumen completo del pedido
//  • Botón para ver estado del pedido en tiempo real (EstadoPedidoPro)
//  • Animaciones suaves y diseño premium
// ======================================================================

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import "../styles/TicketDigital.css";

export default function TicketDigital() {
  const navigate = useNavigate();
  const location = useLocation();

  const { id: pedidoId, total } = location.state || {};

  const [qrDataURL, setQrDataURL] = useState("");
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================================================
  // 📌 Validación
  // ================================================================
  if (!pedidoId) {
    return (
      <div className="ticket-container">
        <p className="ticket-error">❌ No se encontró información del pedido.</p>
      </div>
    );
  }

  // ================================================================
  // 🧾 Generar QR con formato interno
  // ================================================================
  useEffect(() => {
    const generarQR = async () => {
      try {
        const qr = await QRCode.toDataURL(`fastorder-pedido:${pedidoId}`);
        setQrDataURL(qr);
      } catch (err) {
        console.error("❌ Error generando QR:", err);
      }
    };

    generarQR();
  }, [pedidoId]);

  // ================================================================
  // 📡 Cargar ticket desde backend
  // ================================================================
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/ticket`
        );

        const data = await res.json();
        setPedido(data?.data || null);
      } catch (err) {
        console.error("❌ Error cargando ticket:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [pedidoId]);

  // ================================================================
  // ⏳ Loading state
  // ================================================================
  if (loading) {
    return (
      <div className="ticket-container">
        <div className="ticket-card glass loading">
          Cargando ticket…
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="ticket-container">
        <p className="ticket-error">❌ No se pudo cargar el ticket del pedido.</p>
      </div>
    );
  }

  // ================================================================
  // 🎨 Render principal
  // ================================================================
  return (
    <div className="ticket-container">

      <div className="ticket-card glass animate-fade">

        {/* TÍTULO */}
        <h1 className="ticket-title">Pedido Confirmado</h1>
        <p className="ticket-subtitle">
          #{pedido.numero || pedidoId}
        </p>

        {/* QR */}
        {qrDataURL && (
          <div className="ticket-qr-wrapper">
            <img src={qrDataURL} alt="QR del pedido" className="ticket-qr" />
          </div>
        )}

        {/* INFO */}
        <div className="ticket-info">
          <p><strong>Mesa:</strong> {pedido.mesa || "—"}</p>
          <p><strong>Tipo:</strong> {pedido.tipoPedido === "llevar" ? "Para llevar" : "En mesa"}</p>
          <p><strong>Método de pago:</strong> {pedido.metodoPago}</p>
        </div>

        {/* ITEMS */}
        <div className="ticket-items">
          {pedido.items?.map((item) => (
            <div key={item.id} className="ticket-item">
              <span>{item.cantidad} × {item.producto?.nombre}</span>
              <span>${(item.cantidad * item.producto.precio).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="ticket-total">
          <span>Total</span>
          <strong>${total.toLocaleString()}</strong>
        </div>

        {/* BOTÓN */}
        <button
          className="ticket-btn"
          onClick={() =>
            navigate("/estado-pedido", { state: { id: pedidoId } })
          }
        >
          Ver estado del pedido
        </button>

      </div>
    </div>
  );
}
