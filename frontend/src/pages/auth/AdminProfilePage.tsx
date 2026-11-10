import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { roleLabels } from '../../components/layout/sidebar-menu';
import { PROFESSIONAL_MESSAGE_TIMEOUT_MS, useAutoDismiss } from '../../utils/useAutoDismiss';

import PersonalProfileForm from '../../components/ui/PersonalProfileForm';
import ProfileInfoCard from '../../components/ui/ProfileInfoCard';
import AccountSecuritySection from '../../components/ui/AccountSecuritySection';
import PrivacySection from '../../components/ui/PrivacySection';

// Muestra el perfil personal y la información de cuenta de administradores y profesionales.
export default function AdminProfilePage() {
  const { user, person, roleInfo, reloadProfile } = useAuth();

  // Controla la edición y actualización del perfil.
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Almacena los mensajes de error y confirmación.
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isProfessional = user?.rol === 'PROFESIONAL';
  useAutoDismiss(message, setMessage, PROFESSIONAL_MESSAGE_TIMEOUT_MS, isProfessional);
  useAutoDismiss(error, setError, PROFESSIONAL_MESSAGE_TIMEOUT_MS, isProfessional);

  // Recarga los datos del perfil desde el servidor.
  const refresh = async () => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await reloadProfile();
    } catch {
      setError('No pudimos cargar tu perfil. Volvé a intentar.');
    } finally {
      setBusy(false);
    }
  };

  // Obtiene la información profesional asociada al usuario.
  const professional = roleInfo?.professional;

  // Muestra una lista de valores mediante etiquetas.
  const badges = (values: string[]) =>
    values.length ? (
      <div className="d-flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={`${index}-${value}`}
            className="badge bg-success-subtle text-success text-wrap text-break mw-100"
          >
            {value}
          </span>
        ))}
      </div>
    ) : (
      'Sin informar'
    );

  return (
    <div>
      {/* Encabezado con los datos principales del usuario. */}
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div className="text-break">
          <h1 className="h3">
            Mi perfil
          </h1>

          <p className="text-muted mb-0">
            Tus datos personales y tu cuenta de acceso.
          </p>

          {person && (
            <p className="mt-2 mb-0">
              <i
                className="bi bi-person-circle me-2"
                aria-hidden="true"
              />

              <strong>
                {person.nombres} {person.apellidos}
              </strong>

              <br />

              {roleLabels[user?.rol ?? '']}
            </p>
          )}
        </div>

        {/* Acciones para actualizar o editar el perfil. */}
        <div className="d-flex flex-wrap align-items-start gap-2">
          <button
            className="btn btn-outline-secondary"
            disabled={busy || editing}
            onClick={() => void refresh()}
          >
            {busy ? 'Actualizando…' : 'Actualizar'}
          </button>

          <button
            className="btn btn-saps"
            disabled={busy || editing || !person}
            onClick={() => {
              setEditing(true);
              setMessage('');
              setError('');
            }}
          >
            Editar perfil
          </button>
        </div>
      </div>

      {/* Muestra los mensajes de error o confirmación. */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {/* Informa cuando no existen datos personales vinculados. */}
      {!person && (
        <div className="alert alert-warning">
          No hay datos personales vinculados.
          Contactá a administración para revisar tu perfil.
        </div>
      )}

      {/* Muestra el formulario de edición del perfil. */}
      {editing && person && (
        <PersonalProfileForm
          person={person}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setMessage('Tu perfil se actualizó correctamente.');
          }}
        />
      )}

      {/* Muestra las tarjetas con información del perfil. */}
      <div className="row g-4" aria-busy={busy}>
        {/* Datos personales del usuario. */}
        {person && (
          <div className="col-12 col-lg-6">
            <ProfileInfoCard
              title="Datos personales"
              fields={{
                Nombres: person.nombres,
                Apellidos: person.apellidos,
                DNI: person.dni,
                'Fecha de nacimiento': person.fecha_nacimiento
                  ?.split('-')
                  .reverse()
                  .join('/'),
                Sexo: person.sexo?.replaceAll('_', ' '),
                Teléfono: person.telefono,
                'Correo personal': person.email,
                Dirección: person.direccion,
                Localidad: person.localidad,
                Provincia: person.provincia,
                'Código postal': person.codigo_postal,
              }}
            />
          </div>
        )}

        {/* Datos de la cuenta de acceso. */}
        <div className="col-12 col-lg-6">
          <ProfileInfoCard
            title="Datos de la cuenta"
            fields={{
              Usuario: user?.nombre_usuario,
              'Correo de acceso': user?.email,
              Rol: roleLabels[user?.rol ?? ''],
              Estado: user?.activo === undefined
                ? 'Sin informar'
                : user.activo
                  ? 'Activa'
                  : 'Inactiva',
              'Verificación de correo': user?.email_verificado
                ? 'Verificado'
                : 'Pendiente',
            }}
          />
        </div>

        {/* Información profesional o administrativa según el rol. */}
        <div className="col-12">
          <ProfileInfoCard
            title={
              user?.rol === 'PROFESIONAL'
                ? 'Información profesional'
                : 'Información administrativa'
            }
            fields={
              user?.rol === 'SUPER_ADMIN'
                ? {
                    Alcance: 'Administración general',
                  }
                : {
                    ...(user?.rol === 'PROFESIONAL'
                      ? {
                          Matrícula: professional?.license,
                          'Estado profesional': professional
                            ? professional.active
                              ? 'Activo'
                              : 'Inactivo'
                            : 'Sin informar',
                          Especialidades: badges(
                            professional?.specialties ?? []
                          ),
                        }
                      : {}),
                    'Salitas asignadas': badges(
                      (roleInfo?.clinics ?? []).map(
                        clinic =>
                          `${clinic.name}${
                            clinic.primary ? ' (principal)' : ''
                          }${
                            clinic.active ? '' : ' (inactiva)'
                          }`
                      )
                    ),
                  }
            }
          />
        </div>
      </div>

      {/* Opciones para administrar la seguridad de la cuenta. */}
      <AccountSecuritySection />
      <PrivacySection />
    </div>
  );
}
