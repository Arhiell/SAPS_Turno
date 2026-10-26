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

import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getTurnoScope, assertTurnoScope } from '../services/turno-access.service.js';
import { getPatientById } from '../services/patient-read.service.js';
import { registerExistingTutor } from '../services/tutor.service.js';
import { addTutorToPatient } from '../services/patient-tutor.service.js';
import { createPatientTutorSchema } from '../validators/patient-tutor.validator.js';
import { personDniSchema } from '../validators/person.validator.js';

const router = Router();

const relationScope: RequestHandler = async (req, _res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.patientId);
    const patient = await getPatientById(id);
    assertTurnoScope(await getTurnoScope(req.user!), patient.id_salita_asignada);
    next();
  } catch (error) { next(error); }
};

const authorize = [
  authenticate,
  requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION")
];

router.use('/patients/:patientId/tutors', ...authorize, relationScope);
router.post('/patients/:patientId/tutors/by-dni', async (req, res, next) => {
  try {
    const input = createPatientTutorSchema.omit({ id_tutor: true }).extend({
      dni: personDniSchema,
      puede_gestionar_turnos: z.literal(true),
    }).parse(req.body);
    const { dni, ...relation } = input;
    const tutor = await registerExistingTutor(dni);
    const result = await addTutorToPatient(String(req.params.patientId), { ...relation, id_tutor: tutor.id_tutor });
    res.status(201).json({ success: true, data: { relation: result } });
  } catch (error) { next(error); }
});

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
