import {
  env
} from "../config/env.js";
import { sendAuthEmail } from "./email.service.js";

import {
  createPasswordRecoveryToken,
  findPasswordRecoveryToken,
  findRecoveryUserByEmail,
  invalidatePreviousRecoveryTokens,
  markRecoveryTokenAsUsed,
  updateRecoveredPassword
} from "../repositories/password-recovery.repository.js";

import {
  revokeAllUserRefreshSessions
} from "../repositories/sesion.repository.js";

import {
  generateRecoveryToken,
  hashRecoveryToken
} from "./recovery-token.service.js";

import {
  hashPassword
} from "./password.service.js";

import {
  AppError
} from "../utils/app-error.js";

import type {
  ForgotPasswordInput,
  ResetPasswordInput
} from "../validators/password-recovery.validator.js";

interface RecoveryMetadata {
  ip: string | null;
}

// Genera una solicitud para recuperar una contraseña.
export const requestPasswordRecovery =
  async (
    input: ForgotPasswordInput,
    metadata: RecoveryMetadata
  ) => {
    const email =
      input.email.trim().toLowerCase();

    const user =
      await findRecoveryUserByEmail(email);

    /**
     * IMPORTANTE:
     * si el email no existe no devolvemos error.
     * Evita revelar qué correos existen
     * en nuestro sistema.
     */
    if (!user || !user.activo) {
      return null;
    }

    /**
     * Invalidamos cualquier recovery token
     * anterior que todavía estuviera activo.
     */
    await invalidatePreviousRecoveryTokens(
      user.id_usuario
    );

    const recoveryToken =
      generateRecoveryToken();

    const tokenHash =
      hashRecoveryToken(recoveryToken);

    const expiration =
      new Date(
        Date.now() +
          env.PASSWORD_RECOVERY_MINUTES *
            60 *
            1000
      );

    await createPasswordRecoveryToken(
      user.id_usuario,
      tokenHash,
      expiration.toISOString(),
      metadata.ip
    );

    /**
     * En producción este token será enviado
     * mediante email.
     */
    // La respuesta pública no cambia si el proveedor de correo falla.
    await sendAuthEmail(email, "restablecer-contrasena", recoveryToken).catch(() => {
      console.error("No se pudo enviar el correo de recuperación");
    });
    return recoveryToken;
  };

/**
 * Cambia la contraseña utilizando
 * un recovery token válido.
 */
export const resetPassword = async (
  input: ResetPasswordInput
) => {
  const tokenHash =
    hashRecoveryToken(input.token);

  const recovery =
    await findPasswordRecoveryToken(
      tokenHash
    );

  if (!recovery) {
    throw new AppError(
      "Token de recuperación inválido o utilizado",
      400
    );
  }

  //Comprobamos que no haya vencido.
  if (
    new Date(recovery.fecha_expiracion) <=
    new Date()
  ) {
    throw new AppError(
      "El token de recuperación ha expirado",
      400
    );
  }

  // La nueva contraseña se transforma nuevamente mediante Argon2.
  const newPasswordHash =
    await hashPassword(
      input.newPassword
    );

  await updateRecoveredPassword(
    recovery.id_usuario,
    newPasswordHash
  );

  /**
   * El recovery token solamente puede
   * utilizarse una vez.
   */
  await markRecoveryTokenAsUsed(
    recovery.id_token
  );

  /**
   * Como medida de seguridad cerramos
   * todas las sesiones anteriores.
   */
  await revokeAllUserRefreshSessions(
    recovery.id_usuario
  );
};
