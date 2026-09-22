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
router.use(requireRole("SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION"));
router.post("/", createTurnoController);
router.get("/", listTurnosController);
router.get("/:id", getTurnoController);
router.patch("/:id", updateTurnoController);
router.patch("/:id/status", changeTurnoStatusController);
export default router;
