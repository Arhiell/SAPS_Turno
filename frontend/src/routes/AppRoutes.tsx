import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// Autenticación
import Login from '../pages/auth/Login';
import AccountManagementPage from '../pages/auth/AccountManagementPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PasswordRecoveryPage from '../pages/auth/PasswordRecoveryPage';
import VerifyEmailCodePage from '../pages/auth/VerifyEmailCodePage';
import CompletePatientProfilePage from '../pages/auth/CompletePatientProfilePage';

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard';
import ConfiguracionPage from '../pages/dashboard/ConfiguracionPage';

// Pacientes
import PacientesPage from '../pages/pacientes/PacientesPage';
import PacienteDetallePage from '../pages/pacientes/PacienteDetallePage';
import NuevoPacientePage from '../pages/pacientes/NuevoPacientePage';
import MiPerfilPage from '../pages/pacientes/MiPerfilPage';

// Salitas
import SalitasPage from '../pages/salitas/SalitasPage';
import NuevaSalitaPage from '../pages/salitas/NuevaSalitaPage';
import EditarSalitaPage from '../pages/salitas/EditarSalitaPage';
import SalitaDetallePage from '../pages/salitas/SalitaDetallePage';

// Profesionales
import ProfesionalesPage from '../pages/profesionales/ProfesionalesPage';
import NuevoProfesionalPage from '../pages/profesionales/NuevoProfesionalPage';
import EditarProfesionalPage from '../pages/profesionales/EditarProfesionalPage';
import ProfesionalDetallePage from '../pages/profesionales/ProfesionalDetallePage';

// Turnos
import TurnosPage from '../pages/turnos/TurnosPage';
import NuevoTurnoPage from '../pages/turnos/NuevoTurnoPage';
import TurnoDetallePage from '../pages/turnos/TurnoDetallePage';
import ReprogramarTurnoPage from '../pages/turnos/ReprogramarTurnoPage';
import SolicitarTurnoPage from '../pages/turnos/SolicitarTurnoPage';
import MisTurnosPage from '../pages/turnos/MisTurnosPage';
import PatientAppointmentsPage from '../pages/turnos/PatientAppointmentsPage';
import PatientAppointmentDetailPage from '../pages/turnos/PatientAppointmentDetailPage';

// Configuración
import CatalogoPage from '../pages/configuracion/CatalogoPage';
import CoberturaPage from '../pages/configuracion/CoberturaPage';
import HorariosPage from '../pages/configuracion/HorariosPage';
import ParametrosPage from '../pages/configuracion/ParametrosPage';
import BloqueosPage from '../pages/configuracion/BloqueosPage';

// Reportes
import ReportesPage from '../pages/reportes/ReportesPage';

// Layout y protección de rutas
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

/**
 * Decide qué pantalla mostrar en "/" según el rol.
 */
