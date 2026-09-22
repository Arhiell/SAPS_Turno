import { Router } from "express";
import configuracionRoutes from "./configuracion.routes.js";

import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import passwordRecoveryRoutes from "./password-recovery.routes.js";
import emailVerificationRoutes
  from "./email-verification.routes.js";
import especialidadRoutes from "./especialidad.routes.js";
import salitaRoutes from "./salita.routes.js";
import barrioRoutes from "./barrio.routes.js";
import zonaRoutes from "./zona.routes.js";
import googleAuthRoutes from "./google-auth.routes.js";
import patientRoutes from "./patient.routes.js";

import tutorRoutes from "./tutor.routes.js";
import salitaBarrioRoutes from "./salita-barrio.routes.js";
import profesionalRoutes from "./profesional.routes.js";
import profesionalEspecialidadRoutes from "./profesional-especialidad.routes.js";
import profesionalSalitaRoutes from "./profesional-salita.routes.js";
import horarioAtencionRoutes from "./horario-atencion.routes.js";
import bloqueoAgendaRoutes from "./bloqueo-agenda.routes.js";
import patientTutorRoutes from "./patient-tutor.routes.js";
import turnoRoutes from "./turno.routes.js";
import disponibilidadRoutes from "./disponibilidad.routes.js";

import historialTurnoRoutes from "./historial-turno.routes.js";
import sancionRoutes from "./sancion.routes.js";
import notificacionRoutes from "./notificacion.routes.js";
import auditoriaRoutes from "./auditoria.routes.js";
import reporteRoutes from "./reporte.routes.js";

const router = Router();

// Parámetros globales y por salita.
router.use("/configuracion", configuracionRoutes);

// Estado general.
router.use("/health", healthRoutes);

// Módulo de usuarios.
router.use("/users", userRoutes);

// Registro, login, tokens, etc.
router.use("/auth", authRoutes);

// Recuperación de contraseña.
router.use("/auth/password", passwordRecoveryRoutes);

// Verificación de email.
router.use("/auth/email", emailVerificationRoutes);

// Autenticación federada Google.
router.use("/auth/google", googleAuthRoutes);

// Especialidades.
router.use("/especialidades", especialidadRoutes);

// Salitas.
router.use("/salitas", salitaRoutes);

// Barrios.
router.use("/barrios", barrioRoutes);

// Zonas.
router.use("/zonas", zonaRoutes);

// Pacientes.
router.use("/patients", patientRoutes);
router.use("/tutors", tutorRoutes);
router.use("/", patientTutorRoutes);

// Salitas-Barrios.
router.use("/salita-barrios", salitaBarrioRoutes);

// Profesionales.
router.use("/profesionales", profesionalRoutes);

// Profesionales-Especialidades.
router.use("/profesionales", profesionalEspecialidadRoutes);

// Profesionales-Salitas.
router.use("/profesionales", profesionalSalitaRoutes);

// Horarios de atención.
router.use("/horarios-atencion", horarioAtencionRoutes);

// Bloqueos de agenda.
router.use("/bloqueos-agenda", bloqueoAgendaRoutes);

// Historial automático de cambios de los turnos.
router.use("/", historialTurnoRoutes);

// Sanciones por inasistencia.
router.use("/sanciones", sancionRoutes);

// Reservas y validación de agenda.
router.use("/turnos", turnoRoutes);

// Disponibilidad.
router.use("/disponibilidad", disponibilidadRoutes);

// Notificaciones internas del usuario.
router.use("/notificaciones", notificacionRoutes);

// Consulta del registro general de cambios.
router.use("/auditoria", auditoriaRoutes);

// Reportes y estadísticas.
router.use("/reportes", reporteRoutes);

export default router;
