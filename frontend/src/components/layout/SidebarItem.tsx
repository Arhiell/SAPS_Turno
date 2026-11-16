import { Link, useLocation } from 'react-router-dom';

import {
  isMenuItemActive,
  type SidebarMenuItem,
} from './sidebar-menu';

// Propiedades del elemento individual del menú lateral.
interface SidebarItemProps {
  item: SidebarMenuItem;
  visibleItems: SidebarMenuItem[];
}

// Renderiza un enlace de navegación dentro del sidebar.
const SidebarItem = ({
  item,
  visibleItems,
}: SidebarItemProps) => {
  const { pathname } = useLocation();
  const active = isMenuItemActive(pathname, item.path, visibleItems);

  return (
    <Link
      to={item.path}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      className={`sidebar-item ${active ? 'active' : ''}`}
    >
      {/* Ícono asociado a la opción del menú. */}
      <i className={`bi ${item.icon}`} />

      <span>{item.label}</span>
    </Link>
  );
};

export default SidebarItem;
