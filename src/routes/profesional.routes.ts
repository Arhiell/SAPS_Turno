import { Router } from "express";

import {
  getAllProfesionales,
  getProfesionalById,
  createProfesional,
  updateProfesional,
  deleteProfesional
} from "../controllers/profesional.controller.js";

const router = Router();

router.get("/", getAllProfesionales);
router.get("/:id", getProfesionalById);
router.post("/", createProfesional);
router.put("/:id", updateProfesional);
router.delete("/:id", deleteProfesional);

export default router;