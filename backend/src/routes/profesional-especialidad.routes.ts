import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { professionalScope } from "../middlewares/profile-scope.middleware.js";
import { Router } from "express";

import {
  getEspecialidades,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad
} from "../controllers/profesional-especialidad.controller.js";

const router = Router();
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN_SALITA"));

router.get(
  "/:id/especialidades",
  professionalScope,
  getEspecialidades
);

router.post(
  "/:id/especialidades",
  professionalScope,
  createEspecialidad
);

router.put(
  "/:id/especialidades/:idEspecialidad",
  professionalScope,
  updateEspecialidad
);

router.delete(
  "/:id/especialidades/:idEspecialidad",
  professionalScope,
  deleteEspecialidad
);

export default router;