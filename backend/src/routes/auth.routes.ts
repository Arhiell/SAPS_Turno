import { 
  Router 
} from "express";

import { 
  authenticate 
} from "../middlewares/auth.middleware.js";

import { 
  requireRole 
} from "../middlewares/role.middleware.js";

import { 
  ownProfile, 
  completeProfile 
} from "../controllers/auth-profile.controller.js";

import {
  login,
  logout,
  refresh,
  register
} from "../controllers/auth.controller.js";

const router = Router();
router.get("/me", authenticate, ownProfile);
router.post(
  "/profile", 
  authenticate, 
  requireRole("PACIENTE"), 
  completeProfile
);

// Registro público.
router.post("/register", register);

// Inicio de sesión.
router.post("/login", login);

// Renovación de tokens.
router.post("/refresh", refresh);

// Cierre de sesión.
router.post("/logout", logout);

export default router;
