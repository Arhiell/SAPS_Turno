import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  createOwnTurno,
  getDisponibilidad,
} from '../../services/turnos.service';

import type {
  DisponibilidadSlot,
} from '../../types/turno.types';

import { useAgendaSocket } from '../../context/AgendaSocketContext';
import {
  authError,
} from '../../utils/auth-errors';

export default function PatientBookingSlots({
  date,
  professional,
  specialty,
  clinic,
  patientId,
  refreshKey = 0,
  onBusyChange,
}: {
  date: string;
  professional: string;
  specialty: string;
  clinic: string;
  patientId?: string;
  refreshKey?: number;
  onBusyChange: (busy: boolean) => void;
}) {
  // Horarios disponibles devueltos por la API.
  const [slots, setSlots] = useState<DisponibilidadSlot[]>([]);

  // Horario seleccionado por el paciente.
  const [selected, setSelected] = useState('');

  // Motivo opcional de la consulta.
  const [reason, setReason] = useState('');

  // Estados de carga y operación.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Mensaje de error.
  const [error, setError] = useState('');

  // Detalle de turno pendiente conflictivo.
  const [pendingTurno, setPendingTurno] = useState<{
    id_turno?: string;
    fecha?: string;
    hora?: string;
    especialidad?: string;
    profesional?: string;
    salita?: string;
    estado?: string;
  } | null>(null);

  // Permite volver a consultar los horarios.
  const [revision, setRevision] = useState(0);

  const navigate = useNavigate();

  // Actualización reactiva en tiempo real por WebSockets
  const { ultimoEvento, resyncTick } = useAgendaSocket();

  useEffect(() => {
    if (!ultimoEvento) return;
    if (
      (!ultimoEvento.id_profesional || ultimoEvento.id_profesional === professional) &&
      (!ultimoEvento.id_salita || ultimoEvento.id_salita === clinic)
    ) {
      setRevision((v) => v + 1);
    }
  }, [ultimoEvento, professional, clinic]);

  useEffect(() => {
    if (resyncTick > 0) {
      setRevision((v) => v + 1);
    }
  }, [resyncTick]);

  // ========================================
  // CARGA DE HORARIOS DISPONIBLES
  // ========================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setPendingTurno(null);
    setSlots([]);

    void getDisponibilidad(
      date,
      professional,
      specialty,
      clinic,
      patientId
    )
      .then((response) => {
        if (!active) return;

        // Filtra los horarios que ya pasaron si la fecha seleccionada es hoy
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        const isToday = date === todayStr;
        const currentMinutes = isToday
          ? (() => {
              const arParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
              }).formatToParts(now);
              const hour = Number(arParts.find((p) => p.type === 'hour')?.value ?? '0');
              const min = Number(arParts.find((p) => p.type === 'minute')?.value ?? '0');
              return hour * 60 + min;
            })()
          : -1;

        const availableSlots = response.slots.filter((s) => {
          if (s.estado !== 'DISPONIBLE') return false;
          if (isToday) {
            const [h, m] = s.hora_inicio.split(':').map(Number);
            if (h * 60 + m <= currentMinutes) return false;
          }
          return true;
        });

        setSlots(availableSlots);
        setSelected((current) =>
          availableSlots.some((slot) => slot.hora_inicio === current) ? current : ''
        );
      })
      .catch((cause) => {
        if (active) {
          const data = (cause as any)?.response?.data;
          if (
            data?.code === 'PACIENTE_TURNO_PENDIENTE' ||
            data?.code === 'SPECIALTY_APPOINTMENT_PENDING' ||
            data?.data?.turno_pendiente
          ) {
            setPendingTurno(data?.data?.turno_pendiente || {});
            setError('');
          } else {
            setPendingTurno(null);
            setError(authError(cause));
          }
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
    date,
    professional,
    specialty,
    clinic,
    patientId,
    revision,
    refreshKey,
  ]);

  // ========================================
  // RESERVA DEL TURNO
  // ========================================

  const book = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    // Evita solicitudes duplicadas o sin horario.
    if (
      busy ||
      !selected
    ) {
      return;
    }

    setBusy(true);
    onBusyChange(true);
    setError('');

    try {
      // El servidor resuelve el paciente
      // y revalida el horario al reservar.
      const response =
        await createOwnTurno({
          ...(patientId ? { id_paciente: patientId } : {}),
          id_profesional:
            professional,

          id_especialidad:
            specialty,

          id_salita:
            clinic,

          fecha_hora_inicio:
            `${date}T${selected.slice(0, 5)}:00-03:00`,

          ...(reason.trim()
            ? {
                motivo_consulta:
                  reason.trim(),
              }
            : {}),
        });

      // Redirige al detalle del turno creado.
      navigate(
        `/mis-turnos/${response.data.turno.id_turno}`,
        {
          state: {
            created: true,
          },
        }
      );
    } catch (cause) {
      const data = (cause as any)?.response?.data;
      if (
        data?.code === 'PACIENTE_TURNO_PENDIENTE' ||
        data?.code === 'SPECIALTY_APPOINTMENT_PENDING' ||
        data?.data?.turno_pendiente
      ) {
        setPendingTurno(data?.data?.turno_pendiente || {});
        setError('');
      } else {
        setPendingTurno(null);
        setError(authError(cause));
      }

      // Limpia el horario seleccionado
      // para obligar a elegir uno nuevamente.
      setSelected('');
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  };

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className="mt-4">
      <h3 className="h6">
        Horarios disponibles
      </h3>

      {/* Estado de carga. */}
      {loading && (
        <div className="card border-0 shadow-sm p-3 text-center text-muted" role="status">
          <div>
            <div className="spinner-border spinner-border-sm text-success me-2" aria-hidden="true" />
            <span className="align-middle">Consultando disponibilidad…</span>
          </div>
        </div>
      )}

      {/* Aviso estructurado si ya tiene un turno pendiente */}
      {pendingTurno && (
        <div className="card border-warning bg-warning bg-opacity-10 shadow-sm p-3 p-md-4 mb-4 rounded-3" role="alert">
          <div className="d-flex align-items-start gap-3">
            <div className="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
              <i className="bi bi-clock-history fs-5" aria-hidden="true" />
            </div>
            <div className="flex-grow-1">
              <h4 className="h5 fw-bold text-dark mb-1">Ya tenés un turno pendiente</h4>
              <p className="text-secondary small mb-3">
                Actualmente tenés un turno en espera. Primero debés resolver ese turno antes de solicitar uno nuevo.
              </p>

              {(pendingTurno.fecha || pendingTurno.hora || pendingTurno.especialidad || pendingTurno.profesional || pendingTurno.estado) && (
                <div className="bg-white rounded-2 p-3 border border-warning-subtle mb-3">
                  <div className="row g-2 small">
                    {pendingTurno.fecha && (
                      <div className="col-sm-6">
                        <span className="text-muted">Fecha: </span>
                        <strong className="text-dark">{pendingTurno.fecha}</strong>
                      </div>
                    )}
                    {pendingTurno.hora && (
                      <div className="col-sm-6">
                        <span className="text-muted">Hora: </span>
                        <strong className="text-dark">{pendingTurno.hora} hs</strong>
                      </div>
                    )}
                    {pendingTurno.especialidad && (
                      <div className="col-sm-6">
                        <span className="text-muted">Especialidad: </span>
                        <strong className="text-dark">{pendingTurno.especialidad}</strong>
                      </div>
                    )}
                    {pendingTurno.profesional && (
                      <div className="col-sm-6">
                        <span className="text-muted">Profesional: </span>
                        <strong className="text-dark">{pendingTurno.profesional}</strong>
                      </div>
                    )}
                    {pendingTurno.salita && (
                      <div className="col-sm-6">
                        <span className="text-muted">Salita: </span>
                        <strong className="text-dark">{pendingTurno.salita}</strong>
                      </div>
                    )}
                    {pendingTurno.estado && (
                      <div className="col-sm-6">
                        <span className="text-muted">Estado: </span>
                        <span className="badge bg-warning text-dark">{pendingTurno.estado}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-dark btn-sm d-inline-flex align-items-center gap-1.5"
                  onClick={() => navigate(pendingTurno.id_turno ? `/mis-turnos/${pendingTurno.id_turno}` : (patientId ? `/mis-turnos?paciente=${patientId}` : '/mis-turnos'))}
                >
                  <i className="bi bi-calendar-check" />
                  Ir a Mis turnos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de error y opción de reintento. */}
      {error && !pendingTurno && (
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
            disabled={busy || loading}
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

      {/* No existen horarios disponibles. */}
      {!loading &&
        !error &&
        !slots.length && (
          <div className="alert alert-info d-flex align-items-center gap-2 mb-0" role="status">
            <i className="bi bi-info-circle flex-shrink-0" aria-hidden="true" />
            <span>No hay horarios disponibles para esta fecha. Probá seleccionando otro día o profesional.</span>
          </div>
        )}

      {/* Formulario de reserva. */}
      {!loading &&
        !error &&
        slots.length > 0 && (
          <form
            onSubmit={(event) =>
              void book(event)
            }
          >
            <fieldset disabled={busy}>
              <legend className="visually-hidden">
                Elegí un horario
              </legend>

              {/* Selección del horario en cuadrícula accesible. */}
              <div className="d-flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Horarios disponibles">
                {slots.map(
                  (slot) => {
                    const isSelected = selected === slot.hora_inicio;
                    return (
                      <button
                        key={slot.hora_inicio}
                        type="button"
                        className={`btn btn-sm ${
                          isSelected ? 'btn-success fw-bold' : 'btn-outline-success'
                        } d-inline-flex align-items-center justify-content-center gap-1 px-3 py-2 text-nowrap`}
                        style={{ minWidth: '82px', minHeight: '40px' }}
                        onClick={() => setSelected(slot.hora_inicio)}
                        aria-pressed={isSelected}
                      >
                        <i className={`bi ${isSelected ? 'bi-check2-circle' : 'bi-clock'}`} aria-hidden="true" />
                        <span>{slot.hora_inicio.slice(0, 5)}</span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Motivo opcional de la consulta. */}
              <label className="form-label w-100">
                Motivo de consulta (opcional)

                <textarea
                  className="form-control mt-1"
                  maxLength={2000}
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* Resumen antes de confirmar. */}
              {selected && (
                <p role="status">
                  Vas a solicitar un turno para el{' '}
                  {date
                    .split('-')
                    .reverse()
                    .join('/')}{' '}
                  a las{' '}
                  {selected.slice(0, 5)}.
                </p>
              )}

              {/* Confirmación de la reserva. */}
              <button
                className="btn btn-saps text-nowrap d-inline-flex align-items-center justify-content-center px-4"
                style={{ minHeight: '44px' }}
                disabled={!selected || busy}
              >
                {busy
                  ? 'Reservando…'
                  : 'Confirmar solicitud'}
              </button>
            </fieldset>
          </form>
        )}
    </div>
  );
}
