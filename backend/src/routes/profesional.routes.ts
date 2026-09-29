import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { professionalScope } from "../middlewares/profile-scope.middleware.js";
import { Router } from "express";
import { patientProfessionals } from '../controllers/patient-agenda.controller.js';

import {
  getAllProfesionales,
  getProfesionalById,
  createProfesional,
  updateProfesional,
  deleteProfesional
} from "../controllers/profesional.controller.js";

const router = Router();
router.get('/', authenticate, patientProfessionals);
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN_SALITA"));

router.get("/", professionalScope, getAllProfesionales);
router.get("/:id", professionalScope, getProfesionalById);
router.post("/", professionalScope, createProfesional);
router.put("/:id", professionalScope, updateProfesional);
router.delete("/:id", professionalScope, deleteProfesional);

export default router;
