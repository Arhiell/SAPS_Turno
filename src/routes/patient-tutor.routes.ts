import {
  Router
} from "express";

import {
  authenticate
} from "../middlewares/auth.middleware.js";

import {
  requireRole
} from "../middlewares/role.middleware.js";

import {
  addTutorToPatientController,
  listPatientTutorsController,
  listTutorPatientsController,
  updatePatientTutorController,
  finishPatientTutorController
} from "../controllers/patient-tutor.controller.js";

const router = Router();

/**
 * Todas las rutas requieren autenticación.
 */
router.use(authenticate);
router.use(
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  )
);

/**
 * Relaciones desde paciente.
 */
router.post(
  "/patients/:patientId/tutors",
  addTutorToPatientController
);

router.get(
  "/patients/:patientId/tutors",
  listPatientTutorsController
);

router.patch(
  "/patients/:patientId/tutors/:tutorId",
  updatePatientTutorController
);

router.patch(
  "/patients/:patientId/tutors/:tutorId/end",
  finishPatientTutorController
);

/**
 * Relaciones desde tutor.
 */
router.get(
  "/tutors/:tutorId/patients",
  listTutorPatientsController
);

export default router;