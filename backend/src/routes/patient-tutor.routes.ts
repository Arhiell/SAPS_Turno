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

const authorize = [
  authenticate,
  requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION")
];

/**
 * Relaciones desde paciente.
 */
router.post(
  "/patients/:patientId/tutors",
  ...authorize,
  addTutorToPatientController
);

router.get(
  "/patients/:patientId/tutors",
  ...authorize,
  listPatientTutorsController
);

router.patch(
  "/patients/:patientId/tutors/:tutorId",
  ...authorize,
  updatePatientTutorController
);

router.patch(
  "/patients/:patientId/tutors/:tutorId/end",
  ...authorize,
  finishPatientTutorController
);

/**
 * Relaciones desde tutor.
 */
router.get(
  "/tutors/:tutorId/patients",
  ...authorize,
  listTutorPatientsController
);

export default router;