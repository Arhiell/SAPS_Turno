import { Router } from "express";

import {
  createAdmin,
  createPatient,
  userHealthCheck
} from "../controllers/user.controller.js";

import {
  authenticate
} from "../middlewares/auth.middleware.js";

import {
  requireRole
} from "../middlewares/role.middlewares.js";

const router = Router();

/**
 * Diagnóstico del módulo.
 */
router.get(
  "/health",
  userHealthCheck
);

/**
 * Solo SUPER_ADMIN puede crear
 * administradores de salita.
 */
router.post(
  "/admins",
  authenticate,
  requireRole("SUPER_ADMIN"),
  createAdmin
);

/**
 * SUPER_ADMIN y ADMIN_SALITA
 * pueden crear pacientes.
 */
router.post(
  "/patients",
  authenticate,
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA"
  ),
  createPatient
);

export default router;