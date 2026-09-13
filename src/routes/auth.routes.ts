import { Router } from "express";

import {
  register
} from "../controllers/auth.controller.js";

const router = Router();

/**
 * Registro público de pacientes.
 */
router.post("/register", register);

export default router;