import {
  env
} from "../config/env.js";

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
  createPatientAccountSchema,
  createProfessionalAccountSchema
} from "../validators/user.validator.js";

import {
  createAdminAccount,
  createPatientAccount,
  createProfessionalAccount
} from "../services/user-management.service.js";

import {
  createAdminWithVerification
} from "../services/admin-onboarding.service.js";

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
    next(error);
  }
};

/**
 * Crea un ADMIN_SALITA y genera
 * automáticamente su verificación de email.
 */
export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation =
      createAdminSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Datos del administrador inválidos",
        errors: validation.error.flatten().fieldErrors
      });
    }

    const result =
      await createAdminWithVerification(
        validation.data,
        {
          ip: req.ip ?? null
        }
      );

    const response: {
      success: boolean;
      message: string;
      data: {
        user: typeof result.user;
        verificationToken?: string;
      };
    } = {
      success: true,
      message: "Administrador creado correctamente",
      data: {
        user: result.user
      }
    };

    if (env.NODE_ENV === "development") {
      response.data.verificationToken =
        result.verificationToken;
    }

    return res.status(201).json(response);
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
      createPatientAccountSchema.safeParse(req.body);

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
      message: "Cuenta de paciente creada correctamente",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una cuenta con rol PROFESIONAL.
 */
export const createProfessional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation =
      createProfessionalAccountSchema.safeParse(
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
      await createProfessionalAccount(
        validation.data
      );

    return res.status(201).json({
      success: true,
      message: "Cuenta de profesional creada correctamente",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};