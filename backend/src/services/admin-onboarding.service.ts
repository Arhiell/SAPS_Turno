import { sendAuthEmail } from "./email.service.js";
import type {
  CreateAdminInput
} from "../validators/user.validator.js";

import {
  createAdminAccount
} from "./user-management.service.js";

import {
  createVerificationForUser
} from "./email-verification.service.js";

/**
 * Datos adicionales del alta administrativa.
 */
interface AdminOnboardingMetadata {
  ip: string | null;
}

/**
 * Coordina el alta completa de un ADMIN_SALITA.
 *
 * 1. Crea la cuenta.
 * 2. La relaciona con su salita.
 * 3. Genera token para verificar su email.
 */
export const createAdminWithVerification =
  async (
    input: CreateAdminInput,
    metadata: AdminOnboardingMetadata
  ) => {
    /**
     * createAdminAccount ya se encarga de:
     *
     * - comprobar duplicados
     * - buscar rol ADMIN_SALITA
     * - verificar salita
     * - crear password Argon2
     * - crear usuario
     * - relacionar usuario_salita
     */
    const user =
      await createAdminAccount(input);

    /**
     * El administrador recién creado
     * todavía tiene:
     *
     * email_verificado = false
     *
     * Por eso generamos su token.
     */
    const verificationToken =
      await createVerificationForUser(
        user.id_usuario,
        metadata.ip
      );

    await sendAuthEmail(input.email, "verificar-email", verificationToken);
    return {
      user,
      verificationToken
    };
  };