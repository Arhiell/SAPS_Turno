import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import ConnectionStatusBadge from '../../components/ui/ConnectionStatusBadge';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import { useAutoDismiss } from '../../utils/useAutoDismiss';
import { getBarrios } from '../../services/barrios.service';
import { getSalitas } from '../../services/salitas.service';
import type { Barrio } from '../../types/barrio.types';
import type { Salita } from '../../types/salita.types';

import PatientAccountPanel from '../../components/ui/PatientAccountPanel';
import PatientTutorsPanel from '../../components/ui/PatientTutorsPanel';
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

  const { permissions } = useAuth();
  const { ultimoEventoPaciente, resyncTick } = useAgendaSocket();

  // Datos del paciente.
  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [salitas, setSalitas] = useState<Salita[]>([]);

  const [form, setForm] =
    useState<UpdatePatientRequest>({});

  // Controla el modo de edición.
  const [editing, setEditing] =
    useState(false);

  // Estados de carga y guardado.
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Feedback unificado de 15 segundos.
  useAutoDismiss(success, setSuccess, 15_000, Boolean(success));
  useAutoDismiss(error, setError, 15_000, Boolean(error));

  useEffect(() => {
    void Promise.all([
      getBarrios().then((r) => setBarrios(r.data.barrios)).catch(() => undefined),
      getSalitas().then((r) => setSalitas(r.data)).catch(() => undefined),
    ]);
  }, []);

  // Carga los datos del paciente.
  const loadPatient =
    async (silent = false) => {
      if (!id) {
        setError(
          'Paciente inválido.'
        );

        setLoading(false);
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError('');

        const response =
          await getPatientById(
            id
          );

        const pat = response.data.patient;
        setPatient((current) => ({
          ...pat,
          cuenta: pat.cuenta ?? current?.cuenta,
        }));

        if (!editing) {
          setForm({
            nombres: pat.nombres,
            apellidos: pat.apellidos,
            fecha_nacimiento: pat.fecha_nacimiento,
            sexo: pat.sexo,
            telefono: pat.telefono,
            email: pat.email,
            direccion: pat.direccion,
            localidad: pat.localidad ?? '',
            provincia: pat.provincia ?? '',
            codigo_postal: pat.codigo_postal,
            obra_social: pat.obra_social,
            numero_afiliado: pat.numero_afiliado,
            contacto_emergencia_nombre: pat.contacto_emergencia_nombre,
            contacto_emergencia_telefono: pat.contacto_emergencia_telefono,
          });
        }
      } catch (error) {
        console.error(error);

        if (!silent) {
          setError(
            'No se pudo cargar el paciente.'
          );
        }
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    };

  // Recarga el paciente cuando cambia el identificador.
  useEffect(() => {
    void loadPatient();
  }, [id]);

  // Actualización reactiva en tiempo real ante eventos del paciente
  useEffect(() => {
    if (!ultimoEventoPaciente) return;
    if (ultimoEventoPaciente.id_paciente !== id) return;

    if (ultimoEventoPaciente.tipo === 'PACIENTE_ESTADO_CAMBIADO') {
      setPatient((curr) =>
        curr ? { ...curr, activo: Boolean(ultimoEventoPaciente.activo) } : curr
      );
    }

    if (!editing) {
      void loadPatient(true);
    }
  }, [ultimoEventoPaciente]);

  // Resincronización al reconectar el socket
  useEffect(() => {
    if (resyncTick > 0 && !editing) {
      void loadPatient(true);
    }
  }, [resyncTick]);

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
  if (loading && !patient) {
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

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
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

          <div className="d-flex align-items-center gap-3">
            <h2 className="fw-bold mb-1">
              {patient.apellidos},{' '}
              {patient.nombres}
            </h2>
            <ConnectionStatusBadge />
            {refreshing && (
              <span
                className="spinner-border spinner-border-sm text-secondary"
                role="status"
                title="Actualizando datos en segundo plano..."
              />
            )}
          </div>

          <p className="text-muted mb-0">
            DNI: {patient.dni}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {/* TURNOS DEL PACIENTE */}
          <Link
            to={`/turnos?search=${patient.dni}`}
            className="btn btn-outline-secondary"
            title="Ver agenda y turnos del paciente"
          >
            <i className="bi bi-calendar3 me-2" />
            Turnos
          </Link>

          {/* HISTORIA CLÍNICA SI TIENE PERMISO */}
          {permissions.includes('VER_HISTORIA_CLINICA') && (
            <Link
              to={`/historia-clinica/pacientes/${patient.id_paciente}?salita=${encodeURIComponent(patient.id_salita_asignada)}`}
              className="btn btn-outline-success"
              title="Consultar historia clínica del paciente"
            >
              <i className="bi bi-journal-medical me-2" />
              Historia clínica
            </Link>
          )}

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
        <FloatingFeedbackToast
          variant="error"
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {success && (
        <FloatingFeedbackToast
          variant="success"
          message={success}
          onDismiss={() => setSuccess('')}
        />
      )}

      {/* COBERTURA Y SALITA ASIGNADA */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-geo-alt me-2 text-success" />
            Cobertura territorial y salita asignada
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-muted small mb-1">Salita asignada de cabecera</label>
              <div className="p-2 px-3 bg-light rounded border fw-semibold text-dark">
                <i className="bi bi-hospital me-2 text-success" />
                {salitas.find((s) => s.id_salita === patient.id_salita_asignada)?.nombre || 'Salita asignada'}
                {salitas.find((s) => s.id_salita === patient.id_salita_asignada)?.direccion && (
                  <span className="text-muted fw-normal small d-block mt-1">
                    Dirección: {salitas.find((s) => s.id_salita === patient.id_salita_asignada)?.direccion}
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted small mb-1">Barrio declarado</label>
              <div className="p-2 px-3 bg-light rounded border fw-semibold text-dark">
                <i className="bi bi-pin-map me-2 text-primary" />
                {barrios.find((b) => b.id_barrio === patient.id_barrio)?.nombre || 'Barrio declarado'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PatientAccountPanel key={patient.id_paciente} patient={patient} onLinked={() => void loadPatient()} />

      <PatientTutorsPanel key={patient.id_paciente} patientId={patient.id_paciente} />
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
