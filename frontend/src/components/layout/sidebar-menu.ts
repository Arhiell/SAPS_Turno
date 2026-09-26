import type { UserRole } from "../../types/auth.types";

export interface SidebarMenuItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

export const sidebarMenu: SidebarMenuItem[] = [
  {
    label: "Inicio",
    path: "/",
    icon: "bi-house",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA", "PACIENTE"],
  },
  {
    label: "Turnos",
    path: "/turnos",
    icon: "bi-calendar-check",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA", "PACIENTE"],
  },
  {
    label: "Pacientes",
    path: "/pacientes",
    icon: "bi-people",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA"],
  },
  {
    label: "Profesionales",
    path: "/profesionales",
    icon: "bi-person-badge",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA"],
  },
  {
    label: "Salitas",
    path: "/salitas",
    icon: "bi-hospital",
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Reportes",
    path: "/reportes",
    icon: "bi-bar-chart",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA"],
  },
  {
    label: "Configuración",
    path: "/configuracion",
    icon: "bi-gear",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA"],
  },
];