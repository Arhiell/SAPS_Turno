import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Login from '../pages/auth/Login';
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

        {/* AUTENTICACIÓN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* DASHBOARD */}
            <Route
              path="/"
              element={<Dashboard />}
            />

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