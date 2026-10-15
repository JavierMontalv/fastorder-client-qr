import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';

function formatearPrecioExtra(valor) {
  const numero = Number(valor || 0);
  if (!numero) return '';
  return `+ $${numero.toLocaleString('es-CO')}`;
}

function obtenerSeleccionGrupo(opcionesSeleccionadas, grupoId) {
  return Array.isArray(opcionesSeleccionadas?.[grupoId]) ? opcionesSeleccionadas[grupoId] : [];
}

function buildGroupMeta(grupo) {
  if (grupo.tipoSeleccion === 'unica') return 'Selecciona 1 opción.';

  const maxSeleccion = Number(grupo.maxSeleccion || 0);
  return maxSeleccion > 0
    ? `Puedes elegir hasta ${maxSeleccion} opciones.`
    : 'Puedes elegir varias opciones.';
}

function obtenerEstiloControl(grupo) {
  if (['mas', 'casilla', 'circulo'].includes(grupo?.estiloControl)) {
    return grupo.estiloControl;
  }
  return grupo?.tipoSeleccion === 'unica' ? 'circulo' : 'mas';
}

function ControlSeleccion({ estilo, activa }) {
  if (estilo === 'circulo') {
    return (
      <span className={`opcion-selector selector-circulo ${activa ? 'is-active' : ''}`}>
        <span />
      </span>
    );
  }

  if (estilo === 'casilla') {
    return (
      <span className={`opcion-selector selector-casilla ${activa ? 'is-active' : ''}`}>
        {activa ? <Check aria-hidden="true" /> : null}
      </span>
    );
  }

  return (
    <span className={`opcion-selector selector-mas ${activa ? 'is-active' : ''}`}>
      {activa ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
    </span>
  );
}

export default function ProductoConfiguracionAcompanantes({
  gruposOpciones = [],
  opcionesSeleccionadas = {},
  onChange
}) {
  const [gruposCerrados, setGruposCerrados] = useState({});

  if (!Array.isArray(gruposOpciones) || gruposOpciones.length === 0) return null;

  const actualizarGrupo = (grupo, opcion) => {
    const seleccionActual = obtenerSeleccionGrupo(opcionesSeleccionadas, grupo.id);
    const estaActiva = seleccionActual.some((item) => item.id === opcion.id);
    const maxSeleccion = Number(grupo.maxSeleccion || 0);

    let siguienteSeleccion = [];

    if (grupo.tipoSeleccion === 'unica') {
      siguienteSeleccion = estaActiva ? [] : [opcion];
    } else if (estaActiva) {
      siguienteSeleccion = seleccionActual.filter((item) => item.id !== opcion.id);
    } else if (maxSeleccion > 0 && seleccionActual.length >= maxSeleccion) {
      siguienteSeleccion = [...seleccionActual.slice(1), opcion];
    } else {
      siguienteSeleccion = [...seleccionActual, opcion];
    }

    onChange((previo) => ({
      ...previo,
      [grupo.id]: siguienteSeleccion
    }));
  };

  return (
    <div className="producto-config-groups">
      {gruposOpciones.map((grupo) => {
        const seleccionGrupo = obtenerSeleccionGrupo(opcionesSeleccionadas, grupo.id);
        const maxSeleccion = Number(grupo.maxSeleccion || 0);
        const estiloControl = obtenerEstiloControl(grupo);
        const cerrado = Boolean(gruposCerrados[grupo.id]);
        const minimo = Math.max(Number(grupo.minSeleccion || 0), grupo.obligatorio ? 1 : 0);
        const completo = minimo > 0 && seleccionGrupo.length >= minimo;

        return (
          <section key={grupo.id} className="bloque-config premium premium-group-card">
            <div className="bloque-config-head premium">
              <div>
                <h3>{grupo.tituloCliente || grupo.nombre}</h3>
                <p className="bloque-config-meta">{buildGroupMeta(grupo)}</p>
              </div>

              <div className="bloque-config-head-actions">
                {completo ? <span className="bloque-config-ready">Listo</span> : null}
                <button
                  type="button"
                  className="bloque-config-toggle"
                  onClick={() =>
                    setGruposCerrados((previo) => ({ ...previo, [grupo.id]: !cerrado }))
                  }
                  aria-label={cerrado ? `Abrir ${grupo.nombre}` : `Cerrar ${grupo.nombre}`}
                >
                  {cerrado ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className={`bloque-config-options premium ${cerrado ? 'is-collapsed' : ''}`}>
              {(grupo.opciones || []).map((opcion) => {
                const activa = seleccionGrupo.some((item) => item.id === opcion.id);
                const bloqueada =
                  !activa &&
                  grupo.tipoSeleccion === 'multiple' &&
                  maxSeleccion > 0 &&
                  seleccionGrupo.length >= maxSeleccion;

                return (
                  <button
                    key={opcion.id}
                    type="button"
                    className={`opcion premium rich ${activa ? 'activa' : ''}`}
                    onClick={() => actualizarGrupo(grupo, opcion)}
                    disabled={bloqueada}
                    aria-pressed={activa}
                    aria-label={`${opcion.nombre}${
                      Number(opcion.precioExtra || 0) > 0
                        ? `, adicional ${formatearPrecioExtra(opcion.precioExtra)}`
                        : ''
                    }`}
                  >
                    <div className="opcion-copy stacked">
                      <span className="opcion-nombre">{opcion.nombre}</span>
                      {Number(opcion.precioExtra || 0) > 0 ? (
                        <span className="precio">{formatearPrecioExtra(opcion.precioExtra)}</span>
                      ) : null}
                    </div>

                    <ControlSeleccion estilo={estiloControl} activa={activa} />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
