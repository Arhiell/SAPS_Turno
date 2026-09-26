import { scheduleScope } from "../middlewares/profile-scope.middleware.js";
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import {
  obtenerDisponibilidadController,
} from "../controllers/disponibilidad.controller.js";

const router = Router();
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"));

router.get(
  "/", scheduleScope("disponibilidad"), obtenerDisponibilidadController
);

export default router;
