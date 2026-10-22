import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import AccountSummary from '../../components/ui/AccountSummary';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ValidatedInput from '../../components/ui/ValidatedInput';

import {
  getPatientById,
  updatePatient,
  updatePatientStatus,
} from '../../services/patients.service';

import type {
  Patient,
  PatientSex,
  UpdatePatientRequest,
} from '../../types/patient.types';

import {
  authError,
} from '../../utils/auth-errors';

import {
  personFieldsError,
} from '../../utils/field-validation';

const PacienteDetallePage = () => {
  const { id } =
    useParams<{ id: string }>();

  const navigate =
    useNavigate();

  // Datos del paciente.
  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [form, setForm] =
    useState<UpdatePatientRequest>({});

  // Controla el modo de edición.
  const [editing, setEditing] =
    useState(false);

  // Estados de carga y guardado.
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    confirming,
    setConfirming,
  ] = useState(false);

  // Mensajes mostrados al usuario.
  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  // Controla las confirmaciones.
  const [
    confirmTarget,
    setConfirmTarget,
  ] = useState<Patient | null>(
    null
  );

  const [
    saveConfirmOpen,
    setSaveConfirmOpen,
  ] = useState(false);

  // Oculta automáticamente el mensaje de éxito.
  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccess('');
      }, 3000);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [success]);

  // Carga los datos del paciente.
  const loadPatient =
    async () => {
      if (!id) {
        setError(
          'Paciente inválido.'
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getPatientById(
            id
          );

        setPatient(
          response.data.patient
        );

        setForm({
          nombres:
            response.data.patient
              .nombres,

          apellidos:
            response.data.patient
              .apellidos,

          fecha_nacimiento:
            response.data.patient
              .fecha_nacimiento,

          sexo:
            response.data.patient
              .sexo,

          telefono:
            response.data.patient
              .telefono,

          email:
            response.data.patient
              .email,

          direccion:
            response.data.patient
              .direccion,

          localidad:
            response.data.patient
              .localidad ?? '',

          provincia:
            response.data.patient
              .provincia ?? '',

          codigo_postal:
            response.data.patient
              .codigo_postal,

          obra_social:
            response.data.patient
              .obra_social,

          numero_afiliado:
            response.data.patient
              .numero_afiliado,

          contacto_emergencia_nombre:
            response.data.patient
              .contacto_emergencia_nombre,

          contacto_emergencia_telefono:
            response.data.patient
              .contacto_emergencia_telefono,
        });
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo cargar el paciente.'
        );
      } finally {
        setLoading(false);
      }
    };

  // Recarga el paciente cuando cambia el identificador.
  useEffect(() => {
    void loadPatient();
  }, [id]);

  // Actualiza un campo del formulario.
  const handleChange = (
    field:
      keyof UpdatePatientRequest,
    value: string | null
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  // Valida y guarda los cambios del paciente.
  const handleSave =
    async () => {
      const validationError =
        personFieldsError(form);

      if (validationError) {
        setError(
          validationError
        );

        return;
      }

      if (!id) {
        return;
      }

      try {
        setSaving(true);
        setError('');
        setSuccess('');

        const response =
          await updatePatient(
            id,
            form
          );

        // Conserva los datos de cuenta si la actualización no los devuelve.
        setPatient(
          (current) => ({
            ...response.data
              .patient,
            cuenta:
              response.data
                .patient.cuenta ??
              current?.cuenta,
          })
        );

        setEditing(false);

        setSuccess(
          'Los datos del paciente se actualizaron correctamente.'
        );
      } catch (error) {
        console.error(error);

        setError(
          authError(error)
        );
      } finally {
        setSaving(false);
      }
    };

  // Cancela la edición y restaura los datos originales.
  const handleCancelEdit =
    () => {
      if (!patient) {
        return;
      }

      setForm({
        nombres:
          patient.nombres,

        apellidos:
          patient.apellidos,

        fecha_nacimiento:
          patient.fecha_nacimiento,

        sexo:
          patient.sexo,

        telefono:
          patient.telefono,

        email:
          patient.email,

        direccion:
          patient.direccion,

        localidad:
          patient.localidad ?? '',

        provincia:
          patient.provincia ?? '',

        codigo_postal:
          patient.codigo_postal,

        obra_social:
          patient.obra_social,

        numero_afiliado:
          patient.numero_afiliado,

        contacto_emergencia_nombre:
          patient
            .contacto_emergencia_nombre,

        contacto_emergencia_telefono:
          patient
            .contacto_emergencia_telefono,
      });

      setEditing(false);
      setError('');
      setSuccess('');
    };

  // Solicita confirmación antes de cambiar el estado.
  const handleStatusChange =
    async () => {
      if (!patient) {
        return;
      }

      setConfirmTarget(
        patient
      );
    };

  // Activa o desactiva al paciente.
  const confirmStatusChange =
    async () => {
      if (!confirmTarget) {
        return;
      }

      try {
        setConfirming(true);
        setError('');
        setSuccess('');

        const response =
          await updatePatientStatus(
            confirmTarget
              .id_paciente,
            !confirmTarget.activo
          );

        // Conserva los datos de cuenta si la respuesta no los incluye.
        setPatient(
          (current) => ({
            ...response.data
              .patient,
            cuenta:
              response.data
                .patient.cuenta ??
              current?.cuenta,
          })
        );

        setConfirmTarget(
          null
        );

        setSuccess(
          `Paciente ${
            response.data.patient
              .activo
              ? 'activado'
              : 'desactivado'
          } correctamente.`
        );
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo actualizar el estado del paciente.'
        );
      } finally {
        setConfirming(false);
      }
    };

  // Muestra un indicador mientras se carga el paciente.
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

  // Muestra el error cuando el paciente no existe.
  if (!patient) {
    return (
      <div>
        <div className="alert alert-danger">
          {error ||
            'Paciente no encontrado.'}
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate(
              '/pacientes'
            )
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver a pacientes
        </button>
      </div>
    );
  }

  return (
    <div>
      <ConfirmationModal
        open={saveConfirmOpen}
        title="Guardar cambios"
        subtitle="Esta acción requiere confirmación."
        message="¿Querés guardar los cambios del paciente?"
        detail={
          <>
            <div className="fw-semibold">
              {patient.apellidos},{' '}
              {patient.nombres}
            </div>

            <div className="text-muted small mt-1">
              DNI: {patient.dni}
            </div>
          </>
        }
        confirmText="Guardar cambios"
        cancelText="Cancelar"
        variant="primary"
        icon="bi-check-lg"
        loading={saving}
        onClose={() =>
          setSaveConfirmOpen(
            false
          )
        }
        onConfirm={() => {
          setSaveConfirmOpen(
            false
          );

          void handleSave();
        }}
      />

      {confirmTarget && (
        <ConfirmationModal
          open
          title={
            confirmTarget.activo
              ? 'Desactivar paciente'
              : 'Activar paciente'
          }
          subtitle="Esta acción requiere confirmación."
          message={
            confirmTarget.activo
              ? '¿Querés desactivar al paciente?'
              : '¿Querés volver a activar al paciente?'
          }
          detail={
            <>
              <div className="fw-semibold">
                {
                  confirmTarget.apellidos
                }
                ,{' '}
                {
                  confirmTarget.nombres
                }
              </div>

              <div className="text-muted small mt-1">
                DNI:{' '}
                {
                  confirmTarget.dni
                }
              </div>
            </>
          }
          confirmText={
            confirmTarget.activo
              ? 'Desactivar paciente'
              : 'Activar paciente'
          }
          cancelText="Cancelar"
          variant={
            confirmTarget.activo
              ? 'danger'
              : 'success'
          }
          icon={
            confirmTarget.activo
              ? 'bi-person-dash'
              : 'bi-person-check'
          }
          loading={
            confirming
          }
          onClose={() =>
            setConfirmTarget(
              null
            )
          }
          onConfirm={() =>
            void confirmStatusChange()
          }
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            type="button"
            className="btn btn-outline-secondary mb-2"
            onClick={() =>
              navigate(
                '/pacientes'
              )
            }
          >
            <i className="bi bi-arrow-left me-2" />
            Volver a pacientes
          </button>

          <h2 className="fw-bold mb-1">
            {patient.apellidos},{' '}
            {patient.nombres}
          </h2>

          <p className="text-muted mb-0">
            DNI: {patient.dni}
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setEditing(true);
              setSuccess('');
              setError('');
            }}
            disabled={editing}
          >
            <i className="bi bi-pencil me-2" />
            Editar
          </button>

          <button
            type="button"
            className={`btn ${
              patient.activo
                ? 'btn-outline-danger'
                : 'btn-outline-success'
            }`}
            onClick={() =>
              void handleStatusChange()
            }
          >
            <i
              className={`bi ${
                patient.activo
                  ? 'bi-person-dash'
                  : 'bi-person-check'
              } me-2`}
            />

            {patient.activo
              ? 'Desactivar'
              : 'Activar'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {success}
        </div>
      )}

      <div className="mb-3">
        <AccountSummary
          account={
            patient.cuenta
          }
        />
      </div>

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
                DNI
              </label>

              <input
                type="text"
                className="form-control"
                value={
                  patient.dni
                }
                disabled
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Nombres
              </label>

              <ValidatedInput
                field="nombres"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.nombres ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'nombres',
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Apellidos
              </label>

              <ValidatedInput
                field="apellidos"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.apellidos ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'apellidos',
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Fecha de
                nacimiento
              </label>

              <ValidatedInput
                field="fecha_nacimiento"
                type="date"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.fecha_nacimiento ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'fecha_nacimiento',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Sexo
              </label>

              <select
                className="form-select"
                disabled={
                  !editing
                }
                value={
                  form.sexo ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'sexo',
                    event.target
                      .value
                      ? (
                          event
                            .target
                            .value as PatientSex
                        )
                      : null
                  )
                }
              >
                <option value="">
                  No informado
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

                <option value="NO_INFORMA">
                  No informa
                </option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Teléfono
              </label>

              <ValidatedInput
                field="telefono"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.telefono ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'telefono',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Email
              </label>

              <ValidatedInput
                field="email"
                type="email"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.email ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'email',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Dirección
              </label>

              <ValidatedInput
                field="direccion"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.direccion ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'direccion',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Localidad
              </label>

              <input
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.localidad ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'localidad',
                    event.target
                      .value
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
                disabled={
                  !editing
                }
                value={
                  form.provincia ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'provincia',
                    event.target
                      .value
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
                disabled={
                  !editing
                }
                value={
                  form.codigo_postal ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'codigo_postal',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-clipboard2-pulse me-2 text-success" />
            Datos del paciente
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
                disabled={
                  !editing
                }
                value={
                  form.obra_social ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'obra_social',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Número de
                afiliado
              </label>

              <input
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form.numero_afiliado ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'numero_afiliado',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

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

              <ValidatedInput
                field="contacto_emergencia_nombre"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form
                    .contacto_emergencia_nombre ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'contacto_emergencia_nombre',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Teléfono
              </label>

              <ValidatedInput
                field="contacto_emergencia_telefono"
                type="text"
                className="form-control"
                disabled={
                  !editing
                }
                value={
                  form
                    .contacto_emergencia_telefono ??
                  ''
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    'contacto_emergencia_telefono',
                    event.target
                      .value ||
                      null
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={
              handleCancelEdit
            }
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn btn-saps"
            onClick={() => {
              const validationError =
                personFieldsError(
                  form
                );

              setError(
                validationError
              );

              if (
                !validationError
              ) {
                setSaveConfirmOpen(
                  true
                );
              }
            }}
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
                <i className="bi bi-check-lg me-2" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PacienteDetallePage;