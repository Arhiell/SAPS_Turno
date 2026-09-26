import { patientScope } from "../middlewares/profile-scope.middleware.js";
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
  patientScope,
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
  patientScope,
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
  patientScope,
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
  patientScope,
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
  patientScope,
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
  patientScope,
  createPatientController
);

export default router;