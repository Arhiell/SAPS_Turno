import { useAuth } from "../../context/AuthContext";
import SidebarItem from "./SidebarItem";
import { getMenuForRole } from "./sidebar-menu";

const Sidebar = () => {
  const { user } = useAuth();

  const role = user?.rol;

  const menuItems = getMenuForRole(role);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>SAPS Turno</h2>
        <p>Sistema de gestión</p>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
          />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
