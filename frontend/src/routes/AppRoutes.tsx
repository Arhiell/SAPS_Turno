import SolicitarTurnoPage from '../pages/turnos/SolicitarTurnoPage';
import ConfiguracionPage from '../pages/dashboard/ConfiguracionPage';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Login from '../pages/auth/Login';
import AccountManagementPage from '../pages/auth/AccountManagementPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PasswordRecoveryPage from '../pages/auth/PasswordRecoveryPage';
import VerifyEmailCodePage from '../pages/auth/VerifyEmailCodePage';
import CompletePatientProfilePage from '../pages/auth/CompletePatientProfilePage';
import MiPerfilPage from '../pages/pacientes/MiPerfilPage';
import MisTurnosPage from '../pages/turnos/MisTurnosPage';
import { useAuth } from '../context/AuthContext';
const RoleHome = () => {
 const { user, patient } = useAuth();
 if (user?.rol === 'PROFESIONAL') return <Dashboard />;
 if (user?.rol === 'PACIENTE') return patient ? <Dashboard /> : <Navigate to="/completar-perfil" replace />;
 if (['SUPER_ADMIN', 'ADMIN_SALITA'].includes(user?.rol ?? '')) return <Dashboard />;
 return <p>Tu rol no tiene un panel habilitado. Contactá a la administración.</p>;
};
import Dashboard from '../pages/dashboard/Dashboard';

import PacientesPage from '../pages/pacientes/PacientesPage';
import PacienteDetallePage from '../pages/pacientes/PacienteDetallePage';
import NuevoPacientePage from '../pages/pacientes/NuevoPacientePage';

import SalitasPage from '../pages/salitas/SalitasPage';
import NuevaSalitaPage from '../pages/salitas/NuevaSalitaPage';
import EditarSalitaPage from '../pages/salitas/EditarSalitaPage';
import SalitaDetallePage from '../pages/salitas/SalitaDetallePage';

import ProfesionalesPage from '../pages/profesionales/ProfesionalesPage';
import NuevoProfesionalPage from '../pages/profesionales/NuevoProfesionalPage';
import EditarProfesionalPage from '../pages/profesionales/EditarProfesionalPage';
import ProfesionalDetallePage from '../pages/profesionales/ProfesionalDetallePage';

import TurnosPage from '../pages/turnos/TurnosPage';
import NuevoTurnoPage from '../pages/turnos/NuevoTurnoPage';
import TurnoDetallePage from '../pages/turnos/TurnoDetallePage';
import ReprogramarTurnoPage from '../pages/turnos/ReprogramarTurnoPage';

import ReportesPage from '../pages/reportes/ReportesPage';

import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<PasswordRecoveryPage mode="forgot" />} />
        <Route path="/restablecer-contrasena" element={<PasswordRecoveryPage mode="reset" />} />
        <Route path="/verificar-email" element={<PasswordRecoveryPage mode="verify" />} />
        <Route path="/verificar-codigo" element={<VerifyEmailCodePage />} />

        {/* AUTENTICACIÓN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            <Route element={<ProtectedRoute roles={['PACIENTE']} />}>
              <Route path="/completar-perfil" element={<CompletePatientProfilePage />} />
              <Route path="/solicitar-turno" element={<SolicitarTurnoPage />} />
              <Route path="/mis-turnos" element={<MisTurnosPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['PROFESIONAL']} />}>
              <Route path="/mi-agenda" element={<MisTurnosPage />} />
              <Route path="/mis-pacientes" element={<MisTurnosPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['PACIENTE', 'PROFESIONAL']} />}><Route path="/mi-perfil" element={<MiPerfilPage />} /></Route>
            {/* DASHBOARD */}
            <Route
              path="/"
              element={<RoleHome />}
            />

            <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN_SALITA']} />}>
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/administracion" element={<AccountManagementPage />} />
            {/* ========================= */}
            {/* PACIENTES */}
            {/* ========================= */}

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

            {/* ========================= */}
            {/* SALITAS */}
            {/* ========================= */}

            <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
            <Route
              path="/salitas"
              element={<SalitasPage />}
            />

            <Route
              path="/salitas/nueva"
              element={<NuevaSalitaPage />}
            />

            <Route
              path="/salitas/:id"
              element={<SalitaDetallePage />}
            />

            <Route
              path="/salitas/:id/editar"
              element={<EditarSalitaPage />}
            />

            {/* ========================= */}
            </Route>
            {/* PROFESIONALES */}
            {/* ========================= */}

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

            {/* ========================= */}
            {/* TURNOS */}
            {/* ========================= */}

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

            {/* ========================= */}
            {/* REPORTES */}
            {/* ========================= */}

            <Route
              path="/reportes"
              element={<ReportesPage />}
            />

            </Route>
          </Route>
        </Route>

        {/* RUTA NO ENCONTRADA */}
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
