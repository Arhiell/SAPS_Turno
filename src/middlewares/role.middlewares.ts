import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  AppError
} from "../utils/app-error.js";

// Solo permite los roles indicados
export const requireRole = (...allowedRoles: string[]) => {
  return (req:
    Request,
    _res: Response,
    next: NextFunction) => {
       if (!req.user) {
        return next(new AppError("Usuario no autenticado", 401));
      }
      if (!allowedRoles.includes(req.user.rol)) {
        return next(
          new AppError("No tienes permisos para realizar esta acción", 403));
    }
    next();
  };
};
