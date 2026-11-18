import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import TurnoCard from '../../components/ui/TurnoCard';
import PatientTurnoDetailModal from '../../components/turnos/PatientTurnoDetailModal';
import '../../styles/professional-agenda.css';

import {
  getTurnos,
} from '../../services/turnos.service';

import SuperAdminOverview from './SuperAdminOverview';
import AdminSalitaOverview from './AdminSalitaOverview';
import RecepcionOverview from './RecepcionOverview';
import PatientOverview from './PatientOverview';
import ProfessionalOverview from './ProfessionalOverview';

import type {
  Turno,
} from '../../types/turno.types';

import {
  authError,
} from '../../utils/auth-errors';
import {
  PROFESSIONAL_MESSAGE_TIMEOUT_MS,
  useAutoDismiss,
} from '../../utils/useAutoDismiss';

export default function Dashboard() {
  // Obtiene el usuario autenticado y,
  // cuando corresponde, su perfil de paciente.
  const {
    user,
    patient: profile,
    person,
  } = useAuth();

  // ========================================
  // TIPO DE USUARIO
  // ========================================

  const patient =
    user?.rol === 'PACIENTE';

  const professional =
    user?.rol === 'PROFESIONAL';

  const global =
    user?.rol === 'SUPER_ADMIN';

  const adminSalita =
    user?.rol === 'ADMIN_SALITA';

  const recepcion =
    user?.rol === 'RECEPCION';

  // ========================================
  // ESTADO DEL DASHBOARD
  // ========================================

  const [
    turnos,
    setTurnos,
  ] = useState<Turno[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  // Permite volver a cargar la información.
  const [
    revision,
    setRevision,
  ] = useState(0);

  const [
    selectedTurno,
    setSelectedTurno,
  ] = useState<Turno | null>(null);

  useAutoDismiss(error, setError, PROFESSIONAL_MESSAGE_TIMEOUT_MS, professional);

  // Fecha actual en la zona horaria utilizada
  // por la agenda del sistema.
  const fecha = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone:
        'America/Argentina/Buenos_Aires',
    }
  ).format(
    new Date()
  );

  // ========================================
  // CARGA DEL DASHBOARD
  // ========================================

  useEffect(() => {
    let active = true;

    // Los roles ADMIN_SALITA, RECEPCION, SUPER_ADMIN, PACIENTE y PROFESIONAL tienen vistas dedicadas que gestionan
    // sus propias consultas con alcance correspondiente, evitando peticiones duplicadas e innecesarias.
    if (adminSalita || recepcion || global || patient || professional) {
      setLoading(false);
      return;
    }

    if (turnos.length === 0) {
      setLoading(true);
    }
    setError('');

    const load = async () => {
      const response = await getTurnos({
        ...(patient ? {} : { fecha }),
        page: 1,
        limit: 100,
      });

      if (!active) {
        return;
      }

      setTurnos(response.data.turnos);
    };

    void load()
      .catch((cause) => {
        if (active) {
          setError(
            authError(cause)
          );
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
  }, [
    user?.id_usuario,
    patient,
    global,
    fecha,
    revision,
  ]);

  // ========================================
  // PRÓXIMOS TURNOS
  // ========================================

  // Conserva turnos no finalizados cuya fecha
  // todavía no haya pasado.
  const upcoming = turnos
    .filter(
      (t) =>
        !t.estado.es_estado_final &&
        new Date(
          t.fecha_hora_inicio
        ).getTime() >= Date.now()
    )
    .sort(
      (a, b) =>
        Date.parse(
          a.fecha_hora_inicio
        ) -
        Date.parse(
          b.fecha_hora_inicio
        )
    );

  // ========================================
  // ESTADÍSTICAS DEL DÍA
  // ========================================

  const stats = [
    {
      label: 'Turnos de hoy',
      value: turnos.length,
      icon: 'bi-calendar-check',
    },
    {
      label: 'Atendidos hoy',
      value: turnos.filter(
        (t) =>
          t.estado.codigo === 'ATENDIDO'
      ).length,
      icon: 'bi-check2-circle',
    },
    {
      label: 'Inasistencias hoy',
      value: turnos.filter(
        (t) =>
          t.estado.codigo === 'NO_ASISTIO'
      ).length,
      icon: 'bi-person-x',
    },
    {
      label: 'En espera',
      value: turnos.filter(
        (t) =>
          t.estado.codigo === 'EN_ESPERA'
      ).length,
      icon: 'bi-clock',
    },
  ];

  // Para el profesional, adaptamos las 4 estadísticas clave
  if (professional) {
    stats[0] = {
      label: 'Turnos pendientes',
      value: turnos.filter((t) => !t.estado.es_estado_final).length,
      icon: 'bi-hourglass-split',
    };
    stats[1] = {
      label: 'Turnos atendidos',
      value: turnos.filter((t) => t.estado.codigo === 'ATENDIDO').length,
      icon: 'bi-check2-circle',
    };
    stats[2] = {
      label: 'Pacientes ausentes',
      value: turnos.filter((t) => t.estado.codigo === 'NO_ASISTIO').length,
      icon: 'bi-person-x',
    };
    stats[3] = {
      label: 'Próximos turnos',
      value: upcoming.length,
      icon: 'bi-clock',
    };
  }

  // ========================================
  // ACCESOS RÁPIDOS PROFESIONAL
  // ========================================

  const professionalQuickActions = professional
    ? [
        {
          to: '/mis-pacientes',
          label: 'Pacientes del día',
          description: 'Gestión y atención directa de los turnos de hoy.',
          icon: 'bi-people-fill',
          accent: 'primary',
          badge: `${turnos.length} turnos hoy`,
        },
        {
          to: '/mi-agenda',
          label: 'Mi agenda completa',
          description: 'Historial de turnos y calendario mensual.',
          icon: 'bi-calendar-week-fill',
          accent: 'secondary',
        },
        {
          to: '/mis-horarios',
          label: 'Mis horarios',
          description: 'Cronograma semanal y franjas de disponibilidad.',
          icon: 'bi-clock-history',
          accent: 'neutral',
        },
      ]
    : [];

  // ========================================
  // ACCESOS RÁPIDOS PACIENTE
  // ========================================

  const patientQuickActions = patient
    ? [
        {
          to: '/solicitar-turno',
          label: 'Solicitar turno',
          description: 'Reservá una consulta con tu especialista.',
          icon: 'bi-calendar-plus',
          accent: 'primary',
        },
        {
          to: '/mis-turnos',
          label: 'Mis turnos',
          description: 'Revisá tus próximos turnos e historial.',
          icon: 'bi-calendar2-week',
          accent: 'secondary',
        },
        {
          to: '/mi-perfil',
          label: 'Mi perfil',
          description: 'Actualizá tus datos y cobertura.',
          icon: 'bi-person-vcard',
          accent: 'neutral',
        },
        {
          to: '/personas-a-cargo',
          label: 'Personas a cargo',
          description: 'Gestioná links y reservas de otros pacientes.',
          icon: 'bi-people',
          accent: 'secondary',
        },
      ]
    : [];

  // ========================================
  // INTERFAZ
  // ========================================

  if (professional) {
    return <ProfessionalOverview revision={revision} onRefresh={() => setRevision((v) => v + 1)} />;
  }

  if (adminSalita) {
    return <AdminSalitaOverview revision={revision} onRefresh={() => setRevision((v) => v + 1)} />;
  }

  if (recepcion) {
    return <RecepcionOverview revision={revision} onRefresh={() => setRevision((v) => v + 1)} />;
  }

  if (patient) {
    return <PatientOverview revision={revision} onRefresh={() => setRevision((v) => v + 1)} />;
  }

  return (
    <div>
      {/* Encabezado personalizado según el rol. */}
      <div
        className={`dashboard-header${
          patient
            ? ' patient-welcome'
            : ''
        }`}
      >
        <p className="text-capitalize mb-2">
          {new Date().toLocaleDateString(
            'es-AR',
            {
              timeZone:
                'America/Argentina/Buenos_Aires',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }
          )}
        </p>

        <h1>
          ¡Hola, {professional && person
            ? `${person.nombres} ${person.apellidos}`
            : user?.nombre_usuario}!
        </h1>

        {/* Nombre completo del paciente. */}
        {patient && profile && (
          <p className="patient-welcome-name">
            {profile.nombres}{' '}
            {profile.apellidos}
          </p>
        )}

        {/* Descripción adaptada al rol. */}
        <p>
          {patient
            ? 'Tus turnos y tu próxima visita, en un solo lugar.'
            : professional
              ? 'Tu agenda y la atención de hoy.'
              : global
                ? 'Resumen de la actividad del sistema.'
                : 'Resumen de la actividad de tu salita.'}
        </p>
      </div>

      {/* Error de carga. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}{' '}

          <button
            className="btn btn-outline-danger"
            onClick={() =>
              setRevision(
                (v) => v + 1
              )
          }
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado de carga. */}
      {loading && (
        <p role="status">
          Cargando actividad…
        </p>
      )}

      {/* =====================================
          ESTADÍSTICAS
          ===================================== */}

      {global && <SuperAdminOverview revision={revision} onRefresh={() => setRevision(v => v + 1)} />}

      {!patient && !global && (
        <div className="row g-3 mb-4">
          {/* Estadísticas de actividad diaria. */}
          {stats.map(
            (stat) => (
              <div
                className="col-12 col-sm-6 col-xl-3"
                key={stat.label}
              >
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-top">
                    <i
                      className={`dashboard-stat-icon bi ${stat.icon}`}
                      aria-hidden="true"
                    />

                    <span className="dashboard-stat-label">
                      {stat.label}
                    </span>
                  </div>

                  <div className="dashboard-stat-value">
                    {loading || error
                      ? '—'
                      : stat.value}
                  </div>

                  <small>
                    {loading
                      ? 'Cargando'
                      : error
                        ? 'No disponible'
                        : 'Actividad del día'}
                  </small>
                </div>
              </div>
            )
          )}

        </div>
      )}

      {patient && (
        <div className="patient-quick-grid mb-4">
          {patientQuickActions.map((action) => (
            <Link
              key={action.to}
              className={`patient-quick-card patient-quick-card-${action.accent}`}
              to={action.to}
            >
              <div className="patient-quick-icon">
                <i className={`bi ${action.icon}`} aria-hidden="true" />
              </div>

              <div>
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {professional && (
        <div className="patient-quick-grid mb-4">
          {professionalQuickActions.map((action) => (
            <Link
              key={action.to}
              className={`patient-quick-card patient-quick-card-${action.accent}`}
              to={action.to}
            >
              <div className="patient-quick-icon">
                <i className={`bi ${action.icon}`} aria-hidden="true" />
              </div>

              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <strong>{action.label}</strong>
                  {action.badge && (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0" style={{ fontSize: '0.72rem' }}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <span>{action.description}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* =====================================
          CONTENIDO PRINCIPAL
          ===================================== */}

      <div className="row g-4">
        {/* Próximos turnos. */}
        <div className="col-12">
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>
                {patient
                  ? 'Próximo turno'
                  : 'Próximos turnos de hoy'}
              </h2>

              <Link
                className="btn btn-outline-success"
                to={
                  patient
                    ? '/mis-turnos'
                    : professional
                      ? '/mis-pacientes'
                      : '/turnos'
                }
              >
                Ver{' '}
                {professional
                  ? 'pacientes del día'
                  : patient
                    ? 'mis turnos'
                    : 'turnos'}
              </Link>
            </div>

            {/* Tarjeta destacada del próximo turno inmediato para el profesional */}
            {professional && !loading && !error && upcoming.length > 0 && (
              <div className="p-3 pb-0">
                <div className="prof-next-hero">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <span className="prof-next-badge-pulse">
                      <span className="dot" /> Próximo paciente a atender
                    </span>
                    <span className="badge bg-white text-dark border px-2 py-1 font-monospace">
                      <i className="bi bi-clock me-1 text-success" />
                      {new Date(upcoming[0].fecha_hora_inicio).toLocaleTimeString('es-AR', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      hs
                    </span>
                  </div>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <h3 className="h5 mb-1 fw-bold text-dark">
                        {upcoming[0].paciente?.persona?.apellidos}{' '}
                        {upcoming[0].paciente?.persona?.nombres}
                      </h3>
                      <div className="text-secondary small">
                        <span className="me-3">
                          <strong>DNI:</strong> {upcoming[0].paciente?.persona?.dni || 'Sin DNI'}
                        </span>
                        <span className="me-3">
                          <strong>Especialidad:</strong> {upcoming[0].especialidad?.nombre || 'General'}
                        </span>
                        <span>
                          <strong>Salita:</strong> {upcoming[0].salita?.nombre}
                        </span>
                      </div>
                      {upcoming[0].motivo_consulta && (
                        <div className="mt-1 small text-dark">
                          <strong>Motivo:</strong> {upcoming[0].motivo_consulta}
                        </div>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm px-3 shadow-sm"
                        onClick={() => setSelectedTurno(upcoming[0])}
                      >
                        <i className="bi bi-person-lines-fill me-1" />
                        Ver ficha del paciente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de próximos turnos. */}
            {!loading &&
              !error &&
              (
                upcoming.length
                  ? (
                      <div className="p-3 d-grid gap-3">
                        {(professional ? upcoming.slice(1, 4) : upcoming.slice(0, patient ? 1 : 4))
                          .map(
                            (t) => (
                              <TurnoCard
                                key={t.id_turno}
                                turno={t}
                                patient={patient}
                                onChanged={() =>
                                  setRevision(
                                    (v) => v + 1
                                  )
                                }
                                onViewDetail={professional ? (turno) => setSelectedTurno(turno) : undefined}
                              />
                            )
                          )}
                      </div>
                    )
                  : (
                      <div className="dashboard-empty">
                        <i
                          className="bi bi-calendar2-check dashboard-empty-icon"
                          aria-hidden="true"
                        />

                        <h3>
                          {patient
                            ? 'No tenés próximos turnos'
                            : professional
                              ? `No hay próximos turnos para hoy (${fecha.split('-').reverse().join('/')})`
                            : 'No hay próximos turnos para hoy'}
                        </h3>

                        <p>
                          {professional
                            ? 'Podés consultar otro día desde Mi agenda.'
                            : 'Podés consultar el listado completo desde tus turnos.'}
                        </p>
                      </div>
                    )
              )}

            {/* Acción principal del paciente. */}
            {patient && (
              <div className="p-3">
                <Link
                  className="btn btn-saps"
                  to="/solicitar-turno"
                >
                  <i
                    className="bi bi-calendar-plus me-2"
                    aria-hidden="true"
                  />

                  Solicitar turno
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      <PatientTurnoDetailModal
        turno={selectedTurno}
        onClose={() => setSelectedTurno(null)}
        onStatusChanged={() => setRevision((v) => v + 1)}
      />
    </div>
  );
}