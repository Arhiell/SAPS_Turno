import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString(
    'es-AR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="dashboard-header d-flex justify-content-between align-items-end">
        <div>
          <h1>
            ¡Hola, {user?.nombre_usuario}!
          </h1>

          <p>
            Resumen de la actividad del sistema.
          </p>
        </div>

        <div className="text-end d-none d-md-block">
          <small className="text-muted text-capitalize">
            {today}
          </small>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                <i className="bi bi-calendar-check" />
              </div>

              <span className="dashboard-stat-label">
                Turnos de hoy
              </span>
            </div>

            <div className="dashboard-stat-value">
              0
            </div>

            <small>
              Turnos programados para hoy
            </small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                <i className="bi bi-people" />
              </div>

              <span className="dashboard-stat-label">
                Pacientes
              </span>
            </div>

            <div className="dashboard-stat-value">
              0
            </div>

            <small>
              Pacientes registrados
            </small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                <i className="bi bi-person-badge" />
              </div>

              <span className="dashboard-stat-label">
                Profesionales
              </span>
            </div>

            <div className="dashboard-stat-value">
              0
            </div>

            <small>
              Profesionales registrados
            </small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                <i className="bi bi-hospital" />
              </div>

              <span className="dashboard-stat-label">
                Salitas
              </span>
            </div>

            <div className="dashboard-stat-value">
              0
            </div>

            <small>
              Salitas activas
            </small>
          </div>
        </div>
      </div>

      {/* PRÓXIMOS TURNOS + ACCIONES */}
      <div className="row g-4 mb-4">
        {/* PRÓXIMOS TURNOS */}
        <div className="col-xl-8">
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>
                  Próximos turnos
                </h2>

                <p>
                  Turnos programados para hoy.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() =>
                  navigate('/turnos')
                }
              >
                Ver todos
                <i className="bi bi-arrow-right ms-2" />
              </button>
            </div>

            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <i className="bi bi-calendar-x" />
              </div>

              <h3>
                No hay turnos para mostrar
              </h3>

              <p>
                Cuando se registren turnos,
                aparecerán aquí.
              </p>

              <button
                type="button"
                className="btn btn-saps"
                onClick={() =>
                  navigate('/turnos')
                }
              >
                <i className="bi bi-calendar-plus me-2" />
                Gestionar turnos
              </button>
            </div>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className="col-xl-4">
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>
                  Acciones rápidas
                </h2>

                <p>
                  Accesos frecuentes.
                </p>
              </div>
            </div>

            <div className="dashboard-actions">
              <button
                type="button"
                className="dashboard-action"
                onClick={() =>
                  navigate('/pacientes/nuevo')
                }
              >
                <span className="dashboard-action-icon">
                  <i className="bi bi-person-plus" />
                </span>

                <span className="dashboard-action-content">
                  <strong>
                    Registrar paciente
                  </strong>

                  <small>
                    Agregar un nuevo paciente
                  </small>
                </span>

                <i className="bi bi-chevron-right" />
              </button>

              <button
                type="button"
                className="dashboard-action"
                onClick={() =>
                  navigate('/turnos')
                }
              >
                <span className="dashboard-action-icon">
                  <i className="bi bi-calendar-plus" />
                </span>

                <span className="dashboard-action-content">
                  <strong>
                    Nuevo turno
                  </strong>

                  <small>
                    Gestionar una nueva cita
                  </small>
                </span>

                <i className="bi bi-chevron-right" />
              </button>

              <button
                type="button"
                className="dashboard-action"
                onClick={() =>
                  navigate('/profesionales')
                }
              >
                <span className="dashboard-action-icon">
                  <i className="bi bi-person-badge" />
                </span>

                <span className="dashboard-action-content">
                  <strong>
                    Profesionales
                  </strong>

                  <small>
                    Consultar profesionales
                  </small>
                </span>

                <i className="bi bi-chevron-right" />
              </button>

              <button
                type="button"
                className="dashboard-action"
                onClick={() =>
                  navigate('/reportes')
                }
              >
                <span className="dashboard-action-icon">
                  <i className="bi bi-bar-chart" />
                </span>

                <span className="dashboard-action-content">
                  <strong>
                    Reportes
                  </strong>

                  <small>
                    Consultar información
                  </small>
                </span>

                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVIDAD DEL SISTEMA */}
      <div className="row g-4">
        <div className="col-12">
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>
                  Actividad del sistema
                </h2>

                <p>
                  Resumen general.
                </p>
              </div>
            </div>

            <div className="dashboard-summary-grid">
              <div className="dashboard-summary-item">
                <span>
                  Turnos atendidos
                </span>

                <strong>
                  0
                </strong>
              </div>

              <div className="dashboard-summary-item">
                <span>
                  En espera
                </span>

                <strong>
                  0
                </strong>
              </div>

              <div className="dashboard-summary-item">
                <span>
                  Cancelados
                </span>

                <strong>
                  0
                </strong>
              </div>

              <div className="dashboard-summary-item">
                <span>
                  Reprogramados
                </span>

                <strong>
                  0
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;