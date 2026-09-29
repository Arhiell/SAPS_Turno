import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  roleLabels,
} from './sidebar-menu';

import NotificationBell from './NotificationBell';

const Navbar = () => {
  // Obtiene el usuario autenticado y la función de cierre de sesión.
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  // Cierra la sesión y redirige al login.
  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // La sesión local ya fue eliminada por AuthContext.
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="navbar-saps">
      {/* Nombre principal del sistema. */}
      <div>
        <h1>SAPS Turno</h1>
      </div>

      <div className="navbar-user">
        {/* Las notificaciones se muestran solamente al paciente. */}
        {user?.rol === 'PACIENTE' && (
          <NotificationBell
            key={user.id_usuario}
          />
        )}

        {/* Información del usuario autenticado. */}
        <div className="text-end">
          <strong>
            {user?.nombre_usuario}
          </strong>

          <small>
            {roleLabels[user?.rol ?? ''] ??
              user?.rol}
          </small>
        </div>

        {/* Botón para cerrar la sesión. */}
        <button
          type="button"
          className="btn btn-outline-success"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2" />
          Salir
        </button>
      </div>
    </header>
  );
};

export default Navbar;