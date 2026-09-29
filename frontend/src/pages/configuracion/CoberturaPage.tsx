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
  getCoberturas,
  guardarCobertura,
} from '../../services/configuracion.service';

import { getSalitas } from '../../services/salitas.service';
import { getBarrios } from '../../services/barrios.service';

import type {
  Cobertura,
} from '../../types/configuracion.types';

import type {
  Salita,
} from '../../types/salita.types';

import type {
  Barrio,
} from '../../types/barrio.types';

import { authError } from '../../utils/auth-errors';

// Genera el estado inicial del formulario.
// Si recibe una salita, la deja seleccionada.
const empty = (id = ''): Cobertura => ({
  id_salita: id,
  id_barrio: '',
  es_barrio_sede: false,
  activo: true,
  fecha_desde: new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date()),
  fecha_hasta: null,
});

export default function CoberturaPage() {
  // Permite recibir una salita desde la URL.
  const [params] = useSearchParams();

  // Estado del formulario.
  const [form, setForm] = useState<Cobertura>(() =>
    empty(params.get('salita') ?? '')
  );

  const [editing, setEditing] = useState(false);

  // Datos utilizados por la pantalla.
  const [rows, setRows] = useState<Cobertura[]>([]);
  const [clinics, setClinics] = useState<Salita[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);

  // Filtro de coberturas por salita.
  const [filter, setFilter] = useState(
    params.get('salita') ?? ''
  );

  // Estados generales.
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  // Referencia para volver al formulario al editar.
  const formRef = useRef<HTMLFormElement>(null);

  // Carga coberturas, salitas y barrios.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setReady(false);
    setError('');

    void Promise.all([
      getCoberturas(),
      getSalitas(),
      getBarrios(),
    ])
      .then(([r, c, b]) => {
        if (active) {
          setRows(r);
          setClinics(c.data);
          setBarrios(b.data.barrios);
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

  // Actualiza parcialmente los datos del formulario.
  const change = (patch: Partial<Cobertura>) => {
    setForm((value) => ({
      ...value,
      ...patch,
    }));
  };

  // Limpia el formulario y finaliza la edición.
  const reset = () => {
    setForm(empty(filter));
    setEditing(false);
  };

  // Guarda una nueva cobertura o actualiza una existente.
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy || !ready) return;

    setError('');
    setSuccess('');

    // Evita crear nuevamente una relación existente.
    if (
      !editing &&
      rows.some(
        (row) =>
          row.id_salita === form.id_salita &&
          row.id_barrio === form.id_barrio
      )
    ) {
      setError(
        'Esta relación ya existe. Editala para cambiar sus fechas o reactivarla.'
      );
      return;
    }

    // La fecha final no puede ser anterior al inicio.
    if (
      form.fecha_hasta &&
      form.fecha_hasta < form.fecha_desde
    ) {
      setError(
        'La fecha final no puede ser anterior al inicio.'
      );
      return;
    }

    // Cada salita puede tener solamente un barrio sede.
    if (
      form.es_barrio_sede &&
      rows.some(
        (row) =>
          row.id_salita === form.id_salita &&
          row.id_barrio !== form.id_barrio &&
          row.es_barrio_sede
      )
    ) {
      setError(
        'La salita ya tiene un barrio sede. Quitá esa marca de la relación anterior antes de asignar otra.'
      );
      return;
    }

    setBusy(true);

    try {
      await guardarCobertura(
        form,
        editing
      );

      reset();

      setSuccess('Cobertura guardada.');

      // Fuerza la recarga de los datos.
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // Filtra las coberturas por la salita seleccionada.
  const visible = rows.filter(
    (row) =>
      !filter ||
      row.id_salita === filter
  );

  return (
    <div>
      <Link
        to="/configuracion"
        className="btn btn-outline-success mb-3"
      >
        Volver a Configuración
      </Link>

      <div className="dashboard-header">
        <h1>Cobertura de salitas</h1>

        <p>
          Asigná los barrios atendidos por cada salita y su
          período de vigencia.
        </p>
      </div>

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
        ref={formRef}
        onSubmit={submit}
        className="dashboard-panel p-3 mb-4 configuration-form"
      >
        <h2 className="h5">
          {editing
            ? 'Editar cobertura'
            : 'Asignar barrio'}
        </h2>

        <fieldset
          disabled={loading || busy || !ready}
        >
          <div className="row g-3">
            {/* Selección de salita */}
            <label className="col-md-6 form-label">
              Salita

              <select
                className="form-select"
                required
                disabled={editing}
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

                {clinics
                  .filter(
                    (clinic) =>
                      clinic.activo ||
                      clinic.id_salita === form.id_salita
                  )
                  .map((clinic) => (
                    <option
                      key={clinic.id_salita}
                      value={clinic.id_salita}
                    >
                      {clinic.nombre}
                    </option>
                  ))}
              </select>
            </label>

            {/* Selección de barrio */}
            <label className="col-md-6 form-label">
              Barrio

              <select
                className="form-select"
                required
                disabled={editing}
                value={form.id_barrio}
                onChange={(e) =>
                  change({
                    id_barrio: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar barrio
                </option>

                {barrios
                  .filter(
                    (barrio) =>
                      barrio.activo ||
                      barrio.id_barrio === form.id_barrio
                  )
                  .map((barrio) => (
                    <option
                      key={barrio.id_barrio}
                      value={barrio.id_barrio}
                    >
                      {barrio.nombre}
                    </option>
                  ))}
              </select>
            </label>

            {/* Período de vigencia */}
            <label className="col-md-6 form-label">
              Desde

              <input
                className="form-control"
                type="date"
                required
                value={form.fecha_desde}
                onChange={(e) =>
                  change({
                    fecha_desde: e.target.value,
                  })
                }
              />
            </label>

            <label className="col-md-6 form-label">
              Hasta (opcional)

              <input
                className="form-control"
                type="date"
                min={form.fecha_desde}
                value={form.fecha_hasta ?? ''}
                onChange={(e) =>
                  change({
                    fecha_hasta:
                      e.target.value || null,
                  })
                }
              />
            </label>

            {/* Opciones de la cobertura */}
            <div className="col-12 d-flex flex-wrap gap-4">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.es_barrio_sede}
                  onChange={(e) =>
                    change({
                      es_barrio_sede:
                        e.target.checked,
                    })
                  }
                />

                Es el barrio sede
              </label>

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

                Cobertura activa
              </label>
            </div>

            {/* Acciones del formulario */}
            <div className="col-12 d-flex flex-wrap gap-2">
              <button className="btn btn-saps">
                {busy
                  ? 'Guardando…'
                  : 'Guardar cobertura'}
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

              <Link
                to="/configuracion/barrios"
                className="btn btn-outline-success"
              >
                Administrar barrios
              </Link>
            </div>
          </div>
        </fieldset>
      </form>

      {/* Listado de coberturas */}
      <section className="dashboard-panel">
        <div className="p-3">
          <label className="form-label w-100">
            Filtrar salita

            <select
              className="form-select"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="">
                Todas
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
        </div>

        {loading ? (
          <p
            className="p-3"
            role="status"
          >
            Cargando cobertura…
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table saps-responsive-table">
              <thead>
                <tr>
                  {[
                    'Salita',
                    'Barrio',
                    'Vigencia',
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
                {visible.map((row) => (
                  <tr
                    key={`${row.id_salita}-${row.id_barrio}`}
                  >
                    <td data-label="Salita">
                      {clinics.find(
                        (clinic) =>
                          clinic.id_salita ===
                          row.id_salita
                      )?.nombre ??
                        'Salita no disponible'}
                    </td>

                    <td data-label="Barrio">
                      {barrios.find(
                        (barrio) =>
                          barrio.id_barrio ===
                          row.id_barrio
                      )?.nombre ??
                        'Barrio no disponible'}

                      {row.es_barrio_sede && (
                        <span className="badge text-bg-success ms-2">
                          Sede
                        </span>
                      )}
                    </td>

                    <td data-label="Vigencia">
                      {row.fecha_desde} /{' '}
                      {row.fecha_hasta ?? 'Sin fin'}
                    </td>

                    <td data-label="Estado">
                      {row.activo
                        ? 'Activa'
                        : 'Inactiva'}
                    </td>

                    <td data-label="Acciones">
                      <button
                        className="btn btn-outline-success"
                        disabled={busy}
                        onClick={() => {
                          setEditing(true);

                          setForm({
                            ...row,
                          });

                          setError('');
                          setSuccess('');

                          // Regresa al formulario para editar.
                          formRef.current?.scrollIntoView({
                            block: 'start',
                          });
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!visible.length && (
              <p className="p-3 text-muted">
                No hay coberturas para este filtro.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}