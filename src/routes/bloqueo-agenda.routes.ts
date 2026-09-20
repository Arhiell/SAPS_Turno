import { Router } from "express";

import {
  actualizarBloqueoController,
  crearBloqueoController,
  eliminarBloqueoController,
  obtenerBloqueo,
  obtenerBloqueos,
} from "../controllers/bloqueo-agenda.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"));

router.get("/", obtenerBloqueos);
router.get("/:id", obtenerBloqueo);
router.post("/", crearBloqueoController);
router.put("/:id", actualizarBloqueoController);
router.delete("/:id", eliminarBloqueoController);

export default router;