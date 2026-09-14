import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  checkUserModule
} from "../services/user.service.js";

import {
  createAdminSchema,
  createPatientAccountSchema
} from "../validators/user.validator.js";

import {
  createAdminAccount,
  createPatientAccount
} from "../services/user-management.service.js";

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

/**
 * Crea un Administrador de Salita.
 */
export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation =
      createAdminSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors:
          validation.error.flatten().fieldErrors
      });
    }

    const user =
      await createAdminAccount(
        validation.data
      );

    return res.status(201).json({
      success: true,
      message:
        "Administrador creado correctamente",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una cuenta con rol PACIENTE.
 */
export const createPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation =
      createPatientAccountSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors:
          validation.error.flatten().fieldErrors
      });
    }

    const user =
      await createPatientAccount(
        validation.data
      );

    return res.status(201).json({
      success: true,
      message:
        "Cuenta de paciente creada correctamente",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

