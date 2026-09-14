import {
  env
} from "../config/env.js";

import {
  createEmailVerificationToken,
  findEmailVerificationToken,
  findUserForEmailVerification,
  invalidatePreviousEmailTokens,
  markEmailAsVerified,
  markEmailTokenAsUsed
} from "../repositories/email-verification.repository.js";

import {
  generateEmailVerificationToken,
  hashEmailVerificationToken
} from "./email-verification-token.service.js";

import {
  AppError
} from "../utils/app-error.js";

import type {
  RequestEmailVerificationInput,
  VerifyEmailInput
} from "../validators/email-verification.validators.js";

// Genera un nuevo token para verificar email.
export const requestEmailVerification =
  async (
    input: RequestEmailVerificationInput,
    ip: string | null
  ) => {
    const email =
      input.email.trim().toLowerCase();

    const user =
      await findUserForEmailVerification(
        email
      );

    // No revelamos si el correo existe.
    if (
      !user ||
      !user.activo ||
      user.email_verificado
    ) {
      return null;
    }

    await invalidatePreviousEmailTokens(
      user.id_usuario
    );

    const token =
      generateEmailVerificationToken();

    const tokenHash =
      hashEmailVerificationToken(token);

    const expiration = new Date(
      Date.now() +
        env.EMAIL_VERIFICATION_HOURS *
          60 *
          60 *
          1000
    );

    await createEmailVerificationToken(
      user.id_usuario,
      tokenHash,
      expiration.toISOString(),
      ip
    );

   
    return token;
  };

// Confirma la dirección de correo.
export const verifyUserEmail = async (
  input: VerifyEmailInput
) => {
  const tokenHash =
    hashEmailVerificationToken(
      input.token
    );

  const verification =
    await findEmailVerificationToken(
      tokenHash
    );

  if (!verification) {
    throw new AppError(
      "Token de verificación inválido o utilizado",
      400
    );
  }

  if (
    new Date(
      verification.fecha_expiracion
    ) <= new Date()
  ) {
    throw new AppError(
      "El token de verificación ha expirado",
      400
    );
  }

  await markEmailAsVerified(
    verification.id_usuario
  );

  await markEmailTokenAsUsed(
    verification.id_token
  );
};