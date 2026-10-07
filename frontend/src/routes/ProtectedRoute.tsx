import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import type {
  UserRole,
} from '../types/auth.types';

import {
  useAuth,
} from '../context/AuthContext';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

const ProtectedRoute = ({
  roles,
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    patient,
  } = useAuth();

  const location =
    useLocation();

  // Muestra un indicador mientras se verifica la sesión.
  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div
            className="spinner-border"
            role="status"
          >
            <span className="visually-hidden">
              Cargando...
            </span>
          </div>

          <p className="mt-3 mb-0">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Redirige al inicio de sesión si el usuario no está autenticado.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Obliga al paciente a completar su perfil antes de acceder al sistema.
  // Se permite acceder al perfil y a las notificaciones durante este proceso.
  if (
    user?.rol ===
      'PACIENTE' &&
    !patient &&
    ![
      '/completar-perfil',
      '/mis-notificaciones',
    ].includes(
      location.pathname
    )
  ) {
    return (
      <Navigate
        to="/completar-perfil"
        replace
      />
    );
  }

  // Verifica que el rol tenga permiso para acceder a la ruta.
  if (
    roles &&
    !roles.some(
      (role) =>
        role === user?.rol
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Renderiza la ruta protegida cuando se cumplen las validaciones.
  return <Outlet />;
};

export default ProtectedRoute;