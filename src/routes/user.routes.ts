import { Router } from "express";

import {
  userHealthCheck
} from "../controllers/user.controller.js";

const router = Router();

/**
 * Comprueba que el módulo usuarios funcione.
 */
router.get("/health", userHealthCheck);

export default router;