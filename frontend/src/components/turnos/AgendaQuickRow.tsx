import { useEffect, useState, useMemo } from 'react';
import { turnoLink } from '../../utils/turno-link';
import { useAuth } from '../../context/AuthContext';

import {
  getAgendaAvailability,
  type AgendaChange,
  type AgendaProposal,
  type AffectedTurno,
  type GrupoFechaDisponibilidad,
  type SlotDisponibilidadOpcion,
} from '../../services/agenda-impacto.service';

import {
  agendaDateTime,
  agendaToday,
} from '../../utils/agenda-display';

import { authError } from '../../utils/auth-errors';
import { formatProfesionalName } from '../../utils/profesional-format';

interface Props {
  turno: AffectedTurno;
  cambio: AgendaChange;
  propuesta?: AgendaProposal;
  busy: boolean;
  revision: number;
  onChoose: (proposal: AgendaProposal) => void;
}

const SEARCH_WINDOWS = [
  { label: '7 días', value: 7 },
  { label: '14 días', value: 14 },
  { label: '30 días', value: 30 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
];

export default function AgendaQuickRow({
  turno,
  cambio,
  propuesta,
  busy,
  revision,
  onChoose,
}: Props) {
  const { user } = useAuth();

  // Ventana de días de búsqueda y fecha específica opcional
  const [dias, setDias] = useState<number>(30);
  const [fechaEspecifica, setFechaEspecifica] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Resultados de disponibilidad
  const [gruposFecha, setGruposFecha] = useState<GrupoFechaDisponibilidad[]>([]);
  const [totalDisponibles, setTotalDisponibles] = useState<number>(0);
  const [version, setVersion] = useState<number>(turno.version);

  // Estados visuales de la consulta
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [retry, setRetry] = useState<number>(0);

  // Filtro de búsqueda rápida por fecha dentro de los resultados cargados
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  // Permite reprogramar únicamente turnos futuros no finalizados
  const editable =
    !turno.estado.es_estado_final &&
    Date.parse(turno.fecha_hora_inicio) > Date.now();

  // Consulta la disponibilidad al cambiar la ventana de días, la fecha o el turno
  useEffect(() => {
    let active = true;

    setGruposFecha([]);
    setTotalDisponibles(0);
    setError('');

    if (!editable) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const params = fechaEspecifica ? { fecha: fechaEspecifica } : { dias };

    void getAgendaAvailability(cambio, turno.id_turno, params)
      .then((data) => {
        if (!active) return;

        // Detecta cambios concurrentes en la versión del turno
        if (data.version !== turno.version) {
          setError(
            'El turno cambió. Usá «Actualizar afectados» antes de elegir un nuevo horario.'
          );
          return;
        }

        setVersion(data.version);
        setTotalDisponibles(data.total_disponibles);
        setGruposFecha(data.agrupadas_por_fecha || []);
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    dias,
    fechaEspecifica,
    cambio,
    turno.id_turno,
    turno.version,
    editable,
    revision,
    retry,
  ]);

  // Selección actual de la propuesta
  const selectedInicio = propuesta?.destino?.fecha_hora_inicio;

  const handleSelectSlot = (slot: SlotDisponibilidadOpcion) => {
    onChoose({
      id_turno: turno.id_turno,
      version,
      destino: {
        id_horario: slot.id_horario,
        fecha_hora_inicio: slot.fecha_hora_inicio,
        fecha_hora_fin: slot.fecha_hora_fin,
      },
    });
  };

  const handleClearSelection = () => {
    onChoose({
      id_turno: turno.id_turno,
      version,
      destino: null,
    });
  };

  // Filtrado de grupos según filtro de texto si se escribe una fecha
  const filteredGrupos = useMemo(() => {
    if (!filtroFecha.trim()) return gruposFecha;
    const term = filtroFecha.toLowerCase();
    return gruposFecha.filter(
      (g) =>
        g.fecha.includes(term) ||
        g.fecha_formateada.toLowerCase().includes(term) ||
        g.dia_semana.toLowerCase().includes(term)
    );
  }, [gruposFecha, filtroFecha]);

  return (
    <article className="border rounded p-3 h-100 bg-white shadow-sm text-break d-flex flex-column justify-content-between">
      <div>
        {/* Cabecera del turno afectado */}
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h6 className="mb-0 fw-bold text-dark">
              {turno.paciente.persona.apellidos}, {turno.paciente.persona.nombres}
              {turno.paciente.persona.dni && (
                <span className="badge text-bg-light border text-muted ms-2 fw-normal">
                  DNI: {turno.paciente.persona.dni}
                </span>
              )}
            </h6>
            <div className="small text-muted mt-1">
              <i className="bi bi-hospital me-1" />
              {turno.salita.nombre} · {turno.especialidad.nombre}
            </div>
            <div className="small text-muted">
              <i className="bi bi-person me-1" />
              {formatProfesionalName(turno.profesional)}
            </div>
          </div>

          <span
            className={`badge ${
              propuesta?.destino
                ? 'text-bg-success'
                : 'text-bg-warning'
            }`}
          >
            {propuesta?.destino ? 'Listo para revisar' : 'Pendiente de horario'}
          </span>
        </div>

        {/* Horario actual afectado */}
        <div className="p-2 border rounded bg-danger-subtle border-danger-subtle mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-calendar-x text-danger fs-5" />
            <div>
              <span className="small text-danger fw-semibold d-block">Turno afectado</span>
              <strong className="text-dark">{agendaDateTime(turno.fecha_hora_inicio)}</strong>
              <span className="small text-muted ms-2">({turno.estado.nombre})</span>
            </div>
          </div>
        </div>

        {!editable ? (
          <div className="alert alert-secondary small" role="alert">
            <i className="bi bi-info-circle me-1" />
            El turno ya comenzó o se encuentra en estado final. Requiere resolución manual directa.
          </div>
        ) : (
          <>
            {/* Selector de ventana de búsqueda (7, 14, 30, 60, 90 días) */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-bold mb-0">
                  <i className="bi bi-search me-1 text-primary" />
                  Ventana de búsqueda de disponibilidad
                </label>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none small"
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    if (showDatePicker) setFechaEspecifica('');
                  }}
                >
                  {showDatePicker ? 'Buscar por ventana de días' : 'Buscar fecha puntual'}
                </button>
              </div>

              {!showDatePicker ? (
                <div className="btn-group btn-group-sm w-100" role="group">
                  {SEARCH_WINDOWS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      disabled={busy || loading}
                      className={`btn ${
                        dias === w.value && !fechaEspecifica
                          ? 'btn-primary fw-semibold'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => {
                        setFechaEspecifica('');
                        setDias(w.value);
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light">Fecha puntual:</span>
                  <input
                    type="date"
                    className="form-control"
                    value={fechaEspecifica}
                    min={agendaToday()}
                    disabled={busy || loading}
                    onChange={(e) => setFechaEspecifica(e.target.value)}
                  />
                  {fechaEspecifica && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setFechaEspecifica('')}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ESTADO 1: Buscando disponibilidad */}
            {loading && (
              <div className="text-center py-4 border rounded bg-light mb-3">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                <span className="small text-muted">
                  Buscando horarios disponibles en los próximos {dias} días...
                </span>
              </div>
            )}

            {/* ESTADO 2: Error al consultar */}
            {!loading && error && (
              <div className="alert alert-danger p-2 small mb-3" role="alert">
                <div className="d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-exclamation-triangle-fill me-1" />
                    {error}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    disabled={busy}
                    onClick={() => setRetry((v) => v + 1)}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* ESTADO 3: Sin horarios disponibles */}
            {!loading && !error && totalDisponibles === 0 && (
              <div className="border rounded p-3 bg-light text-center mb-3">
                <i className="bi bi-calendar-minus text-muted fs-3 d-block mb-1" />
                <strong className="text-dark small d-block">No hay horarios disponibles</strong>
                <p className="small text-muted mb-2">
                  No se encontraron franjas libres en los próximos {dias} días para este profesional y salita.
                </p>
                {dias < 90 && !fechaEspecifica && (
                  <div className="d-flex justify-content-center gap-2">
                    {dias < 60 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setDias(60)}
                      >
                        Ampliar a 60 días
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setDias(90)}
                    >
                      Ampliar a 90 días
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ESTADO 4: Horarios encontrados agrupados por fecha */}
            {!loading && !error && totalDisponibles > 0 && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge text-bg-success-subtle text-success border border-success-subtle">
                    <i className="bi bi-check2-circle me-1" />
                    {totalDisponibles} horario{totalDisponibles === 1 ? '' : 's'} disponible{totalDisponibles === 1 ? '' : 's'} en {gruposFecha.length} día{gruposFecha.length === 1 ? '' : 's'}
                  </span>
                  {gruposFecha.length > 4 && (
                    <input
                      type="text"
                      className="form-control form-control-sm w-auto"
                      placeholder="Filtrar por día..."
                      value={filtroFecha}
                      onChange={(e) => setFiltroFecha(e.target.value)}
                      style={{ maxWidth: '140px', fontSize: '0.8rem' }}
                    />
                  )}
                </div>

                <div
                  className="border rounded p-2 overflow-auto bg-light"
                  style={{ maxHeight: '240px' }}
                >
                  {filteredGrupos.map((grupo) => (
                    <div key={grupo.fecha} className="mb-2 last-mb-0 bg-white p-2 rounded border">
                      <div className="d-flex justify-content-between align-items-center pb-1 mb-1 border-bottom">
                        <span className="small fw-bold text-dark">
                          <i className="bi bi-calendar-event me-1 text-primary" />
                          {grupo.fecha_formateada}
                        </span>
                        <span className="badge text-bg-light border text-muted">
                          {grupo.slots.length} turnos
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {grupo.slots.map((slot) => {
                          const isSelected = selectedInicio === slot.fecha_hora_inicio;
                          return (
                            <button
                              key={slot.fecha_hora_inicio}
                              type="button"
                              disabled={busy}
                              className={`btn btn-sm py-0 px-2 ${
                                isSelected
                                  ? 'btn-success fw-bold shadow-sm'
                                  : 'btn-outline-primary'
                              }`}
                              style={{ fontSize: '0.82rem' }}
                              onClick={() => handleSelectSlot(slot)}
                            >
                              {isSelected && <i className="bi bi-check me-1" />}
                              {slot.hora_inicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pie: Resumen del horario asignado y acciones */}
      {propuesta?.destino && (
        <div className="p-2 border rounded bg-success-subtle border-success-subtle mt-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="small text-success fw-bold d-block">
                <i className="bi bi-check-circle-fill me-1" />
                Nuevo horario propuesto:
              </span>
              <strong className="text-dark small">
                {agendaDateTime(propuesta.destino.fecha_hora_inicio)}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={busy}
              onClick={handleClearSelection}
            >
              Dejar pendiente
            </button>
          </div>
        </div>
      )}
      {/* Permite consultar el detalle del turno según el rol. */}
      {user?.rol !== 'RECEPCION' && (
        <a
          className="small d-inline-block mt-2 text-decoration-none"
          href={turnoLink(turno)}
          target="_blank"
          rel="noreferrer"
        >
          <i className="bi bi-box-arrow-up-right me-1" />
          Ver detalle (otra pestaña)
        </a>
      )}
    </article>
  );
}