const RoleHome = () => {
  const {
    user,
    patient,
  } = useAuth();

  // Profesional.
  if (user?.rol === 'PROFESIONAL') {
    return <Dashboard />;
  }

  // Paciente.
  // Si todavía no completó su perfil, lo redirige.
  if (user?.rol === 'PACIENTE') {
    return patient ? (
      <Dashboard />
    ) : (
      <Navigate
        to="/completar-perfil"
        replace
      />
    );
  }

  // Administradores.
  if (
    ['SUPER_ADMIN', 'ADMIN_SALITA'].includes(
      user?.rol ?? ''
    )
  ) {
    return <Dashboard />;
  }

  return (
    <p>
      Tu rol no tiene un panel habilitado. Contactá a la
      administración.
    </p>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================================== */}
        {/* RUTAS PÚBLICAS */}
        {/* ======================================== */}

        <Route
          path="/registro"
          element={<RegisterPage />}
        />

        <Route
          path="/recuperar-contrasena"
          element={
            <PasswordRecoveryPage mode="forgot" />
          }
        />

        <Route
          path="/restablecer-contrasena"
          element={
            <PasswordRecoveryPage mode="reset" />
          }
        />

        <Route
          path="/verificar-email"
          element={
            <PasswordRecoveryPage mode="verify" />
          }
        />

        <Route
          path="/verificar-codigo"
          element={<VerifyEmailCodePage />}
        />

        {/* ======================================== */}
        {/* AUTENTICACIÓN */}
        {/* ======================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ======================================== */}
        {/* RUTAS PROTEGIDAS */}
        {/* ======================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* ==================================== */}
            {/* PACIENTE */}
            {/* ==================================== */}

            <Route
              element={
                <ProtectedRoute
                  roles={['PACIENTE']}
                />
              }
            >
              <Route
                path="/completar-perfil"
                element={
                  <CompletePatientProfilePage />
                }
              />

              <Route
                path="/solicitar-turno"
                element={<SolicitarTurnoPage />}
              />

              <Route
                path="/mis-turnos"
                element={<PatientAppointmentsPage />}
              />
              <Route path="/mis-turnos/:id" element={<PatientAppointmentDetailPage />} />
            </Route>

            {/* ==================================== */}
            {/* PROFESIONAL */}
            {/* ==================================== */}

            <Route
              element={
                <ProtectedRoute
                  roles={['PROFESIONAL']}
                />
              }
            >
              <Route
                path="/mi-agenda"
                element={<MisTurnosPage />}
              />

              <Route
                path="/mis-pacientes"
                element={<MisTurnosPage />}
              />
            </Route>

            {/* ==================================== */}
            {/* PACIENTE Y PROFESIONAL */}
            {/* ==================================== */}

            <Route
              element={
                <ProtectedRoute
                  roles={[
                    'PACIENTE',
                    'PROFESIONAL',
                  ]}
                />
              }
            >
              <Route
                path="/mi-perfil"
                element={<MiPerfilPage />}
              />
            </Route>

            {/* ==================================== */}
            {/* DASHBOARD */}
            {/* ==================================== */}

            <Route
              path="/"
              element={<RoleHome />}
            />

            {/* ==================================== */}
            {/* ADMINISTRACIÓN */}
            {/* SUPER_ADMIN / ADMIN_SALITA */}
            {/* ==================================== */}

            <Route
              element={
                <ProtectedRoute
                  roles={[
                    'SUPER_ADMIN',
                    'ADMIN_SALITA',
                  ]}
                />
              }
            >
              {/* ================================== */}
              {/* CONFIGURACIÓN */}
              {/* ================================== */}

              <Route
                path="/configuracion"
                element={<ConfiguracionPage />}
              />

              <Route
                path="/configuracion/horarios"
                element={<HorariosPage />}
              />

              <Route
                path="/configuracion/parametros"
                element={<ParametrosPage />}
              />

              <Route
                path="/configuracion/bloqueos"
                element={<BloqueosPage />}
              />

              {/* Configuración exclusiva de SUPER_ADMIN */}
              <Route
                element={
                  <ProtectedRoute
                    roles={['SUPER_ADMIN']}
                  />
                }
              >
                <Route
                  path="/configuracion/zonas"
                  element={
                    <CatalogoPage
                      key="zonas"
                      tipo="zonas"
                    />
                  }
                />

                <Route
                  path="/configuracion/barrios"
                  element={
                    <CatalogoPage
                      key="barrios"
                      tipo="barrios"
                    />
                  }
                />

                <Route
                  path="/configuracion/especialidades"
                  element={
                    <CatalogoPage
                      key="especialidades"
                      tipo="especialidades"
                    />
                  }
                />

                <Route
                  path="/configuracion/cobertura"
                  element={<CoberturaPage />}
                />
              </Route>

              {/* ================================== */}
              {/* CUENTAS DE ACCESO */}
              {/* ================================== */}

              <Route
                path="/administracion"
                element={<AccountManagementPage />}
              />

              {/* ================================== */}
              {/* PACIENTES */}
              {/* ================================== */}

              <Route
                path="/pacientes"
                element={<PacientesPage />}
              />

              <Route
                path="/pacientes/nuevo"
                element={<NuevoPacientePage />}
              />

              <Route
                path="/pacientes/:id"
                element={<PacienteDetallePage />}
              />

              {/* ================================== */}
              {/* SALITAS */}
              {/* Solo SUPER_ADMIN */}
              {/* ================================== */}

              <Route
                element={
                  <ProtectedRoute
                    roles={['SUPER_ADMIN']}
                  />
                }
              >
                <Route
                  path="/salitas"
                  element={<SalitasPage />}
                />

                <Route
                  path="/salitas/nueva"
                  element={<NuevaSalitaPage />}
                />

                {/* Evita interpretar "nuevo" como un ID. */}
                <Route
                  path="/salitas/nuevo"
                  element={
                    <Navigate
                      to="/salitas/nueva"
                      replace
                    />
                  }
                />

                <Route
                  path="/salitas/:id"
                  element={<SalitaDetallePage />}
                />

                <Route
                  path="/salitas/:id/editar"
                  element={<EditarSalitaPage />}
                />
              </Route>

              {/* ================================== */}
              {/* PROFESIONALES */}
              {/* ================================== */}

              <Route
                path="/profesionales"
                element={<ProfesionalesPage />}
              />

              <Route
                path="/profesionales/nuevo"
                element={<NuevoProfesionalPage />}
              />

              <Route
                path="/profesionales/:id"
                element={<ProfesionalDetallePage />}
              />

              <Route
                path="/profesionales/:id/editar"
                element={<EditarProfesionalPage />}
              />

              {/* ================================== */}
              {/* TURNOS */}
              {/* ================================== */}

              <Route
                path="/turnos"
                element={<TurnosPage />}
              />

              <Route
                path="/turnos/nuevo"
                element={<NuevoTurnoPage />}
              />

              <Route
                path="/turnos/:id/reprogramar"
                element={<ReprogramarTurnoPage />}
              />

              <Route
                path="/turnos/:id"
                element={<TurnoDetallePage />}
              />

              {/* ================================== */}
              {/* REPORTES */}
              {/* ================================== */}

              <Route
                path="/reportes"
                element={<ReportesPage />}
              />
            </Route>
          </Route>
        </Route>

        {/* ======================================== */}
        {/* RUTA NO ENCONTRADA */}
        {/* ======================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
