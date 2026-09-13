import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  checkUserModule
} from "../services/user.service.js";

/**
 * GET /api/users/health
 *
 * Comprueba que el módulo usuarios
 * tenga acceso correcto a Supabase.
 */
export const userHealthCheck = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await checkUserModule();

    return res.status(200).json({
      success: true,
      message: "Módulo de usuarios conectado correctamente",
      data: result
    });
  } catch (error) {
    // El middleware global se encargará del error.
    next(error);
  }
};