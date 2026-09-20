import { Router } from "express";

import {
  actualizarHorarioController,
  crearHorarioController,
  eliminarHorarioController,
  obtenerHorario,
  obtenerHorarios,
} from "../controllers/horario-atencion.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"));

router.get("/", obtenerHorarios);
router.get("/:id", obtenerHorario);
router.post("/", crearHorarioController);
router.put("/:id", actualizarHorarioController);
router.delete("/:id", eliminarHorarioController);

export default router;