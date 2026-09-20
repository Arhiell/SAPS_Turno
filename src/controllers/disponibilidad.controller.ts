import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { obtenerDisponibilidad } from "../services/disponibilidad.service.js";

export const obtenerDisponibilidadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const disponibilidad = await obtenerDisponibilidad({
      fecha: String(req.query.fecha ?? ""),
      id_profesional: String(
        req.query.id_profesional ?? ""
      ),
      id_especialidad: String(
        req.query.id_especialidad ?? ""
      ),
      id_salita: String(
        req.query.id_salita ?? ""
      ),
    });

    return res.status(200).json(disponibilidad);
  } catch (error) {
    next(error);
  }
};