import type { 
  RequestHandler 
} from "express";

import { 
  createTurnoSchema 
} from "../validators/turno.validator.js";

import { 
  createTurno 
} from "../services/turno.service.js";
import { getOwnEntity } from '../services/auth-profile.service.js';

// Los errores de Zod y AppError llegan al middleware global de Express 5.
export const createTurnoController: RequestHandler = async (req, res) => {
  const body = req.user!.rol === 'PACIENTE'
    ? { ...createTurnoSchema.omit({ id_paciente: true, observaciones: true }).parse(req.body),
        id_paciente: (await getOwnEntity(req.user!)).id }
    : req.body;
  const input = createTurnoSchema.parse(body);
  const turno = await createTurno(input, req.user!);
  res.status(201).json(
    { 
      success: true,
      message: "Turno creado", data: { turno } 
    }
  );
};
