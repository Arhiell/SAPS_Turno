import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { roleLabels } from './sidebar-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch { /* La sesión local ya fue eliminada por AuthContext. */ }
    finally { navigate("/login"); }
  };

  return (
    <header className="navbar-saps">
      <div>
        <h1>SAPS Turno</h1>
      </div>

      <div className="navbar-user">
        <div className="text-end">
          <strong>{user?.nombre_usuario}</strong>
          <small>{roleLabels[user?.rol ?? ''] ?? user?.rol}</small>
        </div>

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
