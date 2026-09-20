import { Router } from "express";

import {
  actualizarHorarioController,
  crearHorarioController,
  eliminarHorarioController,
  obtenerHorario,
  obtenerHorarios,
} from "../controllers/horario-atencion.controller.js";

const router = Router();

router.get("/", obtenerHorarios);
router.get("/:id", obtenerHorario);
router.post("/", crearHorarioController);
router.put("/:id", actualizarHorarioController);
router.delete("/:id", eliminarHorarioController);

export default router;