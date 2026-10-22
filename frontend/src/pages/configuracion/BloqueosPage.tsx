import ValidatedInput from '../../components/ui/ValidatedInput';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import {
  getBloqueos,
  getSalitasConfigurables,
  guardarBloqueo,
} from '../../services/configuracion.service';

import {
  getProfessionals,
  getProfessionalClinics,
  getProfessionalSpecialties,
} from '../../services/profesionales.service';

import {
  getSpecialties,
} from '../../services/especialidades.service';

import type {
  Bloqueo,
  BloqueoInput,
} from '../../types/configuracion.types';

import type {
  Professional,
  ProfessionalClinic,
  ProfessionalSpecialty,
  Specialty,
} from '../../types/profesional.types';

import type {
  Salita,
} from '../../types/salita.types';

import { authError } from '../../utils/auth-errors';

// Genera el estado inicial para un nuevo bloqueo.
const empty = (): BloqueoInput => ({
  id_salita: '',
  id_profesional: null,
  id_especialidad: null,
  fecha: '',
  hora_inicio: null,
  hora_fin: null,
  dia_completo: true,
  motivo: '',
  activo: true,
});

export default function BloqueosPage() {
  const { user } = useAuth();

  // Datos principales de la pantalla.
  const [rows, setRows] = useState<Bloqueo[]>([]);
  const [clinics, setClinics] = useState<Salita[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Relaciones del profesional seleccionado.
  const [relations, setRelations] = useState<{
    clinics: ProfessionalClinic[];
    specialties: ProfessionalSpecialty[];
  }>({
    clinics: [],
    specialties: [],
  });

  const [relationsReady, setRelationsReady] = useState(false);

  // Estado del formulario.
  const [form, setForm] = useState<BloqueoInput>(empty);
  const [editing, setEditing] = useState<string>();
  const [filter, setFilter] = useState('');

  // Estados generales de la página.
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  // Referencia utilizada para volver al formulario al editar.
  const ref = useRef<HTMLFormElement>(null);

  // Carga bloqueos, salitas, profesionales y especialidades.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setReady(false);
    setError('');

    void Promise.all([
      getBloqueos(),
      getSalitasConfigurables(user?.rol === 'SUPER_ADMIN'),
      getProfessionals(),
      getSpecialties(),
    ])
      .then(([r, c, p, s]) => {
        if (active) {
          setRows(r);
          setClinics(c);
          setProfessionals(p.data);
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
  }, [revision, user?.rol]);

  // Carga las salitas y especialidades asignadas al profesional.
  useEffect(() => {
    let active = true;

    setRelationsReady(false);

    setRelations({
      clinics: [],
      specialties: [],
    });

    // Si el bloqueo aplica a todos, no necesitamos relaciones.
    if (!form.id_profesional) {
      setRelationsReady(true);
      return;
    }

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

          setRelationsReady(true);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
        }
      });

    return () => {
      active = false;
    };
  }, [form.id_profesional, revision]);

  // Actualiza solamente los campos recibidos del formulario.
  const change = (patch: Partial<BloqueoInput>) => {
    setForm((value) => ({
      ...value,
      ...patch,
    }));
  };

  // Limpia el formulario y sale del modo edición.
  const reset = () => {
    setEditing(undefined);
    setForm(empty());
  };

  // Guarda un nuevo bloqueo o actualiza uno existente.
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy || !ready || !relationsReady) {
      return;
    }

    setError('');
    setSuccess('');

    // El motivo es obligatorio.
    if (!form.motivo.trim()) {
      setError('Indicá el motivo del bloqueo.');
      return;
    }

    // Si no es día completo, la franja horaria debe ser válida.
    if (
      !form.dia_completo &&
      (
        !form.hora_inicio ||
        !form.hora_fin ||
        form.hora_inicio >= form.hora_fin
      )
    ) {
      setError(
        'Indicá una franja válida, con inicio anterior al fin.'
      );
      return;
    }

    // Comprueba si una asignación está vigente en la fecha elegida.
    const current = (relation: {
      activo: boolean;
      fecha_desde: string;
      fecha_hasta: string | null;
    }) =>
      relation.activo &&
      relation.fecha_desde <= form.fecha &&
      (
        !relation.fecha_hasta ||
        relation.fecha_hasta >= form.fecha
      );

    // Valida que el profesional pertenezca a la salita/especialidad.
    if (
      form.activo &&
      form.id_profesional &&
      (
        !relations.clinics.some(
          (relation) =>
            relation.id_salita === form.id_salita &&
            current(relation)
        ) ||
        (
          form.id_especialidad &&
          !relations.specialties.some(
            (relation) =>
              relation.id_especialidad === form.id_especialidad &&
              current(relation)
          )
        )
      )
    ) {
      setError(
        'El profesional no tiene asignadas esa salita y especialidad en la fecha seleccionada.'
      );
      return;
    }

    // Normaliza los datos antes de enviarlos al servicio.
    const input = {
      ...form,
      motivo: form.motivo.trim(),
      hora_inicio: form.dia_completo
        ? null
        : form.hora_inicio,
      hora_fin: form.dia_completo
        ? null
        : form.hora_fin,
    };

    // Evita registrar dos bloqueos activos idénticos.
    const duplicated = rows.some(
      (row) =>
        row.id_bloqueo !== editing &&
        row.activo &&
        input.activo &&
        row.id_salita === input.id_salita &&
        row.id_profesional === input.id_profesional &&
        row.id_especialidad === input.id_especialidad &&
        row.fecha === input.fecha &&
        row.dia_completo === input.dia_completo &&
        (row.hora_inicio?.slice(0, 5) ?? null) ===
          input.hora_inicio &&
        (row.hora_fin?.slice(0, 5) ?? null) ===
          input.hora_fin
    );

    if (duplicated) {
      setError(
        'Ya existe un bloqueo activo con ese alcance y franja.'
      );
      return;
    }

    setBusy(true);

    try {
      await guardarBloqueo(input, editing);

      reset();

      setSuccess('Bloqueo guardado.');

      // Fuerza la recarga de los datos.
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link
        className="btn btn-outline-secondary mb-3"
        to="/configuracion"
      >
        <i className="bi bi-arrow-left me-2" aria-hidden="true" />
        Volver a configuración
      </Link>

      <div className="dashboard-header">
        <h1>Bloqueos de agenda</h1>

        <p>
          Marcá cierres, ausencias y franjas sin atención.
        </p>
      </div>

      <p className="text-muted">
        El bloqueo afecta la disponibilidad; revisá los turnos
        ya asignados antes de modificar la atención.
      </p>

      {/* Mensajes de error y confirmación */}
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

      {/* Formulario de creación y edición */}
      <form
        ref={ref}
        onSubmit={submit}
        className="dashboard-panel p-3 mb-4 configuration-form"
      >
        <h2 className="h5">
          {editing
            ? 'Editar bloqueo'
            : 'Nuevo bloqueo'}
        </h2>

        <fieldset
          disabled={loading || busy || !ready}
        >
          <div className="row g-3">
            <label className="col-md-4 form-label">
              Salita

              <select
                className="form-select"
                required
                value={form.id_salita}
                onChange={(e) =>
                  change({
                    id_salita: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar salita
                </option>

                {clinics.map((clinic) => (
                  <option
                    key={clinic.id_salita}
                    value={clinic.id_salita}
                  >
                    {clinic.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-md-4 form-label">
              Profesional

              <select
                className="form-select"
                value={form.id_profesional ?? ''}
                onChange={(e) =>
                  change({
                    id_profesional:
                      e.target.value || null,
                  })
                }
              >
                <option value="">
                  Todos los profesionales
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

            <label className="col-md-4 form-label">
              Especialidad

              <select
                className="form-select"
                value={form.id_especialidad ?? ''}
                onChange={(e) =>
                  change({
                    id_especialidad:
                      e.target.value || null,
                  })
                }
              >
                <option value="">
                  Todas las especialidades
                </option>

                {specialties.map((specialty) => (
                  <option
                    key={specialty.id_especialidad}
                    value={specialty.id_especialidad}
                  >
                    {specialty.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-md-4 form-label">
              Fecha

              <ValidatedInput field="fecha"
                type="date"
                className="form-control"
                required
                value={form.fecha}
                onChange={(e) =>
                  change({
                    fecha: e.target.value,
                  })
                }
              />
            </label>

            <div className="col-md-8 d-flex flex-wrap gap-4 align-items-center">
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.dia_completo}
                  onChange={(e) =>
                    change({
                      dia_completo: e.target.checked,
                      hora_inicio: null,
                      hora_fin: null,
                    })
                  }
                />

                Día completo
              </label>

              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.activo}
                  onChange={(e) =>
                    change({
                      activo: e.target.checked,
                    })
                  }
                />

                Bloqueo activo
              </label>
            </div>

            {/* Horarios visibles solo para bloqueos parciales */}
            {!form.dia_completo && (
              <>
                <label className="col-md-6 form-label">
                  Desde

                  <ValidatedInput field="hora_inicio"
                    type="time"
                    className="form-control"
                    required
                    value={form.hora_inicio ?? ''}
                    onChange={(e) =>
                      change({
                        hora_inicio: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="col-md-6 form-label">
                  Hasta

                  <ValidatedInput field="hora_fin"
                    type="time"
                    className="form-control"
                    required
                    value={form.hora_fin ?? ''}
                    onChange={(e) =>
                      change({
                        hora_fin: e.target.value,
                      })
                    }
                  />
                </label>
              </>
            )}

            <label className="col-12 form-label">
              Motivo

              <textarea
                className="form-control"
                rows={2}
                required
                maxLength={500}
                value={form.motivo}
                onChange={(e) =>
                  change({
                    motivo: e.target.value,
                  })
                }
              />
            </label>

            <div className="col-12 d-flex flex-wrap gap-2">
              <button
                className="btn btn-saps"
                disabled={!relationsReady}
              >
                {busy
                  ? 'Guardando…'
                  : 'Guardar bloqueo'}
              </button>

              {editing && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={reset}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>
        </fieldset>
      </form>

      {/* Listado de bloqueos registrados */}
      <section className="dashboard-panel">
        <div className="p-3">
          <label className="form-label w-100">
            Filtrar fecha

            <ValidatedInput
              type="date"
              className="form-control"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            />
          </label>

          <button
            className="btn btn-outline-secondary"
            onClick={() => setFilter('')}
          >
            Todas las fechas
          </button>
        </div>

        {loading ? (
          <p
            className="p-3"
            role="status"
          >
            Cargando bloqueos…
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table saps-responsive-table">
              <thead>
                <tr>
                  {[
                    'Fecha y franja',
                    'Alcance',
                    'Motivo',
                    'Estado',
                    'Acciones',
                  ].map((title) => (
                    <th
                      scope="col"
                      key={title}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows
                  .filter(
                    (row) =>
                      !filter ||
                      row.fecha === filter
                  )
                  .map((row) => {
                    const professional =
                      professionals.find(
                        (value) =>
                          value.id_profesional ===
                          row.id_profesional
                      );

                    return (
                      <tr key={row.id_bloqueo}>
                        <td data-label="Fecha y franja">
                          {row.fecha}

                          <br />

                          {row.dia_completo
                            ? 'Día completo'
                            : `${row.hora_inicio?.slice(
                                0,
                                5
                              )}–${row.hora_fin?.slice(
                                0,
                                5
                              )}`}
                        </td>

                        <td data-label="Alcance">
                          {clinics.find(
                            (clinic) =>
                              clinic.id_salita ===
                              row.id_salita
                          )?.nombre ??
                            'Salita no disponible'}

                          <br />

                          {row.id_profesional
                            ? professional
                              ? `${professional.persona.apellidos}, ${professional.persona.nombres}`
                              : 'Profesional no disponible'
                            : 'Todos los profesionales'}

                          <br />

                          {row.id_especialidad
                            ? specialties.find(
                                (specialty) =>
                                  specialty.id_especialidad ===
                                  row.id_especialidad
                              )?.nombre ??
                              'Especialidad no disponible'
                            : 'Todas las especialidades'}
                        </td>

                        <td data-label="Motivo">
                          {row.motivo}
                        </td>

                        <td data-label="Estado">
                          <span
                            className={`badge ${
                              row.activo
                                ? 'text-bg-success'
                                : 'text-bg-secondary'
                            }`}
                          >
                            {row.activo
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>
                        </td>

                        <td data-label="Acciones">
                          <button
                            className="btn btn-outline-success"
                            disabled={busy}
                            onClick={() => {
                              setEditing(row.id_bloqueo);

                              setForm({
                                id_salita: row.id_salita,
                                id_profesional:
                                  row.id_profesional,
                                id_especialidad:
                                  row.id_especialidad,
                                fecha: row.fecha,
                                dia_completo:
                                  row.dia_completo,
                                hora_inicio:
                                  row.hora_inicio?.slice(
                                    0,
                                    5
                                  ) ?? null,
                                hora_fin:
                                  row.hora_fin?.slice(
                                    0,
                                    5
                                  ) ?? null,
                                motivo: row.motivo,
                                activo: row.activo,
                              });

                              setError('');
                              setSuccess('');

                              ref.current?.scrollIntoView({
                                block: 'start',
                              });
                            }}
                          >
                            Editar / desactivar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {!rows.filter(
              (row) =>
                !filter ||
                row.fecha === filter
            ).length && (
              <p className="p-3 text-muted">
                No hay bloqueos para este filtro.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}