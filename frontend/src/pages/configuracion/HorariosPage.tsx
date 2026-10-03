import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  getHorarios,
  guardarHorario,
} from '../../services/configuracion.service';

import {
  getProfessionals,
  getProfessionalClinics,
  getProfessionalSpecialties,
} from '../../services/profesionales.service';

import { getAdminSalitas } from '../../services/salitas.service';
import { getSpecialties } from '../../services/especialidades.service';
import { getDisponibilidad } from '../../services/turnos.service';

import type {
  Horario,
  HorarioInput,
} from '../../types/configuracion.types';

import type {
  Professional,
  ProfessionalClinic,
  ProfessionalSpecialty,
  Specialty,
} from '../../types/profesional.types';

import type { Salita } from '../../types/salita.types';

import type {
  DisponibilidadResponse,
} from '../../types/turno.types';

import { authError } from '../../utils/auth-errors';

// Días disponibles para configurar la atención.
const days = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

// Devuelve la fecha actual de Argentina.
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());

// Genera el estado inicial del formulario.
const initial = (id = ''): HorarioInput => ({
  id_profesional: id,
  id_salita: '',
  id_especialidad: '',
  dia_semana: 1,
  hora_inicio: '08:00',
  hora_fin: '12:00',
  duracion_turno_minutos: 20,
  cupo_maximo_diario: null,
  vigencia_desde: today(),
  vigencia_hasta: null,
  activo: true,
});

