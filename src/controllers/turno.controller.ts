import type { 
  RequestHandler 
} from "express";

import { 
  createTurnoSchema 
} from "../validators/turno.validator.js";

import { 
  createTurno 
} from "../services/turno.service.js";

// Los errores de Zod y AppError llegan al middleware global de Express 5.
export const createTurnoController: RequestHandler = async (req, res) => {
  const input = createTurnoSchema.parse(req.body);
  const turno = await createTurno(input, req.user!);
  res.status(201).json(
    { 
      success: true,
      message: "Turno creado", data: { turno } 
    }
  );
};
