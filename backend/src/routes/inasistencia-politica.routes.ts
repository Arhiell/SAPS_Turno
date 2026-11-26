import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  getEstadoInasistenciasController,
  crearJustificacionController,
  listJustificacionesController,
  evaluarJustificacionController,
  rectificarInasistenciaController,
  listInasistenciasAdminController,
  listAdvertenciasAdminController,
  anularAdvertenciaAdminController,
  getMetricasInasistenciasController,
} from '../controllers/inasistencia-politica.controller.js';

const router = Router();

// Métricas para contadores de badges en el panel administrativo
router.get(
  '/metricas',
  authenticate,
  requireRole('RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  getMetricasInasistenciasController
);

// Consulta de inasistencias registradas (NO_ASISTIO) con conteo de faltas 90 días
router.get(
  '/registradas',
  authenticate,
  requireRole('RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  listInasistenciasAdminController
);

// Consulta de advertencias administrativas emitidas
router.get(
  '/advertencias',
  authenticate,
  requireRole('RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  listAdvertenciasAdminController
);

// Anulación administrativa de advertencia con motivo
router.patch(
  '/advertencias/:id/anular',
  authenticate,
  requireRole('ADMIN_SALITA', 'SUPER_ADMIN'),
  anularAdvertenciaAdminController
);

// Consulta de estado de inasistencias, advertencias y sanciones de un paciente
router.get(
  '/pacientes/:id_paciente/estado',
  authenticate,
  requireRole('PACIENTE', 'RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN', 'PROFESIONAL'),
  getEstadoInasistenciasController
);

// Presentar justificación de inasistencia
router.post(
  '/justificaciones',
  authenticate,
  requireRole('PACIENTE', 'RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  crearJustificacionController
);

// Listar justificaciones para revisión administrativa
router.get(
  '/justificaciones',
  authenticate,
  requireRole('RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  listJustificacionesController
);

// Evaluar (aprobar o rechazar) una justificación
router.patch(
  '/justificaciones/:id/evaluar',
  authenticate,
  requireRole('RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  evaluarJustificacionController
);

// Rectificar un turno marcado como NO_ASISTIO hacia ATENDIDO
router.post(
  '/turnos/:id/rectificar',
  authenticate,
  requireRole('PROFESIONAL', 'RECEPCION', 'ADMIN_SALITA', 'SUPER_ADMIN'),
  rectificarInasistenciaController
);

export default router;