export default function HorariosPage() {
  // Permite recibir un profesional desde la URL.
  const [params] = useSearchParams();

  // Estado del formulario.
  const [form, setForm] = useState<HorarioInput>(() =>
    initial(params.get('profesional') ?? '')
  );

  const [editing, setEditing] = useState<string>();

  // Datos principales.
  const [rows, setRows] = useState<Horario[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clinics, setClinics] = useState<Salita[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Asignaciones del profesional seleccionado.
  const [relations, setRelations] = useState<{
    clinics: ProfessionalClinic[];
    specialties: ProfessionalSpecialty[];
  }>({
    clinics: [],
    specialties: [],
  });

  // Estados generales de la pantalla.
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  // Filtro del listado.
  const [filter, setFilter] = useState(
    params.get('profesional') ?? ''
  );

  // Datos para consultar disponibilidad.
  const [date, setDate] = useState(today);

  const [availability, setAvailability] =
    useState<DisponibilidadResponse | null>(null);

  // Referencia para volver al formulario al editar.
  const formRef = useRef<HTMLFormElement>(null);

  // Carga horarios, profesionales, salitas y especialidades.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setReady(false);
    setError('');

    void Promise.all([
      getHorarios(),
      getProfessionals(),
      getAdminSalitas(),
      getSpecialties(),
    ])
      .then(([h, p, c, s]) => {
        if (active) {
          setRows(h);
          setProfessionals(p.data);
          setClinics(c.data);
          setSpecialties(s.data);
          setReady(true);
        }
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
  }, [revision]);

  // Carga las salitas y especialidades asignadas al profesional.
  useEffect(() => {
    let active = true;

    setRelations({
      clinics: [],
      specialties: [],
    });

    if (!form.id_profesional) {
      setRelationLoading(false);
      return;
    }

    setRelationLoading(true);

    void Promise.all([
      getProfessionalClinics(form.id_profesional),
      getProfessionalSpecialties(form.id_profesional),
    ])
      .then(([c, s]) => {
        if (active) {
          setRelations({
            clinics: c.data,
            specialties: s.data,
          });
        }
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setRelationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [form.id_profesional, revision]);

  // Actualiza parcialmente el formulario.
  // También limpia la consulta de disponibilidad anterior.
  const change = (patch: Partial<HorarioInput>) => {
    setForm((value) => ({
      ...value,
      ...patch,
    }));

    setAvailability(null);
  };

  // Comprueba si una asignación está vigente en una fecha.
  const validAt = (
    relation: {
      activo: boolean;
      fecha_desde: string;
      fecha_hasta: string | null;
    },
    dateValue: string
  ) =>
    relation.activo &&
    relation.fecha_desde <= dateValue &&
    (
      !relation.fecha_hasta ||
      relation.fecha_hasta >= dateValue
    );

  // Salitas vigentes asignadas al profesional.
  const clinicOptions = clinics.filter(
    (clinic) =>
      clinic.activo &&
      relations.clinics.some(
        (relation) =>
          relation.id_salita === clinic.id_salita &&
          validAt(relation, form.vigencia_desde)
      )
  );

  // Especialidades vigentes asignadas al profesional.
  const specialtyOptions = specialties.filter(
    (specialty) =>
      specialty.activo &&
      relations.specialties.some(
        (relation) =>
          relation.id_especialidad ===
            specialty.id_especialidad &&
          validAt(relation, form.vigencia_desde)
      )
  );

  // Limpia el formulario y finaliza la edición.
  const reset = () => {
    setEditing(undefined);
    setForm(initial());
    setAvailability(null);
  };

  // Guarda un nuevo horario o actualiza uno existente.
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy || !ready || relationLoading) {
      return;
    }

    setError('');
    setSuccess('');

    // Valida que la hora inicial sea anterior a la final.
    if (form.hora_inicio >= form.hora_fin) {
      setError(
        'El inicio debe ser anterior al fin.'
      );
      return;
    }

    // Valida el período de vigencia.
    if (
      form.vigencia_hasta &&
      form.vigencia_hasta < form.vigencia_desde
    ) {
      setError('Revisá el período de vigencia.');
      return;
    }

    // Valida las asignaciones del profesional.
    if (
      form.activo &&
      (
        !clinicOptions.some(
          (clinic) =>
            clinic.id_salita === form.id_salita
        ) ||
        !specialtyOptions.some(
          (specialty) =>
            specialty.id_especialidad ===
            form.id_especialidad
        )
      )
    ) {
      setError(
        'Asigná la salita y la especialidad al profesional para esa fecha antes de activar el horario.'
      );
      return;
    }

    // Evita franjas superpuestas para el mismo profesional,
    // incluso cuando atiende en diferentes salitas.
    const overlapping = rows.some(
      (schedule) =>
        schedule.id_horario !== editing &&
        schedule.activo &&
        schedule.id_profesional === form.id_profesional &&
        schedule.dia_semana === form.dia_semana &&
        schedule.hora_inicio.slice(0, 5) < form.hora_fin &&
        schedule.hora_fin.slice(0, 5) > form.hora_inicio &&
        schedule.vigencia_desde <=
          (form.vigencia_hasta ?? '9999-12-31') &&
        (schedule.vigencia_hasta ?? '9999-12-31') >=
          form.vigencia_desde
    );

    if (form.activo && overlapping) {
      setError(
        'El profesional ya tiene una franja activa que se superpone con este horario.'
      );
      return;
    }

    setBusy(true);

    try {
      await guardarHorario(
        form,
        editing
      );

      reset();

      setSuccess(
        'Horario guardado. Podés consultar su disponibilidad.'
      );

      // Fuerza la recarga del listado.
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // Consulta los turnos disponibles para una fecha.
  const preview = async () => {
    if (
      busy ||
      !form.id_profesional ||
      !form.id_salita ||
      !form.id_especialidad ||
      !date
    ) {
      return;
    }

    setBusy(true);
    setError('');
    setAvailability(null);

    try {
      setAvailability(
        await getDisponibilidad(
          date,
          form.id_profesional,
          form.id_especialidad,
          form.id_salita
        )
      );
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // Carga un horario existente en el formulario.
  const edit = (row: Horario) => {
    const {
      id_horario,
      ...input
    } = row;

    // Envía solo los campos editables del horario.
    setForm({
      id_profesional: input.id_profesional,
      id_especialidad: input.id_especialidad,
      id_salita: input.id_salita,
      dia_semana: input.dia_semana,
      hora_inicio: input.hora_inicio.slice(0, 5),
      hora_fin: input.hora_fin.slice(0, 5),
      duracion_turno_minutos:
        input.duracion_turno_minutos,
      cupo_maximo_diario:
        input.cupo_maximo_diario,
      vigencia_desde: input.vigencia_desde,
      vigencia_hasta: input.vigencia_hasta,
      activo: input.activo,
    });

    setEditing(id_horario);
    setAvailability(null);
    setSuccess('');
    setError('');

    // Lleva al usuario nuevamente al formulario.
    formRef.current?.scrollIntoView({
      block: 'start',
    });
  };

  return (
    <div>
      <Link
        className="btn btn-outline-success mb-3"
        to="/configuracion"
      >
        Volver a Configuración
      </Link>

      <div className="dashboard-header">
        <h1>
          Horarios y disponibilidad
        </h1>

        <p>
          Definí las franjas de atención de los
          profesionales de tus salitas.
        </p>
      </div>

      {/* Mensajes generales */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}

          <button
            className="btn btn-outline-danger ms-2"
            disabled={busy}
            onClick={() =>
              setRevision((value) => value + 1)
            }
          >
            Recargar
          </button>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      {loading && (
        <p role="status">
          Cargando horarios…
        </p>
      )}

      {/* Formulario de horarios */}
      <form
        ref={formRef}
        className="dashboard-panel p-3 mb-4 configuration-form"
        onSubmit={submit}
      >
        <h2 className="h5">
          {editing
            ? 'Editar horario'
            : 'Nuevo horario'}
        </h2>

        <fieldset
          disabled={busy || loading || !ready}
        >
          <div className="row g-3">
            <label className="col-lg-4 form-label">
              Profesional

              <select
                className="form-select"
                required
                value={form.id_profesional}
                onChange={(e) =>
                  change({
                    id_profesional: e.target.value,
                    id_salita: '',
                    id_especialidad: '',
                  })
                }
              >
                <option value="">
                  Seleccionar profesional
                </option>

                {professionals
                  .filter(
                    (professional) =>
                      professional.activo ||
                      professional.id_profesional ===
                        form.id_profesional
                  )
                  .map((professional) => (
                    <option
                      key={professional.id_profesional}
                      value={professional.id_profesional}
                    >
                      {professional.persona.apellidos},{' '}
                      {professional.persona.nombres}
                    </option>
                  ))}
              </select>
            </label>

            <label className="col-lg-4 form-label">
              Salita

              <select
                className="form-select"
                required
                disabled={relationLoading}
                value={form.id_salita}
                onChange={(e) =>
                  change({
                    id_salita: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar salita asignada
                </option>

                {clinics
                  .filter(
                    (clinic) =>
                      clinicOptions.includes(clinic) ||
                      clinic.id_salita === form.id_salita
                  )
                  .map((clinic) => (
                    <option
                      key={clinic.id_salita}
                      value={clinic.id_salita}
                    >
                      {clinic.nombre}

                      {!clinicOptions.includes(clinic)
                        ? ' (sin asignación vigente)'
                        : ''}
                    </option>
                  ))}
              </select>
            </label>

            <label className="col-lg-4 form-label">
              Especialidad

              <select
                className="form-select"
                required
                disabled={relationLoading}
                value={form.id_especialidad}
                onChange={(e) =>
                  change({
                    id_especialidad: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar especialidad asignada
                </option>

                {specialties
                  .filter(
                    (specialty) =>
                      specialtyOptions.includes(specialty) ||
                      specialty.id_especialidad ===
                        form.id_especialidad
                  )
                  .map((specialty) => (
                    <option
                      key={specialty.id_especialidad}
                      value={specialty.id_especialidad}
                    >
                      {specialty.nombre}

                      {!specialtyOptions.includes(specialty)
                        ? ' (sin asignación vigente)'
                        : ''}
                    </option>
                  ))}
              </select>
            </label>

            {/* Acceso a las asignaciones del profesional */}
            {form.id_profesional && (
              <div className="col-12">
                <Link
                  to={`/profesionales/${form.id_profesional}`}
                >
                  Administrar asignaciones del profesional
                </Link>

                {relationLoading && (
                  <span
                    role="status"
                    className="ms-2"
                  >
                    Cargando asignaciones…
                  </span>
                )}
              </div>
            )}

            <label className="col-sm-6 col-lg-4 form-label">
              Día

              <select
                className="form-select"
                value={form.dia_semana}
                onChange={(e) =>
                  change({
                    dia_semana: Number(
                      e.target.value
                    ),
                  })
                }
              >
                {days.map((day, index) => (
                  <option
                    key={day}
                    value={index + 1}
                  >
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-sm-6 col-lg-4 form-label">
              Inicio

              <input
                className="form-control"
                type="time"
                required
                value={form.hora_inicio}
                onChange={(e) =>
                  change({
                    hora_inicio: e.target.value,
                  })
                }
              />
            </label>

            <label className="col-sm-6 col-lg-4 form-label">
              Fin

              <input
                className="form-control"
                type="time"
                required
                value={form.hora_fin}
                onChange={(e) =>
                  change({
                    hora_fin: e.target.value,
                  })
                }
              />
            </label>

            <label className="col-sm-6 col-lg-3 form-label">
              Duración del turno (minutos)

              <input
                className="form-control"
                type="number"
                min={5}
                max={240}
                required
                value={form.duracion_turno_minutos}
                onChange={(e) =>
                  change({
                    duracion_turno_minutos:
                      Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="col-sm-6 col-lg-3 form-label">
              Cupo diario (opcional)

              <input
                className="form-control"
                type="number"
                min={1}
                value={form.cupo_maximo_diario ?? ''}
                onChange={(e) =>
                  change({
                    cupo_maximo_diario:
                      e.target.value
                        ? Number(e.target.value)
                        : null,
                  })
                }
              />
            </label>

            <label className="col-sm-6 col-lg-3 form-label">
              Vigente desde

              <input
                className="form-control"
                type="date"
                required
                value={form.vigencia_desde}
                onChange={(e) =>
                  change({
                    vigencia_desde: e.target.value,
                  })
                }
              />
            </label>

            <label className="col-sm-6 col-lg-3 form-label">
              Vigente hasta (opcional)

              <input
                className="form-control"
                type="date"
                min={form.vigencia_desde}
                value={form.vigencia_hasta ?? ''}
                onChange={(e) =>
                  change({
                    vigencia_hasta:
                      e.target.value || null,
                  })
                }
              />
            </label>

            <div className="col-12">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    change({
                      activo: e.target.checked,
                    })
                  }
                />

                Horario activo
              </label>
            </div>

            <div className="col-12 d-flex flex-wrap gap-2">
              <button
                className="btn btn-saps"
                disabled={relationLoading}
              >
                {busy
                  ? 'Procesando…'
                  : 'Guardar horario'}
              </button>

              {editing && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={reset}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>
        </fieldset>
      </form>

      {/* Consulta de disponibilidad */}
      <section className="dashboard-panel p-3 mb-4">
        <h2 className="h5">
          Consultar disponibilidad
        </h2>

        <p className="text-muted">
          Usa el profesional, la salita y la especialidad
          seleccionados arriba. Solo contempla horarios ya
          guardados.
        </p>

        <div className="d-flex flex-wrap gap-3 align-items-end">
          <label className="form-label">
            Fecha

            <input
              className="form-control"
              type="date"
              value={date}
              disabled={busy}
              onChange={(e) => {
                setDate(e.target.value);
                setAvailability(null);
              }}
            />
          </label>

          <button
            className="btn btn-outline-success mb-2"
            disabled={
              busy ||
              loading ||
              !ready ||
              !date ||
              !form.id_profesional ||
              !form.id_salita ||
              !form.id_especialidad
            }
            onClick={() => void preview()}
          >
            Consultar disponibilidad
          </button>
        </div>

        {/* Resultado de la disponibilidad */}
        {availability && (
          <div aria-live="polite">
            <p>
              {availability.resumen.disponibles} disponibles ·{' '}
              {availability.resumen.ocupados} ocupados ·{' '}
              {availability.resumen.bloqueados} bloqueados
            </p>

            <div className="row g-2">
              {availability.slots.map((slot) => (
                <div
                  className="col-6 col-md-3"
                  key={`${slot.hora_inicio}-${slot.hora_fin}`}
                >
                  <div
                    className={`p-3 rounded ${
                      slot.estado === 'DISPONIBLE'
                        ? 'bg-success-subtle text-success-emphasis'
                        : 'bg-light'
                    }`}
                  >
                    <strong>
                      {slot.hora_inicio}–{slot.hora_fin}
                    </strong>

                    <div className="small">
                      {slot.estado === 'DISPONIBLE'
                        ? 'Disponible'
                        : slot.estado === 'OCUPADO'
                          ? 'Ocupado'
                          : 'Bloqueado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!availability.slots.length && (
              <p>
                No hay horarios disponibles para esta fecha.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Listado de horarios registrados */}
      <section className="dashboard-panel">
        <div className="p-3">
          <h2 className="h5">
            Horarios guardados
          </h2>

          <label className="form-label w-100">
            Filtrar profesional

            <select
              className="form-select"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="">
                Todos
              </option>

              {professionals.map((professional) => (
                <option
                  key={professional.id_profesional}
                  value={professional.id_profesional}
                >
                  {professional.persona.apellidos},{' '}
                  {professional.persona.nombres}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-responsive">
          <table className="table saps-responsive-table">
            <thead>
              <tr>
                {[
                  'Profesional',
                  'Salita / especialidad',
                  'Franja',
                  'Vigencia',
                  'Estado',
                  'Acciones',
                ].map((label) => (
                  <th
                    scope="col"
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows
                .filter(
                  (schedule) =>
                    !filter ||
                    schedule.id_profesional === filter
                )
                .map((schedule) => {
                  const professional =
                    professionals.find(
                      (value) =>
                        value.id_profesional ===
                        schedule.id_profesional
                    );

                  return (
                    <tr key={schedule.id_horario}>
                      <td data-label="Profesional">
                        {professional
                          ? `${professional.persona.apellidos}, ${professional.persona.nombres}`
                          : 'Profesional no disponible'}
                      </td>

                      <td data-label="Salita / especialidad">
                        {clinics.find(
                          (clinic) =>
                            clinic.id_salita ===
                            schedule.id_salita
                        )?.nombre ??
                          'Salita no disponible'}

                        <br />

                        {specialties.find(
                          (specialty) =>
                            specialty.id_especialidad ===
                            schedule.id_especialidad
                        )?.nombre ??
                          'Especialidad no disponible'}
                      </td>

                      <td data-label="Franja">
                        {days[schedule.dia_semana - 1]} ·{' '}
                        {schedule.hora_inicio.slice(0, 5)}–
                        {schedule.hora_fin.slice(0, 5)}

                        <br />

                        <small>
                          Turnos de{' '}
                          {schedule.duracion_turno_minutos} min
                        </small>
                      </td>

                      <td data-label="Vigencia">
                        {schedule.vigencia_desde} /{' '}
                        {schedule.vigencia_hasta ?? 'Sin fin'}
                      </td>

                      <td data-label="Estado">
                        <span
                          className={`badge ${
                            schedule.activo
                              ? 'text-bg-success'
                              : 'text-bg-secondary'
                          }`}
                        >
                          {schedule.activo
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td data-label="Acciones">
                        <button
                          className="btn btn-outline-success"
                          disabled={busy || loading}
                          onClick={() =>
                            edit(schedule)
                          }
                        >
                          Editar / consultar
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading &&
          !rows.filter(
            (schedule) =>
              !filter ||
              schedule.id_profesional === filter
          ).length && (
            <p className="p-3 text-muted">
              No hay horarios para este filtro.
            </p>
          )}
      </section>
    </div>
  );
}
