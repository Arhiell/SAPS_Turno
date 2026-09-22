import {
  Router
} from "express";

import {
  createPatientController
} from "../controllers/patient.controller.js";

import {
  getPatientByDniController,
  getPatientController,
  listPatientsController
} from "../controllers/patient-read.controller.js";

import {
  updatePatientController,
  updatePatientStatusController
} from "../controllers/patient-update.controller.js";

import {
  authenticate
} from "../middlewares/auth.middleware.js";

import {
  requireRole
} from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * Listar pacientes.
 */
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  listPatientsController
);

/**
 * Buscar paciente por DNI.
 */
router.get(
  "/dni/:dni",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  getPatientByDniController
);

/**
 * Cambiar estado.
 */
router.patch(
  "/:id/status",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  updatePatientStatusController
);

/**
 * Buscar paciente por ID.
 */
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  getPatientController
);

/**
 * Actualizar paciente.
 */
router.patch(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  updatePatientController
);

/**
 * Crear paciente.
 */
router.post(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  createPatientController
);

export default router;