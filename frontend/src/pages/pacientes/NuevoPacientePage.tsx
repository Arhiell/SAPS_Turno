import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';

import {
  createPatient,
} from '../../services/patients.service';

import {
  getBarrios,
} from '../../services/barrios.service';

import {
  getAdminSalitas,
} from '../../services/salitas.service';

import type {
  Barrio,
} from '../../types/barrio.types';

import type {
  Salita,
} from '../../types/salita.types';

import type {
  CreatePatientRequest,
  PatientSex,
} from '../../types/patient.types';

const NuevoPacientePage = () => {
  const navigate =
    useNavigate();

  const [barrios, setBarrios] =
    useState<Barrio[]>([]);

  const [salitas, setSalitas] =
    useState<Salita[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [form, setForm] =
    useState<CreatePatientRequest>({
      dni: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      sexo: 'NO_INFORMA',
      telefono: '',
      email: '',
      direccion: '',
      localidad: '',
      provincia: '',
      codigo_postal: '',
      id_barrio: '',
      id_salita_asignada: '',
      obra_social: '',
      numero_afiliado: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
    });

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);
          setError('');

          const [
            barriosResponse,
            salitasResponse,
          ] = await Promise.all([
            getBarrios(),
            getAdminSalitas(),
          ]);

          setBarrios(
            barriosResponse.data.barrios.filter(
              (barrio) =>
                barrio.activo,
            ),
          );

          setSalitas(
            salitasResponse.data.filter(
              (salita) =>
                salita.activo,
            ),
          );
        } catch (error) {
          console.error(error);

          setError(
            'No se pudieron cargar los barrios y las salitas.',
          );
        } finally {
          setLoading(false);
        }
      };

    void loadData();
  }, []);

  const salitasDisponibles =
    useMemo(() => {
      if (!form.id_barrio) {
        return [];
      }

      return salitas.filter(
        (salita) =>
          salita.id_barrio ===
          form.id_barrio,
      );
    }, [
      salitas,
      form.id_barrio,
    ]);

  const handleChange = (
    field: keyof CreatePatientRequest,
    value: string,
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  };

  const handleBarrioChange = (
    value: string,
  ) => {
    setForm(
      (current) => ({
        ...current,
        id_barrio: value,
        id_salita_asignada: '',
      }),
    );
  };

  const handleSubmit =
    async (
      event?: React.FormEvent<HTMLFormElement>,
    ) => {
      event?.preventDefault();

      try {
        setSaving(true);
        setError('');
        setMessage('');

        await createPatient({
          ...form,

          dni:
            form.dni.trim(),

          nombres:
            form.nombres.trim(),

          apellidos:
            form.apellidos.trim(),

          fecha_nacimiento:
            form.fecha_nacimiento,

          direccion:
            form.direccion.trim(),

          telefono:
            form.telefono?.trim() ||
            null,

          email:
            form.email?.trim() ||
            null,

          localidad:
            form.localidad?.trim(),

          provincia:
            form.provincia?.trim(),

          codigo_postal:
            form.codigo_postal?.trim() ||
            null,

          obra_social:
            form.obra_social?.trim() ||
            null,

          numero_afiliado:
            form.numero_afiliado?.trim() ||
            null,

          contacto_emergencia_nombre:
            form.contacto_emergencia_nombre?.trim() ||
            null,

          contacto_emergencia_telefono:
            form.contacto_emergencia_telefono?.trim() ||
            null,
        });

        setMessage(
          'Paciente registrado correctamente.',
        );

        setTimeout(() => {
          navigate(
            '/pacientes',
            {
              replace: true,
            },
          );
        }, 700);
      } catch (error: any) {
        console.error(error);

        const message =
          error?.response?.data?.message ||
          'No se pudo registrar el paciente.';

        setError(message);
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-success"
          role="status"
        >
          <span className="visually-hidden">
            Cargando...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ConfirmationModal
        open={confirmOpen}
        title="Registrar paciente"
        message="¿Querés registrar este paciente?"
        detail={
          <>
            <div className="fw-semibold">{form.apellidos}, {form.nombres}</div>
            <div className="text-muted small mt-1">DNI: {form.dni}</div>
          </>
        }
        confirmText="Registrar paciente"
        variant="primary"
        icon="bi-person-plus"
        loading={saving}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleSubmit();
        }}
      />

      {/* ENCABEZADO */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-link text-decoration-none p-0 mb-2"
          onClick={() =>
            navigate('/pacientes')
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver a pacientes
        </button>

        <h2 className="fw-bold mb-1">
          Nuevo paciente
        </h2>

        <p className="text-muted mb-0">
          Registrar un nuevo paciente en el sistema.
        </p>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {message && (
        <div
          className="alert alert-success"
          role="alert"
        >
          <i className="bi bi-check-circle me-2" />
          {message}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmOpen(true);
        }}
      >
        {/* DATOS PERSONALES */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-person me-2 text-success" />
              Datos personales
            </h5>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-4">
                <label className="form-label">
                  DNI *
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.dni}
                  onChange={(event) =>
                    handleChange(
                      'dni',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Nombres *
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.nombres}
                  onChange={(event) =>
                    handleChange(
                      'nombres',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Apellidos *
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.apellidos}
                  onChange={(event) =>
                    handleChange(
                      'apellidos',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Fecha de nacimiento *
                </label>

                <input
                  type="date"
                  className="form-control"
                  value={
                    form.fecha_nacimiento
                  }
                  onChange={(event) =>
                    handleChange(
                      'fecha_nacimiento',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Sexo *
                </label>

                <select
                  className="form-select"
                  value={form.sexo}
                  onChange={(event) =>
                    handleChange(
                      'sexo',
                      event.target.value as PatientSex,
                    )
                  }
                  required
                >
                  <option value="NO_INFORMA">
                    No informa
                  </option>

                  <option value="FEMENINO">
                    Femenino
                  </option>

                  <option value="MASCULINO">
                    Masculino
                  </option>

                  <option value="X">
                    X
                  </option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Teléfono
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.telefono ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'telefono',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  className="form-control"
                  value={
                    form.email ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'email',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Dirección *
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.direccion}
                  onChange={(event) =>
                    handleChange(
                      'direccion',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Localidad
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.localidad ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'localidad',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Provincia
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.provincia ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'provincia',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Código postal
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.codigo_postal ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'codigo_postal',
                      event.target.value,
                    )
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* ASIGNACIÓN */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-hospital me-2 text-success" />
              Asignación
            </h5>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Barrio *
                </label>

                <select
                  className="form-select"
                  value={form.id_barrio}
                  onChange={(event) =>
                    handleBarrioChange(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar barrio
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
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Salita asignada *
                </label>

                <select
                  className="form-select"
                  value={
                    form.id_salita_asignada
                  }
                  onChange={(event) =>
                    handleChange(
                      'id_salita_asignada',
                      event.target.value,
                    )
                  }
                  disabled={
                    !form.id_barrio
                  }
                  required
                >
                  <option value="">
                    {!form.id_barrio
                      ? 'Seleccione primero un barrio'
                      : 'Seleccionar salita'}
                  </option>

                  {salitasDisponibles.map(
                    (salita) => (
                      <option
                        key={
                          salita.id_salita
                        }
                        value={
                          salita.id_salita
                        }
                      >
                        {salita.nombre}
                      </option>
                    ),
                  )}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* OBRA SOCIAL */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-credit-card me-2 text-success" />
              Obra social
            </h5>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Obra social
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.obra_social ?? ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'obra_social',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Número de afiliado
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.numero_afiliado ??
                    ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'numero_afiliado',
                      event.target.value,
                    )
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* CONTACTO DE EMERGENCIA */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-telephone me-2 text-success" />
              Contacto de emergencia
            </h5>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Nombre
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.contacto_emergencia_nombre ??
                    ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'contacto_emergencia_nombre',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Teléfono
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    form.contacto_emergencia_telefono ??
                    ''
                  }
                  onChange={(event) =>
                    handleChange(
                      'contacto_emergencia_telefono',
                      event.target.value,
                    )
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() =>
              navigate('/pacientes')
            }
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-saps"
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />

                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2" />
                Registrar paciente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoPacientePage;
