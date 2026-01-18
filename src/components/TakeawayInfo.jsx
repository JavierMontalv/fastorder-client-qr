// ======================================================================
// 📦 TakeawayInfo.jsx – FASTORDER Client-QR (Enterprise 2026)
// ----------------------------------------------------------------------
// Componente premium para pedidos "Para llevar":
//  • Muestra tiempo estimado configurado por el restaurante
//  • Indica punto de recogida con diseño tipo Starbucks Pickup
//  • Instrucciones personalizadas
//  • Compatible con modo oscuro / Glass UI
// ======================================================================

// Props esperadas:
//  tiempo → minutos estimados
//  puntoRecogida → texto ("Mostrador Principal", "Caja 2", etc.)
//  instrucciones → texto libre
export default function TakeawayInfo({ tiempo, puntoRecogida, instrucciones }) {
  return (
    <div className="takeaway-card">
      <h3 className="takeaway-title">🛍 Pedido para llevar</h3>

      {/* Tiempo estimado */}
      {tiempo && (
        <div className="takeaway-row">
          <span className="takeaway-label">Tiempo estimado:</span>
          <span className="takeaway-value">{tiempo} min</span>
        </div>
      )}

      {/* Punto de recogida */}
      {puntoRecogida && (
        <div className="takeaway-row">
          <span className="takeaway-label">Punto de recogida:</span>
          <span className="takeaway-value">{puntoRecogida}</span>
        </div>
      )}

      {/* Instrucciones */}
      {instrucciones && (
        <div className="takeaway-instrucciones">
          <h4>Instrucciones</h4>
          <p>{instrucciones}</p>
        </div>
      )}
    </div>
  );
}
