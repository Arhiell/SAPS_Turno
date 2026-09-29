import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

import {
  getCatalogo,
  getZonas,
  guardarCatalogo,
} from '../../services/configuracion.service';

import type {
  CatalogoInput,
  CatalogoRegistro,
  CatalogoTipo,
  Zona,
} from '../../types/configuracion.types';

import { authError } from '../../utils/auth-errors';

// Títulos utilizados según el catálogo seleccionado.
const titles = {
  zonas: 'Zonas',
  barrios: 'Barrios',
  especialidades: 'Especialidades',
};

// Genera el estado inicial del formulario.
const empty = (): CatalogoInput => ({
  nombre: '',
  activo: true,
});

// Normaliza textos para realizar búsquedas y comparar duplicados.
const normalize = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

export default function CatalogoPage({
  tipo,
}: {
  tipo: CatalogoTipo;
}) {
  // Datos del catálogo.
  const [rows, setRows] = useState<CatalogoRegistro[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);

  // Estado del formulario.
  const [form, setForm] = useState<CatalogoInput>(empty);
  const [editing, setEditing] = useState<string>();

  // Filtros del listado.
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');

  // Estados generales de la pantalla.
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  // Referencias para desplazamiento y foco al editar.
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Carga los registros del catálogo.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setReady(false);
    setError('');

    void Promise.all([
      getCatalogo(tipo),
      tipo === 'barrios'
        ? getZonas()
        : Promise.resolve([]),
    ])
      .then(([data, zones]) => {
        if (active) {
          setRows(data);
          setZonas(zones);
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
  }, [tipo, revision]);

  // Actualiza parcialmente los datos del formulario.
  const change = (patch: Partial<CatalogoInput>) => {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  };

  // Limpia el formulario y finaliza la edición.
  const reset = () => {
    setEditing(undefined);
    setForm(empty());
  };

  // Carga un registro existente en el formulario.
  const edit = (row: CatalogoRegistro) => {
    setEditing(row.id);

    setForm({
      nombre: row.nombre,
      activo: row.activo,

      ...(tipo === 'barrios'
        ? {
            id_zona: row.id_zona,
            codigo_postal: row.codigo_postal,
          }
        : {
            descripcion: row.descripcion,
          }),

      ...(tipo === 'especialidades'
        ? {
            codigo: row.codigo,
            requiere_profesional: row.requiere_profesional,
          }
        : {}),
    });

    setError('');
    setSuccess('');

    // Lleva al usuario nuevamente al formulario.
    formRef.current?.scrollIntoView({
      block: 'start',
    });

    nameRef.current?.focus({
      preventScroll: true,
    });
  };

  // Guarda un nuevo registro o actualiza uno existente.
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy || loading || !ready) {
      return;
    }

    setError('');
    setSuccess('');

    // El nombre es obligatorio.
    if (!form.nombre.trim()) {
      setError('Ingresá un nombre.');
      return;
    }

    // Incluye inactivos para permitir encontrar y reactivar registros.
    const duplicatedName = rows.some(
      (row) =>
        row.id !== editing &&
        (
          tipo !== 'barrios' ||
          row.id_zona === form.id_zona
        ) &&
        normalize(row.nombre) === normalize(form.nombre)
    );

    if (duplicatedName) {
      setError(
        'Ya existe ese nombre. Buscalo en el listado para editarlo o reactivarlo.'
      );
      return;
    }

    // El código de una especialidad también debe ser único.
    if (
      tipo === 'especialidades' &&
      rows.some(
        (row) =>
          row.id !== editing &&
          normalize(row.codigo ?? '') ===
            normalize(form.codigo ?? '')
      )
    ) {
      setError(
        'Ya existe una especialidad con ese código.'
      );
      return;
    }

    // Normaliza los datos antes de enviarlos al servicio.
    const input: CatalogoInput = {
      nombre: form.nombre.trim(),
      activo: form.activo,

      ...(tipo === 'barrios'
        ? {
            id_zona: form.id_zona,
            codigo_postal:
              form.codigo_postal?.trim() || null,
          }
        : {
            descripcion:
              form.descripcion?.trim() || null,
          }),

      ...(tipo === 'especialidades'
        ? {
            codigo: form.codigo
              ?.trim()
              .toUpperCase(),
            requiere_profesional:
              form.requiere_profesional ?? true,
          }
        : {}),
    };

    setBusy(true);

    try {
      await guardarCatalogo(
        tipo,
        input,
        editing
      );

      reset();

      setSuccess('Registro guardado.');

      // Fuerza una nueva carga del listado.
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // Aplica búsqueda por texto y filtro por estado.
  const filtered = rows.filter(
    (row) =>
      normalize(
        `${row.nombre} ${row.codigo ?? ''}`
      ).includes(normalize(search)) &&
      (
        status === 'todos' ||
        row.activo === (status === 'activos')
      )
  );

  return (
    <div>
      <Link
        className="btn btn-outline-success mb-3"
        to="/configuracion"
      >
        <i className="bi bi-arrow-left me-2" />

        Configuración
      </Link>

      <div className="dashboard-header">
        <h1>{titles[tipo]}</h1>

        <p>
          Creá, editá o reactivá los registros que utiliza
          el sistema.
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
            type="button"
            className="btn btn-outline-danger ms-2"
            disabled={busy}
            onClick={() =>
              setRevision((value) => value + 1)
            }
          >
            Recargar listado
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

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-xl-4">
          <form
            ref={formRef}
            className="dashboard-panel p-3 configuration-form"
            onSubmit={submit}
          >
            <h2 className="h5">
              {editing
                ? 'Editar registro'
                : 'Nuevo registro'}
            </h2>

            <fieldset
              disabled={busy || loading || !ready}
            >
              <label className="form-label w-100">
                Nombre

                <input
                  ref={nameRef}
                  className="form-control"
                  required
                  maxLength={
                    tipo === 'barrios'
                      ? 120
                      : 100
                  }
                  value={form.nombre}
                  onChange={(e) =>
                    change({
                      nombre: e.target.value,
                    })
                  }
                />
              </label>

              {/* Campos específicos de barrios */}
              {tipo === 'barrios' ? (
                <>
                  <label className="form-label w-100">
                    Zona

                    <select
                      className="form-select"
                      required
                      value={form.id_zona ?? ''}
                      onChange={(e) =>
                        change({
                          id_zona: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Seleccionar zona
                      </option>

                      {zonas
                        .filter(
                          (zona) =>
                            zona.activo ||
                            zona.id_zona === form.id_zona
                        )
                        .map((zona) => (
                          <option
                            key={zona.id_zona}
                            value={zona.id_zona}
                          >
                            {zona.nombre}

                            {!zona.activo
                              ? ' (inactiva)'
                              : ''}
                          </option>
                        ))}
                    </select>
                  </label>

                  <Link
                    to="/configuracion/zonas"
                    className="d-inline-block mb-3"
                  >
                    Administrar zonas
                  </Link>

                  <label className="form-label w-100">
                    Código postal (opcional)

                    <input
                      className="form-control"
                      maxLength={12}
                      value={
                        form.codigo_postal ?? ''
                      }
                      onChange={(e) =>
                        change({
                          codigo_postal:
                            e.target.value,
                        })
                      }
                    />
                  </label>
                </>
              ) : (
                <label className="form-label w-100">
                  Descripción (opcional)

                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.descripcion ?? ''}
                    onChange={(e) =>
                      change({
                        descripcion: e.target.value,
                      })
                    }
                  />
                </label>
              )}

              {/* Campos específicos de especialidades */}
              {tipo === 'especialidades' && (
                <>
                  <label className="form-label w-100">
                    Código

                    <input
                      className="form-control"
                      required
                      maxLength={30}
                      value={form.codigo ?? ''}
                      onChange={(e) =>
                        change({
                          codigo: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        form.requiere_profesional ??
                        true
                      }
                      onChange={(e) =>
                        change({
                          requiere_profesional:
                            e.target.checked,
                        })
                      }
                    />

                    Requiere profesional
                  </label>
                </>
              )}

              {/* Estado del registro */}
              <label className="form-check my-3">
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

                Activo
              </label>

              <p className="small text-muted">
                Los registros inactivos se conservan, pero
                dejan de estar disponibles para nuevas
                selecciones.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-saps">
                  {busy
                    ? 'Guardando…'
                    : 'Guardar'}
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
            </fieldset>
          </form>
        </div>

        {/* Listado de registros */}
        <div className="col-xl-8">
          <section className="dashboard-panel">
            <div className="p-3">
              <h2 className="h5">
                Registros ({filtered.length})
              </h2>

              <div className="row g-2">
                <label className="col-sm-8">
                  Buscar

                  <input
                    className="form-control"
                    type="search"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Nombre o código"
                  />
                </label>

                <label className="col-sm-4">
                  Estado

                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                  >
                    <option value="todos">
                      Todos
                    </option>

                    <option value="activos">
                      Activos
                    </option>

                    <option value="inactivos">
                      Inactivos
                    </option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <p
                role="status"
                className="p-3"
              >
                Cargando registros…
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table saps-responsive-table">
                  <thead>
                    <tr>
                      <th scope="col">
                        Nombre
                      </th>

                      <th scope="col">
                        {tipo === 'barrios'
                          ? 'Zona'
                          : 'Detalle'}
                      </th>

                      <th scope="col">
                        Estado
                      </th>

                      <th scope="col">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td data-label="Nombre">
                          <strong>
                            {row.nombre}
                          </strong>
                        </td>

                        <td
                          data-label={
                            tipo === 'barrios'
                              ? 'Zona'
                              : 'Detalle'
                          }
                        >
                          {tipo === 'barrios'
                            ? zonas.find(
                                (zona) =>
                                  zona.id_zona ===
                                  row.id_zona
                              )?.nombre ??
                              'Sin zona disponible'
                            : row.codigo ||
                              row.descripcion ||
                              '—'}
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
                            type="button"
                            className="btn btn-outline-success"
                            disabled={busy}
                            onClick={() =>
                              edit(row)
                            }
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!filtered.length && (
                  <p className="p-3 text-muted">
                    No hay registros para estos filtros.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}