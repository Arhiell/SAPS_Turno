import {
  lazy,
  Suspense,
} from 'react';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// Autenticación: se mantiene Login disponible para la carga inicial.
import Login from '../pages/auth/Login';

// Layouts y protección de rutas.
import AppLayout from '../components/layout/AppLayout';
import Chatbot from '../components/chatbot/Chatbot';
import PublicLayout from '../components/public/PublicLayout';
import ProtectedRoute from './ProtectedRoute';

// Páginas cargadas solo cuando el usuario visita su ruta.
const AccountManagementPage = lazy(() => import('../pages/auth/AccountManagementPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const PasswordRecoveryPage = lazy(() => import('../pages/auth/PasswordRecoveryPage'));
const VerifyEmailCodePage = lazy(() => import('../pages/auth/VerifyEmailCodePage'));
const CompletePatientProfilePage = lazy(() => import('../pages/auth/CompletePatientProfilePage'));
const CompleteAdminProfilePage = lazy(() => import('../pages/auth/CompleteAdminProfilePage'));
const AdminProfilePage = lazy(() => import('../pages/auth/AdminProfilePage'));
const PrivacyPolicyPage = lazy(() => import('../pages/auth/PrivacyPolicyPage'));

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ConfiguracionPage = lazy(() => import('../pages/dashboard/ConfiguracionPage'));

const PacientesPage = lazy(() => import('../pages/pacientes/PacientesPage'));
const PacienteDetallePage = lazy(() => import('../pages/pacientes/PacienteDetallePage'));
const NuevoPacientePage = lazy(() => import('../pages/pacientes/NuevoPacientePage'));
const MiPerfilPage = lazy(() => import('../pages/pacientes/MiPerfilPage'));

const SalitasPage = lazy(() => import('../pages/salitas/SalitasPage'));
const NuevaSalitaPage = lazy(() => import('../pages/salitas/NuevaSalitaPage'));
const EditarSalitaPage = lazy(() => import('../pages/salitas/EditarSalitaPage'));
const SalitaDetallePage = lazy(() => import('../pages/salitas/SalitaDetallePage'));

const ProfesionalesPage = lazy(() => import('../pages/profesionales/ProfesionalesPage'));
const NuevoProfesionalPage = lazy(() => import('../pages/profesionales/NuevoProfesionalPage'));
const EditarProfesionalPage = lazy(() => import('../pages/profesionales/EditarProfesionalPage'));
const ProfesionalDetallePage = lazy(() => import('../pages/profesionales/ProfesionalDetallePage'));

const TurnosPage = lazy(() => import('../pages/turnos/TurnosPage'));
const NuevoTurnoPage = lazy(() => import('../pages/turnos/NuevoTurnoPage'));
const TurnoDetallePage = lazy(() => import('../pages/turnos/TurnoDetallePage'));
const ReprogramarTurnoPage = lazy(() => import('../pages/turnos/ReprogramarTurnoPage'));
const SolicitarTurnoPage = lazy(() => import('../pages/turnos/SolicitarTurnoPage'));
const MisTurnosPage = lazy(() => import('../pages/turnos/MisTurnosPage'));
const PersonasACargoPage = lazy(() => import('../pages/pacientes/PersonasACargoPage'));
const PatientAppointmentsPage = lazy(() => import('../pages/turnos/PatientAppointmentsPage'));
const PatientAppointmentDetailPage = lazy(() => import('../pages/turnos/PatientAppointmentDetailPage'));

const CatalogoPage = lazy(() => import('../pages/configuracion/CatalogoPage'));
const CoberturaPage = lazy(() => import('../pages/configuracion/CoberturaPage'));
const HorariosPage = lazy(() => import('../pages/configuracion/HorariosPage'));
const ParametrosPage = lazy(() => import('../pages/configuracion/ParametrosPage'));
const BloqueosPage = lazy(() => import('../pages/configuracion/BloqueosPage'));

const ReportesPage = lazy(() => import('../pages/reportes/ReportesPage'));

const MisNotificacionesPage = lazy(() => import('../pages/notificaciones/MisNotificacionesPage'));
const NuevaNotificacionPage = lazy(() => import('../pages/notificaciones/NuevaNotificacionPage'));
const HistorialNotificacionesPage = lazy(() => import('../pages/notificaciones/HistorialNotificacionesPage'));
const DetalleNotificacionPage = lazy(() => import('../pages/notificaciones/DetalleNotificacionPage'));

const NewsAdminPage = lazy(() => import('../pages/contenido/NewsAdminPage'));
const NewsEditorPage = lazy(() => import('../pages/contenido/NewsEditorPage'));

const PublicHomePage = lazy(() => import('../pages/public/PublicHomePage'));
const PublicNewsDetailPage = lazy(() => import('../pages/public/PublicNewsDetailPage'));

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

// Indicador simple mientras se descarga el módulo de la ruta solicitada.
const RouteLoading = () => (
  <div className="d-flex justify-content-center align-items-center py-5" role="status">
    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
    Cargando página…
  </div>
);

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
      <Suspense fallback={<RouteLoading />}>
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
              <Route path="/privacidad" element={<PrivacyPolicyPage />} />
              <Route path="/asistente" element={<Chatbot embedded />} />
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
                <Route path="/personas-a-cargo" element={<PersonasACargoPage />} />

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
                  element={<MisTurnosPage key="agenda" mode="history" />}
                />

                <Route
                  path="/mis-pacientes"
                  element={<MisTurnosPage key="today" mode="today" />}
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
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;
