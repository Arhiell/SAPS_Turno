import { Router } from 'express';

import {
  adminContentRoutes,
  publicContentRoutes,
} from './public-content.routes.js';

import configuracionRoutes from './configuracion.routes.js';
import healthRoutes from './health.routes.js';
import userRoutes from './user.routes.js';
import authRoutes from './auth.routes.js';
import passwordRecoveryRoutes from './password-recovery.routes.js';
import emailVerificationRoutes from './email-verification.routes.js';
import googleAuthRoutes from './google-auth.routes.js';

import especialidadRoutes from './especialidad.routes.js';
import salitaRoutes from './salita.routes.js';
import barrioRoutes from './barrio.routes.js';
import zonaRoutes from './zona.routes.js';

import patientRoutes from './patient.routes.js';
import tutorRoutes from './tutor.routes.js';
import patientTutorRoutes from './patient-tutor.routes.js';

import salitaBarrioRoutes from './salita-barrio.routes.js';

import profesionalRoutes from './profesional.routes.js';
import profesionalEspecialidadRoutes from './profesional-especialidad.routes.js';
import profesionalSalitaRoutes from './profesional-salita.routes.js';

import horarioAtencionRoutes from './horario-atencion.routes.js';
import bloqueoAgendaRoutes from './bloqueo-agenda.routes.js';
import disponibilidadRoutes from './disponibilidad.routes.js';

import turnoRoutes from './turno.routes.js';
import historialTurnoRoutes from './historial-turno.routes.js';
import sancionRoutes from './sancion.routes.js';

import notificacionRoutes from './notificacion.routes.js';
import accessManagementRoutes from './access-management.routes.js';
import auditoriaRoutes from './auditoria.routes.js';
import reporteRoutes from './reporte.routes.js';

const router = Router();

// Contenido público y administración de contenido.
router.use('/public', publicContentRoutes);
router.use('/contenido', adminContentRoutes);

// Parámetros globales y configuraciones por salita.
router.use('/configuracion', configuracionRoutes);

// Estado general de la API.
router.use('/health', healthRoutes);

// Gestión de usuarios.
router.use('/users', userRoutes);
router.use('/access-management', accessManagementRoutes);

// Autenticación y acceso.
router.use('/auth', authRoutes);
router.use('/auth/password', passwordRecoveryRoutes);
router.use('/auth/email', emailVerificationRoutes);
router.use('/auth/google', googleAuthRoutes);

// Catálogos principales.
router.use('/especialidades', especialidadRoutes);
router.use('/salitas', salitaRoutes);
router.use('/barrios', barrioRoutes);
router.use('/zonas', zonaRoutes);

// Pacientes y tutores.
router.use('/patients', patientRoutes);
router.use('/tutors', tutorRoutes);
router.use('/', patientTutorRoutes);

// Cobertura de barrios por salita.
router.use('/salita-barrios', salitaBarrioRoutes);

// Profesionales y sus asignaciones.
router.use('/profesionales', profesionalRoutes);
router.use('/profesionales', profesionalEspecialidadRoutes);
router.use('/profesionales', profesionalSalitaRoutes);

// Gestión de agenda y disponibilidad.
router.use('/horarios-atencion', horarioAtencionRoutes);
router.use('/bloqueos-agenda', bloqueoAgendaRoutes);
router.use('/disponibilidad', disponibilidadRoutes);

// Turnos e historial de cambios.
router.use('/turnos', turnoRoutes);
router.use('/', historialTurnoRoutes);

// Sanciones por inasistencia.
router.use('/sanciones', sancionRoutes);

// Notificaciones internas del usuario.
router.use('/notificaciones', notificacionRoutes);

// Auditoría general del sistema.
router.use('/auditoria', auditoriaRoutes);

// Reportes y estadísticas.
router.use('/reportes', reporteRoutes);

export default router;
