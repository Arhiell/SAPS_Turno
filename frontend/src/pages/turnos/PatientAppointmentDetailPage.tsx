import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
  useLocation,
} from 'react-router-dom';

import {
  getTurnoById,
  getTurnoHistory,
} from '../../services/turnos.service';

import type {
  AppointmentHistory,
  Turno,
} from '../../types/turno.types';

import TurnoCard from '../../components/ui/TurnoCard';
import TurnoJustificacionCard from '../../components/ui/TurnoJustificacionCard';
import JustificarInasistenciaModal from '../../components/ui/JustificarInasistenciaModal';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import { formatFechaHora } from '../../utils/agenda-display';

// Utiliza el formato uniforme del paciente
const format = (value: string) => formatFechaHora(value);

// ========================================
// NOMBRES DE ACCIONES DEL HISTORIAL
// ========================================

// Traduce los códigos internos del historial
// a textos comprensibles para el paciente.
const actions: Record<string, string> = {
  CREACION: 'Turno creado',
  CREADO: 'Turno creado',
  REPROGRAMACION: 'Reprogramado',
  REPROGRAMADO: 'Reprogramado',
  CAMBIO_PROFESIONAL: 'Cambio de profesional',
  CANCELACION: 'Cancelado',
  CANCELADO: 'Cancelado',
  CAMBIO_ESTADO: 'Cambio de estado',
  ATENDIDO: 'Atendido',
  NO_ASISTIO: 'No asistió',
  ACTUALIZACION: 'Datos actualizados',
};

