import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authError } from '../../utils/auth-errors';

import { getBarrios } from '../../services/barrios.service';

import type { Barrio } from '../../types/barrio.types';

import type {
  CreateSalitaRequest,
} from '../../types/salita.types';

import '../../styles/salitas.css';

interface SalitaFormProps {
  initialData?: Partial<CreateSalitaRequest>;
  submitLabel: string;
  loading?: boolean;
  showActive?: boolean;
  onSubmit: (
    data: CreateSalitaRequest,
  ) => Promise<void>;
  onCancel: () => void;
}

const SalitaForm = ({
  initialData,
  submitLabel,
  loading = false,
  showActive = false,
  onSubmit,
  onCancel,
}: SalitaFormProps) => {
  const [barrios, setBarrios] =
    useState<Barrio[]>([]);

  const [loadingBarrios, setLoadingBarrios] =
    useState(true);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [barriosRevision, setBarriosRevision] = useState(0);

  const [form, setForm] =
    useState<CreateSalitaRequest>({
      codigo:
        initialData?.codigo ?? '',

      nombre:
        initialData?.nombre ?? '',

      direccion:
        initialData?.direccion ?? '',

      id_barrio:
        initialData?.id_barrio ?? '',

      telefono:
        initialData?.telefono ?? '',

      email:
        initialData?.email ?? '',

      latitud:
        initialData?.latitud ?? null,

      longitud:
        initialData?.longitud ?? null,

      horario_apertura:
        initialData?.horario_apertura ?? '',

      horario_cierre:
        initialData?.horario_cierre ?? '',

      activo:
        initialData?.activo ?? true,
    });

  useEffect(() => {
    const loadBarrios = async () => {
      try {
        setLoadingBarrios(true);
        setError('');

        const response =
          await getBarrios();

        setBarrios(
          response.data.barrios.filter(
            (barrio) => barrio.activo,
          ),
        );
      } catch (error) {
        console.error(error);

        setError(
          'No se pudieron cargar los barrios.',
        );
      } finally {
        setLoadingBarrios(false);
      }
    };

    void loadBarrios();
  }, [barriosRevision]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } =
      event.target;

    if (
      name === 'latitud' ||
      name === 'longitud'
    ) {
      setForm((current) => ({
        ...current,
        [name]:
          value === ''
            ? null
            : Number(value),
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    if (saving || loading || loadingBarrios) return;

    setError('');

    const codigo =
      form.codigo.trim().toUpperCase();

    const nombre =
      form.nombre.trim();

    const direccion =
      form.direccion.trim();

    if (!codigo) {
      setError(
        'El código de la salita es obligatorio.',
      );

      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(codigo)) {
      setError(
        'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos.',
      );

      return;
    }

    if (!nombre) {
      setError(
        'El nombre de la salita es obligatorio.',
      );

      return;
    }

    if (!direccion) {
      setError(
        'La dirección es obligatoria.',
      );

      return;
    }

    if (!form.id_barrio) {
      setError(
        'Debe seleccionar un barrio.',
      );

      return;
    }

    if (Boolean(form.horario_apertura) !== Boolean(form.horario_cierre)) {
      setError('Completá ambos horarios de apertura y cierre, o dejá ambos vacíos.');
      return;
    }

    if (
      form.horario_apertura &&
      form.horario_cierre &&
      form.horario_apertura >=
        form.horario_cierre
    ) {
      setError(
        'El horario de apertura debe ser anterior al horario de cierre.',
      );

      return;
    }

    const data: CreateSalitaRequest = {
      ...form,

      codigo,
      nombre,
      direccion,

      telefono:
        form.telefono?.trim() || null,

      email:
        form.email?.trim() || null,

      latitud:
        form.latitud === null ||
        form.latitud === undefined
          ? null
          : Number(form.latitud),

      longitud:
        form.longitud === null ||
        form.longitud === undefined
          ? null
          : Number(form.longitud),

      horario_apertura:
        form.horario_apertura || null,

      horario_cierre:
        form.horario_cierre || null,
    };

    try {
      setSaving(true);
      await onSubmit(data);
    } catch (error) {
      console.error(error);

      setError(authError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="salitas-page">
      <form onSubmit={handleSubmit}>

        {error && (
          <div
            className="alert alert-danger mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="row g-4">

          {/* DATOS PRINCIPALES */}
          <div className="col-12">
            <section className="salitas-section">

              <div className="salitas-section-header">
                <h2>
                  Datos de la salita
                </h2>

                <p>
                  Información principal del
                  establecimiento.
                </p>
              </div>

              <div className="salitas-section-body">

                <div className="row salitas-form-grid">

                  <div className="col-md-4">
                    <label
                      htmlFor="codigo"
                      className="form-label"
                    >
                      Código *
                    </label>

                    <input
                      id="codigo"
                      name="codigo"
                      type="text"
                      className="form-control"
                      placeholder="SAPS-01"
                      value={form.codigo}
                      onChange={handleChange}
                      maxLength={30}
                      required
                    />

                    <small className="salitas-small-help">
                      Ejemplo: SAPS-01
                    </small>
                  </div>

                  <div className="col-md-8">
                    <label
                      htmlFor="nombre"
                      className="form-label"
                    >
                      Nombre *
                    </label>

                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      className="form-control"
                      placeholder="SAPS Barrio Norte"
                      value={form.nombre}
                      onChange={handleChange}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="direccion"
                      className="form-label"
                    >
                      Dirección *
                    </label>

                    <input
                      id="direccion"
                      name="direccion"
                      type="text"
                      className="form-control"
                      placeholder="Av. Principal 123"
                      value={form.direccion}
                      onChange={handleChange}
                      maxLength={250}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="id_barrio"
                      className="form-label"
                    >
                      Barrio *
                    </label>

                    <select
                      id="id_barrio"
                      name="id_barrio"
                      className="form-select"
                      value={form.id_barrio}
                      onChange={handleChange}
                      disabled={loadingBarrios}
                      required
                    >
                      <option value="">
                        {loadingBarrios
                          ? 'Cargando barrios...'
                          : 'Seleccionar barrio'}
                      </option>

                      {barrios.map(
                        (barrio) => (
                          <option
                            key={
                              barrio.id_barrio
                            }
                            value={
                              barrio.id_barrio
                            }
                          >
                            {barrio.nombre}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <Link to="/configuracion/barrios" target="_blank" rel="noopener noreferrer">Administrar barrios (otra pestaña)</Link>
                      <button type="button" className="btn btn-sm btn-outline-success" disabled={loadingBarrios || saving} onClick={() => setBarriosRevision((v) => v + 1)}>Actualizar listado</button>
                    </div>
                    {!loadingBarrios && !barrios.length && <p className="small text-muted mt-2">Primero cargá una zona y un barrio activo en Configuración.</p>}
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="telefono"
                      className="form-label"
                    >
                      Teléfono
                    </label>

                    <input
                      id="telefono"
                      name="telefono"
                      type="text"
                      className="form-control"
                      placeholder="3794..."
                      value={
                        form.telefono ?? ''
                      }
                      onChange={handleChange}
                      maxLength={30}
                    />
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="email"
                      className="form-label"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="salita@municipio.gob.ar"
                      value={
                        form.email ?? ''
                      }
                      onChange={handleChange}
                      maxLength={254}
                    />
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* HORARIO */}
          <div className="col-lg-6">
            <section className="salitas-section h-100">

              <div className="salitas-section-header">
                <h2>
                  Horario de atención
                </h2>

                <p>
                  Horario general de
                  funcionamiento.
                </p>
              </div>

              <div className="salitas-section-body">

                <div className="row g-3">

                  <div className="col-md-6">
                    <label
                      htmlFor="horario_apertura"
                      className="form-label"
                    >
                      Apertura
                    </label>

                    <input
                      id="horario_apertura"
                      name="horario_apertura"
                      type="time"
                      className="form-control"
                      value={
                        form.horario_apertura ??
                        ''
                      }
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="horario_cierre"
                      className="form-label"
                    >
                      Cierre
                    </label>

                    <input
                      id="horario_cierre"
                      name="horario_cierre"
                      type="time"
                      className="form-control"
                      value={
                        form.horario_cierre ??
                        ''
                      }
                      onChange={handleChange}
                    />
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* UBICACION */}
          <div className="col-lg-6">
            <section className="salitas-section h-100">

              <div className="salitas-section-header">
                <h2>
                  Ubicación
                </h2>

                <p>
                  Coordenadas geográficas
                  opcionales.
                </p>
              </div>

              <div className="salitas-section-body">

                <div className="row g-3">

                  <div className="col-md-6">
                    <label
                      htmlFor="latitud"
                      className="form-label"
                    >
                      Latitud
                    </label>

                    <input
                      id="latitud"
                      name="latitud"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      className="form-control"
                      placeholder="-29.1400"
                      value={
                        form.latitud ?? ''
                      }
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="longitud"
                      className="form-label"
                    >
                      Longitud
                    </label>

                    <input
                      id="longitud"
                      name="longitud"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      className="form-control"
                      placeholder="-59.2600"
                      value={
                        form.longitud ?? ''
                      }
                      onChange={handleChange}
                    />
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* ESTADO */}
          {showActive && (
            <div className="col-12">
              <section className="salitas-section">
                <div className="salitas-section-body py-3">

                  <div className="form-check form-switch">
                    <input
                      id="activo"
                      name="activo"
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        form.activo !== false
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            activo:
                              event.target
                                .checked,
                          }),
                        )
                      }
                    />

                    <label
                      htmlFor="activo"
                      className="form-check-label"
                    >
                      Salita activa
                    </label>
                  </div>

                </div>
              </section>
            </div>
          )}

        </div>

        <div className="salitas-form-actions">

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={loading || saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-saps"
            disabled={
              loading ||
              saving ||
              loadingBarrios
            }
          >
            {loading || saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />

                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2" />

                {submitLabel}
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
};

export default SalitaForm;
