import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  registerSchema
} from "../validators/auth.validator.js";

import {
  registerUser
} from "../services/auth.service.js";

/**
 * POST /api/auth/register
 *
 * Registra una nueva cuenta de paciente.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    /**
     * Validamos el body antes de ejecutar
     * cualquier operación de base de datos.
     */
    const validation =
      registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Datos de registro inválidos",

        errors:
          validation.error.flatten().fieldErrors
      });
    }

    /**
     * El service se ocupa de las reglas
     * y creación del usuario.
     */
    const user = await registerUser(
      validation.data
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};