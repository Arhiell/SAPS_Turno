import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { professionalScope } from "../middlewares/profile-scope.middleware.js";
import { Router } from "express";

import {
  getSalitas,
  createSalita,
  updateSalita,
  deleteSalita
} from "../controllers/profesional-salita.controller.js";

const router = Router();
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN_SALITA"));

router.get(
  "/:id/salitas",
  professionalScope,
  getSalitas
);

router.post(
  "/:id/salitas",
  professionalScope,
  createSalita
);

router.put(
  "/:id/salitas/:idSalita",
  professionalScope,
  updateSalita
);

router.delete(
  "/:id/salitas/:idSalita",
  professionalScope,
  deleteSalita
);

export default router;