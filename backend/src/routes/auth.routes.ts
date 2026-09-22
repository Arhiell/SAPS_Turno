import { Router } from "express";

import {
  login,
  logout,
  refresh,
  register
} from "../controllers/auth.controller.js";

const router = Router();

// Registro público.
router.post("/register", register);

// Inicio de sesión.
router.post("/login", login);

// Renovación de tokens.
router.post("/refresh", refresh);

// Cierre de sesión.
router.post("/logout", logout);

export default router;