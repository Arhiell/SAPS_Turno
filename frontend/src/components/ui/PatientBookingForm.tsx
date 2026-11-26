import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { getPatientProfessionals } from '../../services/profesionales.service';
import { getPatientAvailableDates, type PatientAvailableDates } from '../../services/turnos.service';

import type { PatientProfessional } from '../../types/profesional.types';

import PatientBookingSlots from './PatientBookingSlots';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import { authError } from '../../utils/auth-errors';

// Formatea las fechas utilizando la zona horaria argentina.
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00-03:00`));

// Permite seleccionar especialidad, profesional y fecha para reservar un turno.
export default function PatientBookingForm({
  clinic,
  patientId,
  onBusyChange,
}: {
  clinic: string;
  patientId?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  // Almacena los profesionales y las opciones seleccionadas.
  const [professionals, setProfessionals] = useState<
    PatientProfessional[]
  >([]);

  const [specialty, setSpecialty] = useState('');
  const [professional, setProfessional] = useState('');
  const [date, setDate] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [calendar, setCalendar] = useState<PatientAvailableDates['dias']>([]);
  const [proximaDisponibilidad, setProximaDisponibilidad] = useState<
    PatientAvailableDates['proxima_disponibilidad']
  >(null);

  // Controla los estados de carga y las solicitudes.
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [busy, setBusy] = useState(false);

  // Almacena los mensajes de error.
  const [error, setError] = useState('');
  const [datesError, setDatesError] = useState('');
  const [pendingConflict, setPendingConflict] = useState<string | null>(null);
  const [pendingTurno, setPendingTurno] = useState<{
    id_turno?: string;
    fecha?: string;
    hora?: string;
    especialidad?: string;
    profesional?: string;
    salita?: string;
    estado?: string;
  } | null>(null);

  // Permite actualizar la información de la agenda.
  const [revision, setRevision] = useState(0);

  // Sincronización en segundo plano con WebSockets
  const { ultimoEvento, ultimoEventoSalita, resyncTick } = useAgendaSocket();
  const lastEventKeyRef = useRef<string>(
    `${ultimoEvento?.id ?? ''}|${ultimoEventoSalita?.id ?? ''}`
  );
  const lastResyncTickRef = useRef<number>(resyncTick);

  useEffect(() => {
    if (busy) return;
    if (!ultimoEvento && !ultimoEventoSalita) return;
    const eventKey = `${ultimoEvento?.id ?? ''}|${ultimoEventoSalita?.id ?? ''}`;
    if (lastEventKeyRef.current === eventKey) return;
    lastEventKeyRef.current = eventKey;
    setRevision((v) => v + 1);
  }, [ultimoEvento, ultimoEventoSalita, busy]);

  useEffect(() => {
    if (busy) return;
    if (resyncTick > 0 && resyncTick !== lastResyncTickRef.current) {
      lastResyncTickRef.current = resyncTick;
      setRevision((v) => v + 1);
    }
  }, [resyncTick, busy]);

  // Actualiza al recuperar el foco de la ventana como salvaguarda
  useEffect(() => {
    if (busy) return;

    const refresh = () => {
      setRevision((value) => value + 1);
    };

    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, [busy]);

  // Obtiene los profesionales y especialidades disponibles.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    void getPatientProfessionals(undefined, patientId)
      .then((rows) => {
        if (!active) {
          return;
        }

        setProfessionals(rows);

        // Conserva la especialidad si continúa disponible.
        setSpecialty((current) =>
          rows.some((p) =>
            p.especialidades.some(
              (s) => s.id_especialidad === current
            )
          )
            ? current
            : ''
        );

        // Conserva el profesional si continúa disponible.
        setProfessional((current) =>
          rows.some(
            (p) => p.id_profesional === current
          )
            ? current
            : ''
        );
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
          setProfessionals([]);
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
  }, [clinic, patientId, revision]);

  // Consulta las fechas disponibles para la atención seleccionada.
  useEffect(() => {
    let active = true;

    setDatesError('');
    setPendingConflict(null);
    setPendingTurno(null);
    setCalendar([]);
    setProximaDisponibilidad(null);

    // Limpia las fechas cuando falta seleccionar una atención.
    if (!professional || !specialty) {
      setDates([]);
      setDate('');
      setLoadingDates(false);
      return;
    }

    setLoadingDates(true);

    void getPatientAvailableDates(
      professional,
      specialty,
      clinic,
      patientId
    )
      .then((result) => {
        if (!active) {
          return;
        }

        setDates(result.fechas);
        setCalendar(result.dias ?? []);
        setProximaDisponibilidad(result.proxima_disponibilidad ?? null);

        // Conserva la fecha seleccionada si sigue disponible.
        setDate((current) =>
          result.fechas.includes(current)
            ? current
            : result.fechas[0] ?? ''
        );
      })
      .catch((cause: unknown) => {
        if (active) {
          setDate('');
          setDates([]);
          setCalendar([]);
          setProximaDisponibilidad(null);

          if (axios.isAxiosError(cause)) {
            const status = cause.response?.status;
            const data = cause.response?.data as { code?: string; message?: string; data?: { turno_pendiente?: any } } | undefined;

            if (
              status === 409 &&
              (data?.code === 'SPECIALTY_APPOINTMENT_PENDING' ||
                data?.code === 'PACIENTE_TURNO_PENDIENTE' ||
                data?.message?.toLowerCase().includes('pendiente'))
            ) {
              setPendingConflict(
                data?.message ||
                  'Ya tenés un turno pendiente en esta especialidad.'
              );
              setPendingTurno(data?.data?.turno_pendiente || null);
              setDatesError('');
              return;
            }

            if (status === 409) {
              setDatesError(
                data?.message ||
                  'La atención seleccionada no cuenta con cupos disponibles para las fechas habilitadas.'
              );
              setPendingConflict(null);
              setPendingTurno(null);
              return;
            }

            if (!cause.response || cause.code === 'ERR_NETWORK') {
              setDatesError(
                'No pudimos conectar con el servidor. Verificá tu conexión a internet.'
              );
              setPendingConflict(null);
              setPendingTurno(null);
              return;
            }
          }

          setPendingConflict(null);
          setPendingTurno(null);
          setDatesError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDates(false);
        }
      });

    return () => {
      active = false;
    };
  }, [professional, specialty, clinic, patientId, revision]);

  // Obtiene las especialidades sin duplicados.
  const specialties = [
    ...new Map(
      professionals
        .flatMap((p) => p.especialidades)
        .map((s) => [s.id_especialidad, s])
    ).values(),
  ];

  // Filtra los profesionales que atienden la especialidad seleccionada.
  const eligible = professionals.filter((p) =>
    p.especialidades.some(
      (s) => s.id_especialidad === specialty
    )
  );

  return (
    <section className="patient-section">
      <h2 className="h5">
        Elegí tu atención
      </h2>

      <p className="small text-muted">
        Podés reservar los días habilitados de esta semana.
        Cada sábado a las 12:00 se abre la semana siguiente
        (hora argentina). El paciente seleccionado puede tener un turno pendiente
        por especialidad, independientemente de los turnos de otras personas a cargo.
      </p>

      {/* Muestra el estado de carga de la agenda. */}
      {loading && (
        <p role="status">
          Actualizando la agenda de tu salita…
        </p>
      )}

      {/* Alerta clara y orientadora si ya tiene un turno pendiente */}
      {pendingConflict && (
        <div
          className="alert alert-warning border border-warning-subtle rounded-3 p-3 mb-3 shadow-sm"
          role="status"
        >
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-clock-history text-warning flex-shrink-0 fs-5 mt-0" aria-hidden="true" />
            <div className="flex-grow-1">
              <strong className="d-block text-dark mb-1">
                Ya tenés un turno pendiente
              </strong>
              <p className="mb-2 text-secondary small">
                Actualmente tenés un turno en espera. Primero debés resolver ese turno antes de solicitar uno nuevo.
              </p>
              {pendingTurno && (
                <div className="bg-white rounded-2 p-2.5 border border-warning-subtle small mb-3">
                  <div className="row g-2">
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
              <div className="d-flex flex-wrap gap-2 mt-2">
                <Link
                  to={pendingTurno?.id_turno ? `/mis-turnos/${pendingTurno.id_turno}` : (patientId ? `/mis-turnos?paciente=${patientId}` : '/mis-turnos')}
                  className="btn btn-sm btn-dark d-inline-flex align-items-center gap-1 text-nowrap"
                >
                  <i className="bi bi-calendar-check" aria-hidden="true" />
                  <span>Ir a Mis turnos</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 text-nowrap"
                  onClick={() => {
                    setSpecialty('');
                    setProfessional('');
                    setPendingConflict(null);
                    setPendingTurno(null);
                  }}
                >
                  <i className="bi bi-arrow-repeat" aria-hidden="true" />
                  <span>Elegir otra atención</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Muestra los errores genéricos y permite reintentar la operación con espaciado adecuado. */}
      {(error || datesError) && !pendingConflict && (
        <div
          className="alert alert-danger d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 p-3 mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-danger flex-shrink-0" aria-hidden="true" />
            <span className="text-dark small">{error || datesError}</span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger flex-shrink-0 text-nowrap px-3 py-1 align-self-end align-self-sm-center"
            disabled={busy || loadingDates || loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            {loadingDates || loading ? (
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

      {/* Informa cuando no existen atenciones habilitadas. */}
      {!loading &&
        !error &&
        !professionals.length && (
          <p>
            No hay atenciones habilitadas en el período
            disponible. Consultá en tu salita.
          </p>
        )}

      {/* Formulario de selección de la atención. */}
      {!error && professionals.length > 0 && (
        <fieldset disabled={busy || loading}>
          {/* Selección de especialidad. */}
          <label className="form-label w-100">
            Especialidad

            <select
              className="form-select mt-1"
              value={specialty}
              onChange={(event) => {
                const nextSpecialty = event.target.value;
                setSpecialty(nextSpecialty);
                const nextEligible = professionals.filter((p) =>
                  p.especialidades.some((s) => s.id_especialidad === nextSpecialty)
                );
                // Si el profesional seleccionado actualmente también atiende esta especialidad, conservarlo
                const stillEligible = nextEligible.some((p) => p.id_profesional === professional);
                if (!stillEligible) {
                  if (nextEligible.length === 1) {
                    setProfessional(nextEligible[0].id_profesional);
                  } else {
                    setProfessional('');
                    setDate('');
                    setDates([]);
                  }
                }
              }}
            >
              <option value="">
                Seleccioná una especialidad
              </option>

              {specialties.map((s) => (
                <option
                  key={s.id_especialidad}
                  value={s.id_especialidad}
                >
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>

          {/* Selección del profesional. */}
          {specialty && (
            <label className="form-label w-100 mt-2">
              Profesional

              <select
                className="form-select mt-1"
                value={professional}
                onChange={(event) => {
                  setProfessional(event.target.value);
                  // No limpiar date si el nuevo profesional también atiende ese día (el efecto ajustará)
                }}
              >
                <option value="">
                  Seleccioná un profesional
                </option>

                {eligible.map((p) => (
                  <option
                    key={p.id_profesional}
                    value={p.id_profesional}
                  >
                    {p.persona.apellidos}{' '}
                    {p.persona.nombres} · Matrícula{' '}
                    {p.matricula}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Selección de una fecha con turnos disponibles. */}
          {professional && (
            <label className="form-label w-100 mt-2">
              Días de atención

              <select
                className="form-select mt-1"
                value={date}
                disabled={
                  loadingDates || !dates.length
                }
                onChange={(event) =>
                  setDate(event.target.value)
                }
              >
                <option value="">
                  {loadingDates
                    ? 'Buscando días con turnos libres…'
                    : 'Seleccioná un día'}
                </option>

                {(calendar.length ? calendar.map(d => d.fecha) : dates).map((day) => (
                  <option
                    value={day}
                    key={day}
                    disabled={!dates.includes(day)}
                  >
                    {dateLabel(day)}{calendar.find(d => d.fecha === day)?.cierre ? ` · ${calendar.find(d => d.fecha === day)!.cierre}${dates.includes(day) ? ' (parcial)' : ' · No disponible'}` : !dates.includes(day) ? ' · No disponible' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {professional && !loadingDates && !datesError && calendar.some(d => d.cierre) && (
            <div className="alert alert-warning py-2 px-3 small mt-2 mb-0" role="status">
              <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
              Algunos días presentan cierres programados que se detallan en el selector.
            </div>
          )}

          {/* Informa cuando no quedan fechas disponibles en la ventana actual. */}
          {professional &&
            !loadingDates &&
            !datesError &&
            !dates.length && (
              <div
                className="alert alert-info border-info-subtle mt-3 p-3 rounded-3 shadow-sm"
                role="status"
              >
                <div className="d-flex align-items-start gap-2">
                  <i
                    className="bi bi-calendar-event text-info-emphasis fs-5 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <strong className="d-block text-dark mb-1">
                      Sin turnos disponibles en el período habilitado
                    </strong>
                    <p className="small mb-0 text-secondary">
                      {proximaDisponibilidad?.mensaje ||
                        'No quedan turnos disponibles para esta atención en la ventana de reservas actual. Los turnos de la próxima semana se habilitarán el sábado a las 12:00 hs.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </fieldset>
      )}

      {/* Muestra los horarios disponibles para la fecha seleccionada. */}
      {!error &&
        !datesError &&
        dates.includes(date) &&
        professional &&
        specialty && (
          <PatientBookingSlots
            key={`${clinic}-${professional}-${specialty}-${date}`}
            date={date}
            professional={professional}
            specialty={specialty}
            clinic={clinic}
            patientId={patientId}
            refreshKey={revision}
            onBusyChange={value => { setBusy(value); onBusyChange?.(value); }}
          />
        )}
    </section>
  );
}
