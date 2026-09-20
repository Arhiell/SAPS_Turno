import { Router } from "express";

import { authenticate } from
  "../middlewares/auth.middleware.js";

import { requireRole } from
  "../middlewares/role.middleware.js";

import {
  getReporteResumenController,
  getReporteEspecialidadesController,
  getReporteProfesionalesController,
  exportReporteController,
} from "../controllers/reporte.controller.js";

const router = Router();

const rolesReporte = [
  "SUPER_ADMIN",
  "ADMIN_SALITA",
  "RECEPCION",
];

// Resumen general del período.
router.get(
  "/resumen",
  authenticate,
  requireRole(...rolesReporte),
  getReporteResumenController,
);

// Demanda por especialidad.
router.get(
  "/especialidades",
  authenticate,
  requireRole(...rolesReporte),
  getReporteEspecialidadesController,
);

// Actividad por profesional.
router.get(
  "/profesionales",
  authenticate,
  requireRole(...rolesReporte),
  getReporteProfesionalesController,
);

// Exporta PDF, Excel o Word.
router.get(
  "/exportar",
  authenticate,
  requireRole(...rolesReporte),
  exportReporteController,
);

export default router;