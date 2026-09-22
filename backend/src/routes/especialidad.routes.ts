import { Router } from "express";

import {
  getAllEspecialidades,
  getEspecialidadById,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad
} from "../controllers/especialidad.controller.js";

const router = Router();

router.get("/", getAllEspecialidades);
router.get("/:id", getEspecialidadById);
router.post("/", createEspecialidad);
router.put("/:id", updateEspecialidad);
router.delete("/:id", deleteEspecialidad);

export default router;