import { useEffect, useState } from 'react';

import { getPatientProfessionals } from '../../services/profesionales.service';
import { getPatientAvailableDates, type PatientAvailableDates } from '../../services/turnos.service';

import type { PatientProfessional } from '../../types/profesional.types';

import PatientBookingSlots from './PatientBookingSlots';

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

  // Controla los estados de carga y las solicitudes.
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [busy, setBusy] = useState(false);

  // Almacena los mensajes de error.
  const [error, setError] = useState('');
  const [datesError, setDatesError] = useState('');

  // Permite actualizar la información de la agenda.
  const [revision, setRevision] = useState(0);

  // El servidor determina la semana habilitada en horario argentino.
  useEffect(() => {
    if (busy) {
      return;
    }

    // Solicita una actualización de los datos.
    const refresh = () => {
      setRevision((value) => value + 1);
    };

    // Actualiza la agenda cada 60 segundos.
    const interval = window.setInterval(refresh, 60_000);

    // Actualiza al recuperar el foco de la ventana.
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(interval);
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
    setCalendar([]);

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

        // Conserva la fecha seleccionada si sigue disponible.
        setDate((current) =>
          result.fechas.includes(current)
            ? current
            : result.fechas[0] ?? ''
        );
      })
      .catch((cause) => {
        if (active) {
          setDate('');
          setDates([]);
          setCalendar([]);
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

      {/* Muestra los errores y permite actualizar la información. */}
      {(error || datesError) && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error || datesError}{' '}

          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={busy}
            onClick={() =>
              setRevision((value) => value + 1)
            }
          >
            Actualizar
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
                setSpecialty(event.target.value);
                setProfessional('');
                setDate('');
                setDates([]);
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
                  setDate('');
                  setDates([]);
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

          {professional && !loadingDates && !datesError && calendar.length > 0 && <div className="mt-2" aria-label="Estado de los días de atención">
            <p className="small text-muted">Los días con cierre completo no se pueden elegir. Si el cierre es parcial, solo se ofrecen horarios fuera de esa franja.</p>
            <ul className="list-unstyled">
              {calendar.map(day => <li key={day.fecha} className={`border rounded p-2 mb-2 ${day.cierre ? 'border-danger bg-danger-subtle text-danger' : day.disponible ? 'border-success' : 'text-muted'}`}>
                <strong>{dateLabel(day.fecha)}</strong><br />
                {day.cierre ? <>
                  <span className="badge text-bg-danger me-2">{day.cierre}</span>
                  {day.franjas_cerradas.join(' / ')} · {day.disponible ? 'Hay horarios disponibles fuera del cierre' : day.estado === 'SIN_HORARIO' ? 'Sin horario de atención' : day.estado === 'SIN_CUPOS' ? 'Sin cupos disponibles fuera del cierre' : 'No disponible para esta atención'}
                </> : day.disponible ? 'Disponible' : day.estado === 'SIN_HORARIO' ? 'Sin horario de atención' : 'Sin cupos disponibles'}
              </li>)}
            </ul>
          </div>}

          {/* Informa cuando no quedan fechas disponibles. */}
          {professional &&
            !loadingDates &&
            !datesError &&
            !dates.length && (
              <p>
                No quedan turnos disponibles para esta
                atención en el período habilitado.
              </p>
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
