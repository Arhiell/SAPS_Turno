import type { Request, Response, NextFunction } from "express";

import {
  getEspecialidades
} from "../services/especialidad.service.js";

export const getAllEspecialidades = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const especialidades = await getEspecialidades();

    return res.status(200).json({
      success: true,
      data: especialidades
    });
  } catch (error) {
    next(error);
  }
};