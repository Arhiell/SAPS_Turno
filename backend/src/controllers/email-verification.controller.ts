import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  requestEmailVerificationSchema,
  verifyEmailSchema,
} from "../validators/email-verification.validators.js";

import {
  requestEmailVerification,
  verifyUserEmail,
} from "../services/email-verification.service.js";

import { env } from "../config/env.js";

// Solicita verificación de correo.
export const requestVerification = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = requestEmailVerificationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Email inválido",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const token = await requestEmailVerification(validation.data, req.ip ?? null);

      const response: {
        success: boolean;
        message: string;
        verificationToken?: string;
      } = {
        success: true,
        message: "Si corresponde, se enviarán instrucciones para verificar el correo",
      };

      if (env.NODE_ENV === "development" && token) {
        response.verificationToken = token;
      }

      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
};

// Confirma la verificación.
export const verifyEmail = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = verifyEmailSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Token de verificación inválido",
        });
      }

      await verifyUserEmail(validation.data);

      return res.status(200).json({
        success: true,
        message: "Correo electrónico verificado correctamente",
      });
    } catch (error) {
      next(error);
    }
};
