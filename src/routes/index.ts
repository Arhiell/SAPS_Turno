import { Router } from "express";

import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

/**
 * Estado general.
 */
router.use("/health", healthRoutes);

/**
 * Módulo de usuarios.
 */
router.use("/users", userRoutes);

/**
 * Registro, login, tokens, etc.
 */
router.use("/auth", authRoutes);

export default router;