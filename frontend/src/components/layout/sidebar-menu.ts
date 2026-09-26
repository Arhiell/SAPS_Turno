import type { UserRole } from "../../types/auth.types";

export interface SidebarMenuItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

export const sidebarMenu: SidebarMenuItem[] = [
  { label: "Cuentas de acceso", path: "/administracion", icon: "bi-person-lock", roles: ["SUPER_ADMIN", "ADMIN_SALITA"] },
  { label: "Mi agenda", path: "/mi-agenda", icon: "bi-calendar-check", roles: ["PROFESIONAL"] },
  { label: "Pacientes del día", path: "/mis-pacientes", icon: "bi-people", roles: ["PROFESIONAL"] },
  { label: "Mis turnos", path: "/mis-turnos", icon: "bi-calendar-check", roles: ["PACIENTE"] },
  { label: "Mi perfil", path: "/mi-perfil", icon: "bi-person", roles: ["PACIENTE"] },
  {
    label: "Inicio",
    path: "/",
    icon: "bi-house",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA", "PACIENTE", "PROFESIONAL"],
  },
  {
    label: "Turnos",
    path: "/turnos",
    icon: "bi-calendar-check",
    roles: ["SUPER_ADMIN", "ADMIN_SALITA"],
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
