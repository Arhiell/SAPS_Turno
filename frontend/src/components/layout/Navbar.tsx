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

import '../../styles/navbar.css';

const Navbar = () => {
  // Obtiene el usuario autenticado y la función
  // de cierre de sesión.
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
      // La sesión local ya fue eliminada
      // por AuthContext.
    } finally {
      navigate('/login');
    }
  };

  const roleLabel =
    roleLabels[user?.rol ?? ''] ??
    user?.rol ??
    '';

  return (
    <header className="navbar-saps navbar-saps-modern">
      {/* Identidad del sistema */}
      <div className="navbar-brand-saps">
        <div
          className="navbar-brand-icon"
          aria-hidden="true"
        >
          <i className="bi bi-calendar2-check" />
        </div>

        <div className="navbar-brand-content">
          <div className="navbar-brand-title">
            <span className="navbar-brand-title-primary">
              SAPS
            </span>

            <span className="navbar-brand-title-secondary">
              Turno
            </span>
          </div>

          <span className="navbar-brand-divider" />

          <span className="navbar-brand-subtitle">
            Sistema de gestión
          </span>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="navbar-user navbar-user-modern">
        {/* Las notificaciones se muestran solamente al paciente. */}
        {user?.rol === 'PACIENTE' && (
          <div className="navbar-notification">
            <NotificationBell
              key={user.id_usuario}
            />
          </div>
        )}

        <div className="navbar-profile">
          <div
            className="navbar-profile-icon"
            aria-hidden="true"
          >
            <i className="bi bi-person" />
          </div>

          <div className="navbar-profile-info">
            <strong>
              {user?.nombre_usuario}
            </strong>

            <small>
              {roleLabel}
            </small>
          </div>
        </div>

        <span
          className="navbar-user-divider"
          aria-hidden="true"
        />

        {/* Botón para cerrar la sesión. */}
        <button
          type="button"
          className="navbar-logout"
          onClick={handleLogout}
        >
          <i
            className="bi bi-box-arrow-right"
            aria-hidden="true"
          />

          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;