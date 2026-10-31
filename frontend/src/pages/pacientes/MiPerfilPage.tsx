import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import usePatientCoverage from '../../context/usePatientCoverage';

import PatientCoverageCard from '../../components/ui/PatientCoverageCard';
import PatientProfileForm from '../../components/ui/PatientProfileForm';
import AccountSecuritySection from '../../components/ui/AccountSecuritySection';



// PERFIL DEL PACIENTE

function PatientProfile() {
  // Obtiene los datos del paciente y usuario
  // desde el contexto de autenticación.
  const {
    patient,
    reloadProfile,
    user,
  } = useAuth();

  // Obtiene la información de cobertura.
  const coverage = usePatientCoverage();

  // Controla la edición del perfil.
  const [
    editing,
    setEditing,
  ] = useState(false);

  // Estado de actualización.
  const [
    busy,
    setBusy,
  ] = useState(false);

  // Mensajes de respuesta.
  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  // ACTUALIZAR PERFIL

  const refresh = async () => {
    setBusy(true);
    setError('');

    try {
      // Recarga los datos del perfil.
      await reloadProfile();

      // Actualiza también la cobertura.
      coverage.retry();
    } catch {
      setError(
        'No se pudo cargar tu perfil. Volvé a intentar.'
      );
    } finally {
      setBusy(false);
    }
  };

  // PERFIL INCOMPLETO

  // Si el usuario todavía no tiene datos
  // de paciente, permite completar el perfil.
  if (!patient) {
    return (
      <div className="patient-section">
        <h1 className="h3">
          Mi perfil
        </h1>

        <p>
          Todavía no completaste tus datos.
        </p>

        <Link
          className="btn btn-saps"
          to="/completar-perfil"
        >
          Completar perfil
        </Link>
      </div>
    );
  }

  // SECCIONES DEL PERFIL

  const sections = [
    {
      title: 'Información personal',
      fields: {
        Nombres: patient.nombres,
        Apellidos: patient.apellidos,
        DNI: patient.dni,
        'Fecha de nacimiento': patient.fecha_nacimiento?.split('-').reverse().join('/'),
        Sexo: patient.sexo?.replaceAll('_', ' '),
      },
    },
    {
      title: 'Datos de contacto',
      fields: {
        Teléfono: patient.telefono,
        'Correo electrónico': user?.email,
        Dirección: patient.direccion,
      },
    },
    {
      title: 'Cobertura y salud',
      fields: {
        'Obra social': patient.obra_social,
        'Número de afiliado': patient.numero_afiliado,
        'Contacto de emergencia': patient.contacto_emergencia_nombre,
        'Teléfono de emergencia': patient.contacto_emergencia_telefono,
      },
    },
  ];

  const missingProfileFields = [
    !patient.nombres && 'nombres',
    !patient.apellidos && 'apellidos',
    !patient.dni && 'DNI',
    !patient.telefono && 'teléfono',
    !patient.direccion && 'dirección',
    !patient.id_barrio && 'barrio',
    !patient.id_salita_asignada && 'salita asignada',
  ].filter(Boolean) as string[];

  // INTERFAZ DEL PACIENTE

  return (
    <div>
      {/* Encabezado y acciones principales. */}
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3">
            Mi perfil
          </h1>

          <p className="text-muted mb-0">
            Tus datos y tu lugar de atención.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {/* Recarga los datos del perfil. */}
          <button
            className="btn btn-outline-secondary"
            disabled={
              busy ||
              editing
            }
            onClick={() =>
              void refresh()
            }
          >
            {busy
              ? 'Actualizando…'
              : 'Actualizar'}
          </button>

          {/* Activa la edición del perfil. */}
          <button
            className="btn btn-saps"
            disabled={
              busy ||
              editing
            }
            onClick={() => {
              setEditing(true);
              setMessage('');
            }}
          >
            Editar perfil
          </button>
        </div>
      </div>

      {/* Mensaje de error. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Mensaje de éxito. */}
      {message && (
        <div
          className="alert alert-success"
          role="status"
        >
          {message}
        </div>
      )}

      {missingProfileFields.length > 0 && !editing && (
        <div className="alert alert-warning" role="status">
          Tu perfil está incompleto. Faltan datos importantes: {missingProfileFields.join(', ')}. Completá esta información para mejorar tu atención.
        </div>
      )}

      {/* Formulario de edición del perfil. */}
      {editing && (
        <PatientProfileForm
          patient={patient}
          coverage={coverage}
          onClose={() =>
            setEditing(false)
          }
          onSaved={() => {
            setEditing(false);

            setMessage(
              'Tu perfil fue actualizado.'
            );

            coverage.retry();
          }}
        />
      )}

      {/* INFORMACIÓN PERSONAL Y COBERTURA */}

      <div className="row g-4">
        {/* Datos personales. */}
        <div className="col-12 col-lg-6">
          <section className="patient-section h-100">
            <h2 className="h5 mb-3">
              {sections[0].title}
            </h2>

            <dl className="row mb-0">
              {Object.entries(
                sections[0].fields
              ).map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    className="col-12 col-sm-6"
                    key={label}
                  >
                    <dt>
                      {label}
                    </dt>

                    <dd>
                      {value ||
                        'Sin informar'}
                    </dd>
                  </div>
                )
              )}
            </dl>
          </section>
        </div>

        {/* Cobertura y salita asignada. */}
        <div className="col-12 col-lg-6">
          <PatientCoverageCard
            patient={patient}
            coverage={coverage}
          />
        </div>

        {/* Obra social y contacto de emergencia. */}
        {sections
          .slice(1)
          .map(
            (section) => (
              <div
                className="col-12 col-lg-6"
                key={section.title}
              >
                <section className="patient-section h-100">
                  <h2 className="h5 mb-3">
                    {section.title}
                  </h2>

                  <dl className="mb-0">
                    {Object.entries(
                      section.fields
                    ).map(
                      ([
                        label,
                        value,
                      ]) => (
                        <div key={label}>
                          <dt>
                            {label}
                          </dt>

                          <dd>
                            {value ||
                              'Sin informar'}
                          </dd>
                        </div>
                      )
                    )}
                  </dl>
                </section>
              </div>
            )
          )}
      </div>

      <AccountSecuritySection />
    </div>
  );
}

// PÁGINA MI PERFIL

export default function MiPerfilPage() {
  const {
    user,
  } = useAuth();

  // Los pacientes utilizan el perfil completo.
  if (
    user?.rol === 'PACIENTE'
  ) {
    return (
      <PatientProfile />
    );
  }

  // Para otros roles se muestra
  // información básica de la cuenta.
  return (
    <section className="card shadow-sm">
      <div className="card-body">
        <h1 className="h3">
          Mi perfil
        </h1>

        <dl>
          <dt>
            Usuario
          </dt>

          <dd>
            {user?.nombre_usuario}
          </dd>

          <dt>
            Correo
          </dt>

          <dd>
            {user?.email}
          </dd>
        </dl>

        <p className="text-muted">
          Para actualizar tus datos,
          contactá a tu salita.
        </p>
      </div>
    </section>
  );
}