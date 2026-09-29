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

import {
  authError,
} from '../../utils/auth-errors';

export default function PatientBookingSlots({
  date,
  professional,
  specialty,
  clinic,
  onBusyChange,
}: {
  date: string;
  professional: string;
  specialty: string;
  clinic: string;
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

  // Permite volver a consultar los horarios.
  const [revision, setRevision] = useState(0);

  const navigate = useNavigate();

  // ========================================
  // CARGA DE HORARIOS DISPONIBLES
  // ========================================

  useEffect(() => {
    let active = true;

    // Reinicia los datos de la consulta anterior.
    setLoading(true);
    setError('');
    setSelected('');
    setSlots([]);

    // Consulta la disponibilidad según
    // fecha, profesional, especialidad y salita.
    void getDisponibilidad(
      date,
      professional,
      specialty,
      clinic
    )
      .then((response) => {
        if (active) {
          // Solo muestra los horarios disponibles.
          setSlots(
            response.slots.filter(
              (s) => s.estado === 'DISPONIBLE'
            )
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
    professional,
    specialty,
    clinic,
    revision,
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
      setError(
        authError(cause)
      );

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
        <p role="status">
          Consultando disponibilidad…
        </p>
      )}

      {/* Mensaje de error y opción de reintento. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}{' '}

          <button
            className="btn btn-outline-danger"
            disabled={busy}
            onClick={() =>
              setRevision(
                (v) => v + 1
              )
            }
          >
            Actualizar horarios
          </button>
        </div>
      )}

      {/* No existen horarios disponibles. */}
      {!loading &&
        !error &&
        !slots.length && (
          <p>
            No hay horarios disponibles para esta
            fecha. Probá otro día o profesional.
          </p>
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

              {/* Selección del horario. */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {slots.map(
                  (slot) => (
                    <label
                      className={`btn ${
                        selected === slot.hora_inicio
                          ? 'btn-success'
                          : 'btn-outline-success'
                      }`}
                      key={slot.hora_inicio}
                    >
                      <input
                        className="visually-hidden"
                        type="radio"
                        name="slot"
                        value={slot.hora_inicio}
                        checked={
                          selected === slot.hora_inicio
                        }
                        onChange={() =>
                          setSelected(
                            slot.hora_inicio
                          )
                        }
                        required
                      />

                      {slot.hora_inicio.slice(
                        0,
                        5
                      )}
                    </label>
                  )
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
                className="btn btn-saps"
                disabled={!selected}
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