import { 
    Router 
} from "express";

import { 
    authenticate 
} from "../middlewares/auth.middleware.js";

import { 
    requireRole 
} from "../middlewares/role.middleware.js";

import { 
    createTurnoController 
} from "../controllers/turno.controller.js";

import { 
    listTurnosController, 
    getTurnoController 
} from "../controllers/turno-read.controller.js";

import { 
    updateTurnoController, 
    changeTurnoStatusController 
} from "../controllers/turno-update.controller.js";

const router = Router();
// Primera etapa administrativa; el servicio también restringe el 
// alcance por salita.
router.use(authenticate);
router.use(requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION", "PROFESIONAL", "PACIENTE"));
router.post("/", requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"), createTurnoController);
router.get("/", listTurnosController);
router.get("/:id", getTurnoController);
router.patch("/:id", requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"), updateTurnoController);
router.patch("/:id/status", requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION", "PROFESIONAL"), changeTurnoStatusController);
export default router;
