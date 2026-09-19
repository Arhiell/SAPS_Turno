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

/**
 * Genera un token de verificación directamente
 * para un usuario recién creado.
 *
 * Se utiliza durante el registro.
 */
export const createVerificationForUser = async (
  idUsuario: string,
  ip: string | null
) => {
  /**
   * Invalidamos cualquier token anterior
   * pendiente para ese mismo usuario.
   */
  await invalidatePreviousEmailTokens(
    idUsuario
  );

  /// Generamos el token original.
   
  const token =
    generateEmailVerificationToken();

  //    Solo almacenaremos su hash.
  const tokenHash =
    hashEmailVerificationToken(token);

  // Calculamos cuándo vence.
  const expiration = new Date(
    Date.now() +
      env.EMAIL_VERIFICATION_HOURS *
        60 *
        60 *
        1000
  );

  await createEmailVerificationToken(
    idUsuario,
    tokenHash,
    expiration.toISOString(),
    ip
  );

  // Devolvemos el token original. Nunca está almacenado en la DB.
  return token;
};

/**
 * Genera directamente un token de verificación
 * para un usuario que acaba de registrarse.
 *
 * En este caso ya conocemos el id_usuario,
 * por lo que no necesitamos volver a buscar
 * el usuario mediante email.
 */
export const createVerificationForNewUser =
  async (
    idUsuario: string,
    ip: string | null
  ) => {
    /**
     * Invalidamos cualquier token anterior.
     *
     * Normalmente un usuario recién creado
     * no tendrá ninguno, pero mantenemos
     * una única regla de seguridad.
     */
    await invalidatePreviousEmailTokens(
      idUsuario
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

    /**
     * En PostgreSQL almacenamos solamente
     * el hash del token original.
     */
    await createEmailVerificationToken(
      idUsuario,
      tokenHash,
      expiration.toISOString(),
      ip
    );

    return token;
  };