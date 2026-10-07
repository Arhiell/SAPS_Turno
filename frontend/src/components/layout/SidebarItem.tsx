import { NavLink } from 'react-router-dom';

import type {
  SidebarMenuItem,
} from './sidebar-menu';

// Propiedades del elemento individual del menú lateral.
interface SidebarItemProps {
  item: SidebarMenuItem;
}

// Renderiza un enlace de navegación dentro del sidebar.
const SidebarItem = ({
  item,
}: SidebarItemProps) => {
  return (
    <NavLink
      to={item.path}
      end={
        item.path ===
        '/panel'
      }
      title={item.label}
      className={({
        isActive,
      }) =>
        `sidebar-item ${
          isActive
            ? 'active'
            : ''
        }`
      }
    >
      {/* Ícono asociado a la opción del menú. */}
      <i
        className={`bi ${item.icon}`}
      />

      <span>
        {item.label}
      </span>
    </NavLink>
  );
};

export default SidebarItem;