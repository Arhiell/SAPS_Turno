import { Router } from "express";

import { authenticate } from
  "../middlewares/auth.middleware.js";

import { requireRole } from
  "../middlewares/role.middleware.js";

import {
  getAuditoriasController,
  getAuditoriaByIdController,
} from "../controllers/auditoria.controller.js";

const router = Router();

// La auditoría es solo de consulta administrativa.
router.get(
  "/",
  authenticate,
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
  ),
  getAuditoriasController,
);

router.get(
  "/:id",
  authenticate,
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
  ),
  getAuditoriaByIdController,
);

export default router;