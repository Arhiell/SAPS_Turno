import {
  env
} from "../config/env.js";
import { sendAuthEmail } from "./email.service.js";
import { sendEmailVerificationCode } from "./email.service.js";

import {
  createEmailVerificationToken,
  findEmailVerificationToken,
  findLatestPendingEmailToken,
  findUserForEmailVerification,
  invalidatePreviousEmailTokens,
  markEmailAsVerified,
  markEmailTokenAsUsed,
  registerEmailCodeAttempt
} from "../repositories/email-verification.repository.js";

import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
  generateEmailVerificationCode,
  hashEmailVerificationCode
} from "./email-verification-token.service.js";
import { timingSafeEqual } from "node:crypto";

import {
  AppError
} from "../utils/app-error.js";

import type {
  RequestEmailVerificationInput,
  VerifyEmailInput,
  VerifyEmailCodeInput
} from "../validators/email-verification.validators.js";

const EMAIL_CODE_TTL_SECONDS = 10 * 60;
const EMAIL_CODE_RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

const createEmailCode = async (
  idUsuario: string,
  email: string,
  ip: string | null
) => {
  // Invalida el código anterior antes de emitir uno nuevo.
  await invalidatePreviousEmailTokens(idUsuario);

  const code = generateEmailVerificationCode();
  const codeHash = hashEmailVerificationCode(idUsuario, code);
  const expiresAt = new Date(Date.now() + EMAIL_CODE_TTL_SECONDS * 1000);

  await createEmailVerificationToken(
    idUsuario,
    codeHash,
    expiresAt.toISOString(),
    ip
  );

  try {
    await sendEmailVerificationCode(email, code);
  } catch {
    await invalidatePreviousEmailTokens(idUsuario);
    throw new AppError("No pudimos enviar el código. Volvé a intentarlo.", 503);
  }

  return expiresAt.toISOString();
};

export const createVerificationCodeForNewUser = async (
  idUsuario: string,
  email: string,
  ip: string | null
) => createEmailCode(idUsuario, email, ip);

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
    if (!user || !user.activo || user.email_verificado) {
      return null;
    }

    const pending = await findLatestPendingEmailToken(user.id_usuario);
    const now = Date.now();
    if (pending && new Date(pending.fecha_expiracion).getTime() > now) {
      const resendAvailableAt = new Date(
        new Date(pending.fecha_creacion).getTime() +
          EMAIL_CODE_RESEND_COOLDOWN_SECONDS * 1000
      );
      if (now < resendAvailableAt.getTime()) {
        return {
          verificationExpiresAt: pending.fecha_expiracion,
          resendAvailableAt: resendAvailableAt.toISOString(),
        };
      }
    }

    const verificationExpiresAt = await createEmailCode(user.id_usuario, email, ip);
    return {
      verificationExpiresAt,
      resendAvailableAt: new Date(
        Date.parse(verificationExpiresAt) -
          EMAIL_CODE_TTL_SECONDS * 1000 +
          EMAIL_CODE_RESEND_COOLDOWN_SECONDS * 1000
      ).toISOString(),
    };
  };

// Confirma la dirección de correo.
export const verifyUserEmail = async (
  input: Extract<VerifyEmailInput, { token: string }>
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

  // Consume el token primero para impedir reutilización concurrente.
  const consumed = await markEmailTokenAsUsed(verification.id_token);
  if (!consumed) {
    throw new AppError(
      "Token de verificación inválido o utilizado",
      400
    );
  }

  await markEmailAsVerified(
    verification.id_usuario
  );
};

export const verifyEmailCode = async (input: VerifyEmailCodeInput) => {
  const email = input.email.trim().toLowerCase();
  const user = await findUserForEmailVerification(email);
  if (!user || !user.activo || user.email_verificado) {
    throw new AppError("Código incorrecto.", 400);
  }

  const pending = await findLatestPendingEmailToken(user.id_usuario);
  if (!pending) {
    throw new AppError("Código incorrecto.", 400);
  }
  if (new Date(pending.fecha_expiracion) <= new Date()) {
    throw new AppError("El código expiró. Solicitá uno nuevo.", 400);
  }

  const attempts = pending.intentos ?? 0;
  if (attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
    throw new AppError("Superaste los intentos. Solicitá un nuevo código.", 429);
  }

  const submittedHash = Buffer.from(
    hashEmailVerificationCode(user.id_usuario, input.code),
    "hex"
  );
  const storedHash = Buffer.from(pending.token_hash, "hex");
  const valid = timingSafeEqual(storedHash, submittedHash);

  if (!valid) {
    const nextAttempts = attempts + 1;
    await registerEmailCodeAttempt(
      pending.id_token,
      nextAttempts,
      nextAttempts >= EMAIL_CODE_MAX_ATTEMPTS
    );
    if (nextAttempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      throw new AppError("Superaste los intentos. Solicitá un nuevo código.", 429);
    }
    throw new AppError("Código incorrecto.", 400);
  }

  const consumed = await markEmailTokenAsUsed(pending.id_token);
  if (!consumed) {
    throw new AppError("Código incorrecto.", 400);
  }
  await markEmailAsVerified(user.id_usuario);
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
