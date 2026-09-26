import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../types/auth.types';

import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ roles }: { roles?: UserRole[] }) => {
  const { isAuthenticated, isLoading, user, patient } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.rol === 'PACIENTE' && !patient && location.pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />;
  }
  if (roles && !roles.some(role => role === user?.rol)) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
