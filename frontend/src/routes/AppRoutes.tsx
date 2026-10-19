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
import CompleteAdminProfilePage from '../pages/auth/CompleteAdminProfilePage';
import AdminProfilePage from '../pages/auth/AdminProfilePage';

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

// Notificaciones
import MisNotificacionesPage from '../pages/notificaciones/MisNotificacionesPage';
import NuevaNotificacionPage from '../pages/notificaciones/NuevaNotificacionPage';
import HistorialNotificacionesPage from '../pages/notificaciones/HistorialNotificacionesPage';
import DetalleNotificacionPage from '../pages/notificaciones/DetalleNotificacionPage';

// Contenido
import NewsAdminPage from '../pages/contenido/NewsAdminPage';
import NewsEditorPage from '../pages/contenido/NewsEditorPage';

// Páginas públicas
import PublicHomePage from '../pages/public/PublicHomePage';
import PublicNewsDetailPage from '../pages/public/PublicNewsDetailPage';

// Layouts
import AppLayout from '../components/layout/AppLayout';
import PublicLayout from '../components/public/PublicLayout';

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

// Muestra el panel correspondiente al rol del usuario autenticado.
const RoleHome = () => {
  const { user } = useAuth();

  return [
    'SUPER_ADMIN',
    'ADMIN_SALITA',
    'PROFESIONAL',
    'PACIENTE',
  ].includes(user?.rol ?? '') ? (
    <Dashboard />
  ) : (
    <p>
      Tu rol no tiene un panel habilitado. Contactá a la administración.
    </p>
  );
};

// Define las rutas públicas y privadas de la aplicación.
const AppRoutes = () => {
  const { user } = useAuth();

  // Identifica si el usuario tiene un rol administrativo.
  const administrative = [
    'SUPER_ADMIN',
    'ADMIN_SALITA',
  ].includes(user?.rol ?? '');

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas del sitio. */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={<PublicHomePage />}
          />

          <Route
            path="/noticias/:id"
            element={<PublicNewsDetailPage />}
          />
        </Route>

        {/* Rutas de autenticación y recuperación de acceso. */}
        <Route
          path="/acceso-personal"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/registro"
          element={<RegisterPage />}
        />

        <Route
          path="/recuperar-contrasena"
          element={<PasswordRecoveryPage mode="forgot" />}
        />

        <Route
          path="/restablecer-contrasena"
          element={<PasswordRecoveryPage mode="reset" />}
        />

        <Route
          path="/verificar-email"
          element={<PasswordRecoveryPage mode="verify" />}
        />

        <Route
          path="/verificar-codigo"
          element={<VerifyEmailCodePage />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Rutas disponibles para usuarios autenticados. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Panel principal y notificaciones personales. */}
            <Route
              path="/panel"
              element={<RoleHome />}
            />

            <Route
              path="/mis-notificaciones"
              element={<MisNotificacionesPage />}
            />

            {/* Permite completar el perfil según el rol del usuario. */}
            <Route
              element={
                <ProtectedRoute
                  roles={['SUPER_ADMIN', 'ADMIN_SALITA', 'PACIENTE']}
                />
              }
            >
              <Route
                path="/completar-perfil"
                element={
                  administrative
                    ? <CompleteAdminProfilePage />
                    : <CompletePatientProfilePage />
                }
              />
            </Route>

            {/* Perfil personal de los usuarios autenticados. */}
            <Route
              element={
                <ProtectedRoute
                  roles={[
                    'SUPER_ADMIN',
                    'ADMIN_SALITA',
                    'PACIENTE',
                    'PROFESIONAL',
                  ]}
                />
              }
            >
              <Route
                path="/mi-perfil"
                element={
                  user?.rol === 'PACIENTE'
                    ? <MiPerfilPage />
                    : <AdminProfilePage />
                }
              />
            </Route>

            {/* Rutas exclusivas para pacientes. */}
            <Route
              element={
                <ProtectedRoute roles={['PACIENTE']} />
              }
            >
              <Route
                path="/solicitar-turno"
                element={<SolicitarTurnoPage />}
              />

              <Route
                path="/mis-turnos"
                element={<PatientAppointmentsPage />}
              />

              <Route
                path="/mis-turnos/:id"
                element={<PatientAppointmentDetailPage />}
              />
            </Route>

            {/* Rutas exclusivas para profesionales. */}
            <Route
              element={
                <ProtectedRoute roles={['PROFESIONAL']} />
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

            {/* Rutas para administradores de salitas y superadministradores. */}
            <Route
              element={
                <ProtectedRoute
                  roles={['SUPER_ADMIN', 'ADMIN_SALITA']}
                />
              }
            >
              {/* Gestión de noticias y contenido. */}
              <Route
                path="/contenido"
                element={<NewsAdminPage />}
              />

              <Route
                path="/contenido/nueva"
                element={
                  <NewsEditorPage key="nueva-noticia" />
                }
              />

              <Route
                path="/contenido/:id/editar"
                element={
                  <NewsEditorPage key="editar-noticia" />
                }
              />

              {/* Gestión de notificaciones. */}
              <Route
                path="/notificaciones"
                element={
                  <HistorialNotificacionesPage key="historial" />
                }
              />

              <Route
                path="/notificaciones/programadas"
                element={
                  <HistorialNotificacionesPage
                    key="programadas"
                    programadas
                  />
                }
              />

              <Route
                path="/notificaciones/nueva"
                element={
                  <NuevaNotificacionPage key="nueva" />
                }
              />

              <Route
                path="/notificaciones/:id/editar"
                element={
                  <NuevaNotificacionPage
                    key="editar"
                    editar
                  />
                }
              />

              <Route
                path="/notificaciones/:id"
                element={<DetalleNotificacionPage />}
              />

              {/* Configuración general del sistema. */}
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

              {/* Administración de cuentas de acceso. */}
              <Route
                path="/administracion"
                element={<AccountManagementPage />}
              />

              {/* Gestión de pacientes. */}
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

              {/* Gestión de profesionales. */}
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

              {/* Gestión de turnos. */}
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

              {/* Reportes del sistema. */}
              <Route
                path="/reportes"
                element={<ReportesPage />}
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

              {/* Rutas exclusivas para el superadministrador. */}
              <Route
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN']} />
                }
              >
                {/* Catálogos y cobertura territorial. */}
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
                  path="/configuracion/cobertura"
                  element={<CoberturaPage />}
                />

                {/* Gestión de salitas. */}
                <Route
                  path="/salitas"
                  element={<SalitasPage />}
                />

                <Route
                  path="/salitas/nueva"
                  element={<NuevaSalitaPage />}
                />

                <Route
                  path="/salitas/nuevo"
                  element={
                    <Navigate to="/salitas/nueva" replace />
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
            </Route>
          </Route>
        </Route>

        {/* Redirige las rutas inexistentes a la página principal. */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;