import { Router } from "express";

import {
  getAllSalitas,
  getSalitaById,
  createSalita,
  updateSalita,
  deleteSalita
} from "../controllers/salita.controller.js";

const router = Router();

router.get("/", getAllSalitas);
router.get("/:id", getSalitaById);
router.post("/", createSalita);
router.put("/:id", updateSalita);
router.delete("/:id", deleteSalita);

export default router;