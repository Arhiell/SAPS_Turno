import { Router } from "express";

import {
  getAllEspecialidades
} from "../controllers/especialidad.controller.js";

const router = Router();

router.get("/", getAllEspecialidades);

export default router;