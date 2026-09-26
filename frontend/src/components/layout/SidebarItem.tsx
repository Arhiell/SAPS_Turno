import { NavLink } from "react-router-dom";
import type { SidebarMenuItem } from "./sidebar-menu";

interface SidebarItemProps {
  item: SidebarMenuItem;
}

const SidebarItem = ({ item }: SidebarItemProps) => {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? "active" : ""}`
      }
    >
      <i className={`bi ${item.icon}`} />
      <span>{item.label}</span>
    </NavLink>
  );
};

export default SidebarItem;