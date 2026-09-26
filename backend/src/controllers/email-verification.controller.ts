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
  verifyEmailCode,
} from "../services/email-verification.service.js";



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

      const response: {
        success: boolean;
        message: string;
        verificationExpiresAt?: string | null;
        resendAvailableAt?: string | null;
      } = {
        success: true,
        message: "Si corresponde, te enviaremos un código de verificación.",
      };
      const result = await requestEmailVerification(validation.data, req.ip ?? null);
      response.verificationExpiresAt = result?.verificationExpiresAt ?? null;
      response.resendAvailableAt = result?.resendAvailableAt ?? null;


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

      if ("token" in validation.data) {
        await verifyUserEmail(validation.data);
      } else {
        await verifyEmailCode(validation.data);
      }

      return res.status(200).json({
        success: true,
        message: "Correo verificado correctamente.",
      });
    } catch (error) {
      next(error);
    }
};
