import { 
  Router 
} from "express";

import { 
  authenticate 
} from '../middlewares/auth.middleware.js';

import { 
  requireRole 
} from '../middlewares/role.middleware.js';

import { 
  requestChange, 
  confirmChange 
} from '../controllers/email-change.controller.js';

import {
  requestVerification,
  verifyEmail
} from "../controllers/email-verification.controller.js";

const router = Router();
router.post('/change/request', authenticate, requireRole('PACIENTE'), requestChange);
router.post('/change/verify', authenticate, requireRole('PACIENTE'), confirmChange);

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
