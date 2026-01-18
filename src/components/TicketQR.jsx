// ======================================================================
// 🎫 TicketQR.jsx – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Componente reusable para mostrar un código QR premium:
//  • Estilo glass UI
//  • Animación suave
//  • Generación dinámica del QR
//  • Manejo de errores y fallback
// ======================================================================

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import PropTypes from "prop-types";

import "../styles/TicketDigital.css"; // Asegura estilos QR premium

export default function TicketQR({ value, size = 180 }) {
  const [qrDataURL, setQrDataURL] = useState("");

  // ================================================================
  // 🎨 Generar QR dinámico
  // ================================================================
  useEffect(() => {
    if (!value) return;

    const generarQR = async () => {
      try {
        const qr = await QRCode.toDataURL(value, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff00", // transparente
          },
        });

        setQrDataURL(qr);
      } catch (err) {
        console.error("❌ Error generando QR:", err);
      }
    };

    generarQR();
  }, [value, size]);

  // ================================================================
  // ⛔ Fallback
  // ================================================================
  if (!value) {
    return (
      <div className="ticket-qr-fallback">
        <p>QR no disponible</p>
      </div>
    );
  }

  // ================================================================
  // 🎨 Render QR Premium
  // ================================================================
  return (
    <div className="ticket-qr-container animate-fade">
      {qrDataURL ? (
        <img
          src={qrDataURL}
          alt="Código QR del pedido"
          className="ticket-qr-img"
          style={{ width: size, height: size }}
        />
      ) : (
        <div className="ticket-qr-loading">Generando QR…</div>
      )}
    </div>
  );
}

// ================================================================
// 🧩 PropTypes (control enterprise)
// ================================================================
TicketQR.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
};
