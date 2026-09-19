import { Router } from "express";

import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import passwordRecoveryRoutes from "./password-recovery.routes.js";
import emailVerificationRoutes
from "./email-verification.routes.js";
import especialidadRoutes from "./especialidad.routes.js";
import salitaRoutes from "./salita.routes.js";
import barrioRoutes from "./barrio.routes.js";
import zonaRoutes from "./zona.routes.js";
import googleAuthRoutes
  from "./google-auth.routes.js";

const router = Router();

// Estado general.
router.use("/health", healthRoutes);

// Módulo de usuarios.
router.use("/users", userRoutes);

// Registro, login, tokens, etc.
router.use("/auth", authRoutes);

// Recuperación de contraseña.
router.use("/auth/password", passwordRecoveryRoutes);

// Verificación de email
router.use("/auth/email", emailVerificationRoutes);

// Autenticación federada Google.
router.use("/auth/google", googleAuthRoutes);

// Especialidades
router.use("/especialidades", especialidadRoutes);

// Salitas
router.use("/salitas", salitaRoutes);

// Barrios
router.use("/barrios", barrioRoutes);

// Zonas
router.use("/zonas", zonaRoutes);



export default router;
