import { Router } from "express";

import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import passwordRecoveryRoutes from "./password-recovery.routes.js";

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

// Recuperación de contraseña.
router.use("/auth/password", passwordRecoveryRoutes);

export default router;
