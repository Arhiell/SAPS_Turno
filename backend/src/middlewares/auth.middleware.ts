import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  verifyAccessToken
} from "../services/jwt.service.js";

import {
  findUserById,
  findRoleById
} from "../repositories/user.repository.js";

import {
  AppError
} from "../utils/app-error.js";

/**
 * Comprueba el Bearer Token
 * y carga el usuario en req.user.
 */
export const authenticate = async (req: Request,
  _res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new AppError("Token de acceso requerido", 401);
      }

      const token = authorization.substring(7);

      const payload = await verifyAccessToken(token);

      if (!payload.sub) {
        throw new AppError("Token inválido", 401);
      }

      /**
       * No confiamos únicamente en el JWT.
       * Confirmamos que el usuario siga existiendo
       * y continúe activo.
       */
      const user = await findUserById(payload.sub);

      if (!user || !user.activo) {
        throw new AppError("Usuario no autorizado", 401);
      }

      const role = await findRoleById(user.id_rol);

      if (!role || !role.activo) {
        throw new AppError("Rol inválido", 403);
      }

      req.user = {
        id_usuario: user.id_usuario,
        email: user.email,
        nombre_usuario: user.nombre_usuario,
        rol: role.codigo,
      };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Token inválido o vencido", 401));
  }
};