export default function PatientAppointmentDetailPage() {
  // Obtiene el identificador del turno desde la URL.
  const {
    id,
  } = useParams();

  // Permite consultar el estado enviado
  // durante la navegación.
  const location = useLocation();

  // ========================================
  // ESTADO DE LA PÁGINA
  // ========================================

  const [
    turno,
    setTurno,
  ] = useState<Turno | null>(
    null
  );

  const [
    history,
    setHistory,
  ] = useState<AppointmentHistory[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    historyError,
    setHistoryError,
  ] = useState('');

  // Permite volver a cargar el turno
  // y su historial.
  const [
    revision,
    setRevision,
  ] = useState(0);

  const [
    justificarOpen,
    setJustificarOpen,
  ] = useState(false);

  // Sincronización automática en segundo plano ante cambios del turno
  const { ultimoEvento, resyncTick } = useAgendaSocket();

  useEffect(() => {
    if (!ultimoEvento || !id) return;
    if (ultimoEvento.id_turno === id) {
      setRevision((v) => v + 1);
    }
  }, [ultimoEvento, id]);

  useEffect(() => {
    if (resyncTick > 0) {
      setRevision((v) => v + 1);
    }
  }, [resyncTick]);

  // ========================================
  // CARGA DEL TURNO
  // ========================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setHistoryError('');
    setTurno(null);
    setHistory([]);

    // El detalle necesita un identificador de turno.
    if (!id) {
      setError(
        'No se especificó un turno.'
      );

      setLoading(false);
      return;
    }

    void (async () => {
      try {
        // Obtiene los datos principales del turno.
        const response =
          await getTurnoById(id);

        if (!active) {
          return;
        }

        setTurno(
          response.data.turno
        );

        // El historial se carga de forma independiente.
        try {
          const rows =
            await getTurnoHistory(id);

          if (active) {
            setHistory(
              rows
            );
          }
        } catch {
          if (active) {
            setHistoryError(
              'No se pudo cargar el historial de cambios.'
            );
          }
        }
      } catch {
        if (active) {
          setError(
            'No se pudo cargar el turno o no está disponible para tu cuenta.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    // Evita actualizar el estado después
    // de desmontar el componente.
    return () => {
      active = false;
    };
  }, [
    id,
    revision,
  ]);

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <section>
      {/* Regreso al listado de turnos. */}
      <Link
        className="btn btn-outline-secondary mb-3 d-inline-flex align-items-center"
        to={turno ? `/mis-turnos?paciente=${turno.id_paciente}` : '/mis-turnos'}
      >
        <i className="bi bi-arrow-left me-2" />
        Volver a mis turnos
      </Link>

      <h1 className="h3 mb-4">
        Detalle del turno
      </h1>
      {turno && (
        <div className="card border-0 shadow-sm mb-4 bg-light p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <span className="text-muted small d-block">Paciente:</span>
              <strong className="text-dark">
                {turno.paciente?.persona?.apellidos}, {turno.paciente?.persona?.nombres}
              </strong>
              {turno.paciente?.persona?.dni && (
                <span className="text-muted small ms-2">· DNI {turno.paciente.persona.dni}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirma que el turno acaba de crearse. */}
      {location.state?.created && (
        <div
          className="alert alert-success"
          role="status"
        >
          Tu turno fue registrado correctamente.
        </div>
      )}

      {/* Estado de carga. */}
      {loading && (
        <div className="card border-0 shadow-sm p-4 text-center text-muted mb-4" role="status">
          <div>
            <div className="spinner-border spinner-border-sm text-success me-2" aria-hidden="true" />
            <span className="align-middle">Cargando turno…</span>
          </div>
        </div>
      )}

      {/* Error al cargar el turno. */}
      {error && (
        <div
          className="alert alert-danger d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 p-3 mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-danger flex-shrink-0" aria-hidden="true" />
            <span className="small">{error}</span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger flex-shrink-0 text-nowrap px-3 py-1 align-self-end align-self-sm-center"
            disabled={loading}
            onClick={() =>
              setRevision(
                (v) => v + 1
              )
            }
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                <span>Reintentando…</span>
              </>
            ) : (
              'Reintentar'
            )}
          </button>
        </div>
      )}

      {/* =====================================
          DETALLE DEL TURNO
          ===================================== */}

      {!loading && turno && (
        <>
          <TurnoCard
            turno={turno}
            patient
            detail
            onChanged={() =>
              setRevision(
                (v) => v + 1
              )
            }
          />

          {/* Motivo registrado si el turno fue cancelado. */}
          {turno.motivo_cancelacion && (
            <div className="alert alert-info mt-3 d-flex align-items-start gap-2">
              <i className="bi bi-info-circle flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <strong>Motivo de cancelación:</strong> {turno.motivo_cancelacion}
              </div>
            </div>
          )}

          {/* Aviso informativo si el horario ya pasó y no se puede cancelar. */}
          {Date.parse(turno.fecha_hora_inicio) <= Date.now() && !turno.estado.es_estado_final && (
            <div className="alert alert-light border mt-3 small text-secondary d-flex align-items-center gap-2">
              <i className="bi bi-info-circle flex-shrink-0 text-muted" aria-hidden="true" />
              <span>
                El horario programado para este turno ya transcurrió o está en curso. Para consultas o reprogramaciones, comunicate con la salita.
              </span>
            </div>
          )}

          {/* Información y gestión de inasistencia para el paciente */}
          {turno.estado.codigo === 'NO_ASISTIO' && (
            <div className="alert alert-warning mt-3 border-warning-subtle shadow-sm p-3 rounded-3">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-person-x-fill fs-4 text-warning flex-shrink-0" aria-hidden="true" />
                  <div>
                    <strong className="d-block text-dark">Inasistencia registrada en este turno</strong>
                    <span className="small text-secondary">
                      Si tuviste un motivo justificado, podés presentar una solicitud de justificación explicando lo sucedido y adjuntando documentación respaldatoria si corresponde.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning text-dark flex-shrink-0 text-nowrap d-inline-flex align-items-center gap-1.5"
                  onClick={() => setJustificarOpen(true)}
                >
                  <i className="bi bi-file-earmark-medical" aria-hidden="true" />
                  <span>Justificar inasistencia</span>
                </button>
              </div>
            </div>
          )}

          {/* Tarjeta de justificación médica (si existe) */}
          <div className="mt-3">
            <TurnoJustificacionCard
              idTurno={turno.id_turno}
              onUpdated={() => setRevision((v) => v + 1)}
            />
          </div>

          {/* Modal de justificación */}
          <JustificarInasistenciaModal
            idTurno={turno.id_turno}
            isOpen={justificarOpen}
            onClose={() => setJustificarOpen(false)}
            onSuccess={() => setRevision((v) => v + 1)}
          />

          {/* =================================
              HISTORIAL DE CAMBIOS
              ================================= */}

          <section className="patient-section mt-4">
            <h2 className="h5 mb-3">
              Historial de cambios
            </h2>

            {historyError ? (
              // Error específico del historial.
              <div
                className="alert alert-danger d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 p-3 mb-3 rounded-3 shadow-sm"
                role="alert"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-danger flex-shrink-0" aria-hidden="true" />
                  <span className="small">{historyError}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger flex-shrink-0 text-nowrap px-3 py-1 align-self-end align-self-sm-center"
                  onClick={() =>
                    setRevision(
                      (v) => v + 1
                    )
                  }
                >
                  Reintentar
                </button>
              </div>
            ) : !history.length ? (
              // Turno sin modificaciones registradas.
              <p>
                No hay cambios registrados para este
                turno.
              </p>
            ) : (
              // Historial cronológico del turno.
              <ol className="patient-history">
                {history.map(
                  (event) => (
                    <li key={event.id_historial}>
                      <strong>
                        {actions[event.accion] ??
                          event.accion.replaceAll(
                            '_',
                            ' '
                          )}
                      </strong>

                      {/* Fecha del evento. */}
                      <div>
                        <time dateTime={event.fecha}>
                          {format(
                            event.fecha
                          )}
                        </time>
                      </div>

                      {/* Estado registrado. */}
                      {event.estado_nombre && (
                        <small className="d-block">
                          Estado:{' '}
                          {event.estado_nombre}
                        </small>
                      )}

                      {/* Horario anterior cuando hubo
                          una reprogramación. */}
                      {event.fecha_hora_anterior && (
                        <small className="d-block">
                          Horario anterior:{' '}
                          {format(
                            event.fecha_hora_anterior
                          )}
                        </small>
                      )}

                      {/* Nuevo horario registrado. */}
                      {event.fecha_hora_nueva && (
                        <small className="d-block">
                          Horario registrado:{' '}
                          {format(
                            event.fecha_hora_nueva
                          )}
                        </small>
                      )}
                    </li>
                  )
                )}
              </ol>
            )}
          </section>
        </>
      )}
    </section>
  );
}
