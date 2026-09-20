import { Router } from "express";

import {
  obtenerDisponibilidadController,
} from "../controllers/disponibilidad.controller.js";

const router = Router();

router.get(
  "/",
  obtenerDisponibilidadController
);

export default router;