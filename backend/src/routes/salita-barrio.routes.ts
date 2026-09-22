import { Router } from "express";

import {
  getAllSalitaBarrios,
  getBarriosBySalita,
  getSalitasByBarrio,
  createSalitaBarrio,
  updateSalitaBarrio,
  deleteSalitaBarrio
} from "../controllers/salita-barrio.controller.js";

const router = Router();

router.get("/", getAllSalitaBarrios);
router.get("/salita/:id", getBarriosBySalita);
router.get("/barrio/:id", getSalitasByBarrio);
router.post("/", createSalitaBarrio);
router.put("/:idSalita/:idBarrio", updateSalitaBarrio);
router.delete("/:idSalita/:idBarrio", deleteSalitaBarrio);

export default router;