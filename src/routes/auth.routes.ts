import { Router } from "express";

import {
  login,
  register
} from "../controllers/auth.controller.js";

const router = Router();

// Registro público de pacientes
router.post("/register", register);

// Inicio de Sesion
router.post("/login", login);

export default router;