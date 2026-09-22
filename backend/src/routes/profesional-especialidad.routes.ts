import { Router } from "express";

import {
  getEspecialidades,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad
} from "../controllers/profesional-especialidad.controller.js";

const router = Router();

router.get(
  "/:id/especialidades",
  getEspecialidades
);

router.post(
  "/:id/especialidades",
  createEspecialidad
);

router.put(
  "/:id/especialidades/:idEspecialidad",
  updateEspecialidad
);

router.delete(
  "/:id/especialidades/:idEspecialidad",
  deleteEspecialidad
);

export default router;