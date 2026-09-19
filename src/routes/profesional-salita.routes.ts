import { Router } from "express";

import {
  getSalitas,
  createSalita,
  updateSalita,
  deleteSalita
} from "../controllers/profesional-salita.controller.js";

const router = Router();

router.get(
  "/:id/salitas",
  getSalitas
);

router.post(
  "/:id/salitas",
  createSalita
);

router.put(
  "/:id/salitas/:idSalita",
  updateSalita
);

router.delete(
  "/:id/salitas/:idSalita",
  deleteSalita
);

export default router;