import {
  Router
} from "express";

import {
  createTutorController
} from "../controllers/tutor.controller.js";

import {
  authenticate
} from "../middlewares/auth.middleware.js";

import {
  requireRole
} from "../middlewares/role.middleware.js";

const router = Router();

/**
 * Todas las rutas de tutores
 * requieren autenticación.
 */
router.use(authenticate);

/**
 * Registrar tutor.
 */
router.post(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "ADMIN_SALITA",
    "RECEPCION"
  ),
  createTutorController
);

export default router;