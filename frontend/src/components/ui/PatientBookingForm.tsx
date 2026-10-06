import ValidatedInput from './ValidatedInput';
import {
  useEffect,
  useState,
} from 'react';

import {
  getPatientProfessionals,
} from '../../services/profesionales.service';

import type {
  PatientProfessional,
} from '../../types/profesional.types';

import PatientBookingSlots from './PatientBookingSlots';

import {
  authError,
} from '../../utils/auth-errors';

export default function PatientBookingForm({
  clinic,
}: {
  clinic: string;
}) {
  // Obtiene la fecha actual usando la zona horaria de Argentina.
  const today = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone:
        'America/Argentina/Buenos_Aires',
    }
  ).format(
    new Date()
  );

  // Fecha seleccionada para buscar turnos.
  const [date, setDate] = useState(
    today
  );

  // Profesionales disponibles para la fecha seleccionada.
  const [
    professionals,
    setProfessionals,
  ] = useState<PatientProfessional[]>([]);

  // Especialidad y profesional seleccionados.
  const [
    specialty,
    setSpecialty,
  ] = useState('');

  const [
    professional,
    setProfessional,
  ] = useState('');

  // Estados de carga y operación.
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState(false);

  // Mensaje de error.
  const [
    error,
    setError,
  ] = useState('');

  // Permite volver a ejecutar la búsqueda.
  const [
    revision,
    setRevision,
  ] = useState(0);

  // CARGA DE PROFESIONALES

  useEffect(() => {
    let active = true;

    // Reinicia los datos de la búsqueda anterior.
    setLoading(true);
    setError('');
    setProfessionals([]);
    setSpecialty('');
    setProfessional('');

    // No permite consultar fechas anteriores.
    if (
      !date ||
      date < today
    ) {
      setLoading(false);
      return;
    }

    // La API filtra asignación, vigencia,
    // especialidad y horarios de atención.
    void getPatientProfessionals(
      date
    )
      .then((rows) => {
        if (active) {
          setProfessionals(
            rows
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            authError(cause)
          );
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
    clinic,
    today,
    revision,
  ]);

  // ESPECIALIDADES DISPONIBLES

  // Obtiene las especialidades disponibles
  // evitando elementos duplicados.
  const specialties = [
    ...new Map(
      professionals
        .flatMap(
          (p) => p.especialidades
        )
        .map(
          (e) => [
            e.id_especialidad,
            e,
          ]
        )
    ).values(),
  ];

  // PROFESIONALES HABILITADOS

  // Filtra los profesionales que atienden
  // la especialidad seleccionada.
  const eligible =
    professionals.filter(
      (p) =>
        p.especialidades.some(
          (e) =>
            e.id_especialidad ===
            specialty
        )
    );

  // INTERFAZ

  return (
    <section className="patient-section">
      <h2 className="h5">
        Elegí tu atención
      </h2>

      {/* Selección de fecha. */}
      <label className="form-label w-100">
        Fecha

        <ValidatedInput
          className="form-control mt-1"
          type="date"
          value={date}
          min={today}
          disabled={busy}
          onChange={(event) => {
            setDate(
              event.target.value
            );

            // Reinicia las selecciones dependientes.
            setSpecialty('');
            setProfessional('');
          }}
        />
      </label>

      {/* Estado de carga. */}
      {loading && (
        <p role="status">
          Buscando profesionales de tu salita…
        </p>
      )}

      {/* Mensaje de error y reintento. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}{' '}

          <button
            className="btn btn-outline-danger"
            onClick={() =>
              setRevision(
                (v) => v + 1
              )
            }
          >
            Reintentar
          </button>
        </div>
      )}

      {/* No existen profesionales disponibles. */}
      {!loading &&
        !error &&
        date >= today &&
        !professionals.length && (
          <p>
            No hay profesionales con horarios
            habilitados para esta fecha. Probá
            otro día o consultá en tu salita.
          </p>
        )}

      {/* Opciones disponibles para reservar. */}
      {!loading &&
        !error &&
        professionals.length > 0 && (
          <>
            {/* Selección de especialidad. */}
            <label className="form-label w-100 mt-2">
              Especialidad

              <select
                className="form-select mt-1"
                value={specialty}
                disabled={busy}
                onChange={(event) => {
                  setSpecialty(
                    event.target.value
                  );

                  // Reinicia el profesional al
                  // cambiar de especialidad.
                  setProfessional('');
                }}
              >
                <option value="">
                  Seleccioná una especialidad
                </option>

                {specialties.map(
                  (e) => (
                    <option
                      key={
                        e.id_especialidad
                      }
                      value={
                        e.id_especialidad
                      }
                    >
                      {e.nombre}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Selección de profesional. */}
            {specialty && (
              <label className="form-label w-100 mt-2">
                Profesional

                <select
                  className="form-select mt-1"
                  value={professional}
                  disabled={busy}
                  onChange={(event) =>
                    setProfessional(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccioná un profesional
                  </option>

                  {eligible.map(
                    (p) => (
                      <option
                        key={
                          p.id_profesional
                        }
                        value={
                          p.id_profesional
                        }
                      >
                        {p.persona.apellidos}{' '}
                        {p.persona.nombres}
                        {' · '}
                        Matrícula {p.matricula}
                      </option>
                    )
                  )}
                </select>
              </label>
            )}

            {/* Horarios disponibles para reservar. */}
            {professional &&
              specialty && (
                <PatientBookingSlots
                  key={`${date}-${professional}-${specialty}-${clinic}`}
                  date={date}
                  professional={
                    professional
                  }
                  specialty={
                    specialty
                  }
                  clinic={clinic}
                  onBusyChange={
                    setBusy
                  }
                />
              )}
          </>
        )}
    </section>
  );
}