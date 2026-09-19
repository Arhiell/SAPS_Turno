import { Router } from "express";

import {
  getAllZonas,
  getZonaById,
  createZona,
  updateZona,
  deleteZona
} from "../controllers/zona.controller.js";

const router = Router();

router.get("/", getAllZonas);
router.get("/:id", getZonaById);
router.post("/", createZona);
router.put("/:id", updateZona);
router.delete("/:id", deleteZona);

export default router;