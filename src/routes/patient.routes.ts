import {
  Router
} from "express";

import {
  createPatientController
} from "../controllers/patient.controller.js";

import {
  authenticate
} from "../middlewares/auth.middleware.js";

import {
  requireRole
} from "../middlewares/role.middleware.js";

const router = Router();

/**
 * Administradores y recepción
 * pueden registrar pacientes.
 */
router.post(
  "/",
  authenticate,
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  createPatientController
);

export default router;