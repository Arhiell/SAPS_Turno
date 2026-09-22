import { Router } from "express";

import {
  requestVerification,
  verifyEmail
} from "../controllers/email-verification.controller.js";

const router = Router();

// Solicita token de verificación.
router.post(
  "/request",
  requestVerification
);

// Confirma el correo.
router.post(
  "/verify",
  verifyEmail
);

export default router;