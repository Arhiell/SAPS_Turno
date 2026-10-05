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

import {
  getTurnos,
} from '../../services/turnos.service';

import {
  getPatients,
} from '../../services/patients.service';

import {
  getProfessionals,
} from '../../services/profesionales.service';

import {
  getSalitas,
} from '../../services/salitas.service';

import type {
  Turno,
} from '../../types/turno.types';

import {
  authError,
} from '../../utils/auth-errors';

export default function Dashboard() {
  // Obtiene el usuario autenticado y,
  // cuando corresponde, su perfil de paciente.
  const {
    user,
    patient: profile,
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

  // ========================================
  // ESTADO DEL DASHBOARD
  // ========================================

  const [
    turnos,
    setTurnos,
  ] = useState<Turno[]>([]);

  const [
    totals,
    setTotals,
  ] = useState<{
    label: string;
    value: number | null;
    icon: string;
  }[]>([]);

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

    setLoading(true);
    setError('');
    setTurnos([]);
    setTotals([]);

    // Recorre la paginación para no confundir
    // una página con el total del día.
    const load = async () => {
      const result: Turno[] = [];

      let page = 1;
      let pages = 1;

      do {
        const response = await getTurnos({
          ...(patient
            ? {}
            : {
                fecha,
              }),
          page,
          limit: 100,
        });

        if (!active) {
          return;
        }

        result.push(
          ...response.data.turnos
        );

        pages =
          response.data.pagination.totalPages;

        page += 1;
      } while (page <= pages);

      if (active) {
        setTurnos(
          result
        );
      }
    };

    // Carga los turnos visibles para el usuario.
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

    // Los totales globales no se muestran
    // en la gestión de una salita.
    if (global) {
      void Promise.allSettled([
        getPatients(1, 1),
        getProfessionals(),
        getSalitas(),
      ]).then(
        ([
          p,
          pr,
          s,
        ]) => {
          if (active) {
            setTotals([
              {
                label:
                  'Pacientes registrados',
                value:
                  p.status === 'fulfilled'
                    ? p.value.data.pagination.total
                    : null,
                icon: 'bi-people',
              },
              {
                label:
                  'Profesionales activos',
                value:
                  pr.status === 'fulfilled'
                    ? pr.value.data.filter(
                        (item) =>
                          item.activo
                      ).length
                    : null,
                icon: 'bi-person-badge',
              },
              {
                label:
                  'Salitas activas',
                value:
                  s.status === 'fulfilled'
                    ? s.value.data.filter(
                        (item) =>
                          item.activo
                      ).length
                    : null,
                icon: 'bi-hospital',
              },
            ]);
          }
        }
      );
    }

    // Evita actualizar el estado después
    // de desmontar el componente.
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

  // Para el profesional, la primera tarjeta
  // muestra pacientes únicos del día.
  if (professional) {
    stats[0] = {
      label: 'Pacientes del día',
      value: new Set(
        turnos.map(
          (t) => t.id_paciente
        )
      ).size,
      icon: 'bi-people',
    };
  }

  // ========================================
  // INTERFAZ
  // ========================================

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
          ¡Hola, {user?.nombre_usuario}!
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

      {!patient && (
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

          {/* Totales generales del sistema. */}
          {totals.map(
            (stat) => (
              <div
                className="col-12 col-sm-6 col-xl-4"
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
                    {stat.value ?? '—'}
                  </div>

                  <small>
                    {stat.value === null
                      ? 'No disponible'
                      : 'Total del sistema'}
                  </small>
                </div>
              </div>
            )
          )}
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
                      ? '/mi-agenda'
                      : '/turnos'
                }
              >
                Ver{' '}
                {professional
                  ? 'mi agenda'
                  : 'turnos'}
              </Link>
            </div>

            {/* Lista de próximos turnos. */}
            {!loading &&
              !error &&
              (
                upcoming.length
                  ? (
                      <div className="p-3 d-grid gap-3">
                        {upcoming
                          .slice(
                            0,
                            patient
                              ? 1
                              : 4
                          )
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
                            : 'No hay próximos turnos para hoy'}
                        </h3>

                        <p>
                          Podés consultar el listado
                          completo desde tus turnos.
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
    </div>
  );
}