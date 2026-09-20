import { Router } from "express";

import {
  actualizarBloqueoController,
  crearBloqueoController,
  eliminarBloqueoController,
  obtenerBloqueo,
  obtenerBloqueos,
} from "../controllers/bloqueo-agenda.controller.js";

const router = Router();

router.get("/", obtenerBloqueos);
router.get("/:id", obtenerBloqueo);
router.post("/", crearBloqueoController);
router.put("/:id", actualizarBloqueoController);
router.delete("/:id", eliminarBloqueoController);

export default router;