import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import {
  configurationMenu,
  roleLabels,
} from '../../components/layout/sidebar-menu';

export default function ConfiguracionPage() {
  const { user } = useAuth();

  // Filtra las opciones de configuración según el rol.
  const items = configurationMenu.filter((item) =>
    item.roles.some(
      (role) => role === user?.rol
    )
  );

  return (
    <div>
      {/* Encabezado de configuración */}
      <div className="dashboard-header">
        <h1>Configuración</h1>

        <p>
          {roleLabels[user?.rol ?? '']} · Prepará los datos
          necesarios para la atención.
        </p>
      </div>

      {/* Orden recomendado para SUPER_ADMIN */}
      {user?.rol === 'SUPER_ADMIN' && (
        <div className="alert alert-success">
          <strong>Orden de carga:</strong>{' '}
          zonas → barrios → salitas y cobertura →
          especialidades → profesionales y asignaciones →
          horarios.
        </div>
      )}

      {/* Opciones disponibles según el rol */}
      <div className="row g-3 mb-4">
        {items.map((item) => (
          <div
            className="col-md-6 col-xl-4"
            key={item.path}
          >
            <Link
              className="dashboard-card configuration-link d-block text-decoration-none"
              to={item.path}
            >
              <span className="dashboard-card-icon">
                <i
                  className={`bi ${item.icon}`}
                  aria-hidden="true"
                />
              </span>

              <h2 className="h5 mt-3">
                {item.label}
              </h2>

              <p>
                {item.description}
              </p>

              <span className="d-inline-block text-success fw-semibold mt-3">
                Administrar{' '}

                <i
                  className="bi bi-arrow-right"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Accesos rápidos para continuar con la carga */}
      <div className="dashboard-panel p-3">
        <h2 className="h5">
          Continuar con la carga
        </h2>

        <div className="d-flex flex-wrap gap-2">
          {user?.rol === 'SUPER_ADMIN' && (
            <Link
              className="btn btn-outline-success"
              to="/salitas"
            >
              Salitas
            </Link>
          )}

          <Link
            className="btn btn-outline-success"
            to="/profesionales"
          >
            Profesionales y asignaciones
          </Link>

          <Link
            className="btn btn-outline-success"
            to="/administracion"
          >
            Cuentas de acceso
          </Link>

          <Link
            className="btn btn-saps"
            to="/turnos/nuevo"
          >
            Registrar turno
          </Link>
        </div>
      </div>
    </div>
  );
}