import { NavLink } from 'react-router-dom';

import { sidebarMenu } from './sidebar-menu';

const patientLinks = sidebarMenu.filter(
  (item) => item.roles.includes('PACIENTE') && item.path !== '/',
);

export default function PatientBottomNavigation() {
  return (
    <nav className="patient-bottom-nav" aria-label="Navegación del paciente">
      {patientLinks.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `patient-bottom-nav__link${isActive ? ' is-active' : ''}`
          }
        >
          <i className={`bi ${item.icon}`} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}