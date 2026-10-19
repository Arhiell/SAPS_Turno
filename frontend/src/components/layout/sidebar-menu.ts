import type { UserRole } from '../../types/auth.types';

// Define la estructura de los elementos del menú.
export interface SidebarMenuItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

// Define las opciones de navegación según los roles permitidos.
export const sidebarMenu: SidebarMenuItem[] = [
  {
    label: 'Contenido público',
    path: '/contenido',
    icon: 'bi-newspaper',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Mis notificaciones',
    path: '/mis-notificaciones',
    icon: 'bi-bell',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA', 'PACIENTE', 'PROFESIONAL'],
  },
  {
    label: 'Administrar notificaciones',
    path: '/notificaciones',
    icon: 'bi-megaphone',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Cuentas de acceso',
    path: '/administracion',
    icon: 'bi-person-lock',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Mi agenda',
    path: '/mi-agenda',
    icon: 'bi-calendar-check',
    roles: ['PROFESIONAL'],
  },
  {
    label: 'Pacientes del día',
    path: '/mis-pacientes',
    icon: 'bi-people',
    roles: ['PROFESIONAL'],
  },
  {
    label: 'Mis turnos',
    path: '/mis-turnos',
    icon: 'bi-calendar-check',
    roles: ['PACIENTE'],
  },
  {
    label: 'Solicitar turno',
    path: '/solicitar-turno',
    icon: 'bi-calendar-plus',
    roles: ['PACIENTE'],
  },
  {
    label: 'Mi perfil',
    path: '/mi-perfil',
    icon: 'bi-person',
    roles: ['PACIENTE', 'PROFESIONAL', 'SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Inicio',
    path: '/panel',
    icon: 'bi-house',
    roles: [
      'SUPER_ADMIN',
      'ADMIN_SALITA',
      'PACIENTE',
      'PROFESIONAL',
    ],
  },
  {
    label: 'Turnos',
    path: '/turnos',
    icon: 'bi-calendar-check',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Pacientes',
    path: '/pacientes',
    icon: 'bi-people',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Profesionales',
    path: '/profesionales',
    icon: 'bi-person-badge',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Salitas',
    path: '/salitas',
    icon: 'bi-hospital',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Reportes',
    path: '/reportes',
    icon: 'bi-bar-chart',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
  {
    label: 'Configuración',
    path: '/configuracion',
    icon: 'bi-gear',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
  },
];

// Filtra las opciones del menú y prioriza la página de inicio.
export const getMenuForRole = (role?: string) =>
  sidebarMenu
    .filter((item) =>
      item.roles.some((allowed) => allowed === role)
    )
    .sort((a, b) =>
      a.path === '/panel'
        ? -1
        : b.path === '/panel'
          ? 1
          : 0
    );

// Define los nombres visibles de cada rol.
export const roleLabels: Record<string, string> = {
  RECEPCION: 'Recepción',
  SUPER_ADMIN: 'Administración general',
  ADMIN_SALITA: 'Administración de salita',
  PROFESIONAL: 'Profesional',
  PACIENTE: 'Paciente',
};

// Define las opciones disponibles en el módulo de configuración.
export const configurationMenu: (SidebarMenuItem & {
  description: string;
})[] = [
  {
    label: 'Zonas',
    path: '/configuracion/zonas',
    icon: 'bi-map',
    roles: ['SUPER_ADMIN'],
    description: 'Organizá las zonas a las que pertenecen los barrios.',
  },
  {
    label: 'Barrios',
    path: '/configuracion/barrios',
    icon: 'bi-geo-alt',
    roles: ['SUPER_ADMIN'],
    description: 'Cargá y actualizá los barrios que aparecen en los formularios.',
  },
  {
    label: 'Especialidades',
    path: '/configuracion/especialidades',
    icon: 'bi-heart-pulse',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
    description: 'Administrá las especialidades disponibles para asignar a profesionales.',
  },
  {
    label: 'Cobertura de salitas',
    path: '/configuracion/cobertura',
    icon: 'bi-hospital',
    roles: ['SUPER_ADMIN'],
    description: 'Vinculá cada salita con sus barrios de atención.',
  },
  {
    label: 'Horarios y disponibilidad',
    path: '/configuracion/horarios',
    icon: 'bi-calendar-week',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
    description: 'Configurá franjas, duración de turnos y consultá disponibilidad.',
  },
  {
    label: 'Parámetros',
    path: '/configuracion/parametros',
    icon: 'bi-sliders',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
    description: 'Administrá los valores configurables del sistema o de tu salita.',
  },
  {
    label: 'Bloqueos de agenda',
    path: '/configuracion/bloqueos',
    icon: 'bi-calendar-x',
    roles: ['SUPER_ADMIN', 'ADMIN_SALITA'],
    description: 'Configurá cierres o ausencias por día completo o por franja horaria.',
  },
];