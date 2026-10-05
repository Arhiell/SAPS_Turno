import {
  AppError
} from "../utils/app-error.js";

interface LoginAccessUser {
  activo: boolean;
  email_verificado: boolean;
  bloqueado_hasta: string | null;
}

interface LoginAccessOptions {
  allowUnverifiedEmail?: boolean;
}

/**
 * Comprueba las reglas generales que determinan si una cuenta puede
 * continuar con el proceso de autenticación.
 *
 * Cuando allowUnverifiedEmail=true se permite continuar hasta la
 * verificación mediante código, pero nunca se emite una sesión desde
 * esta función.
 */
export const validateLoginAccess = (
  user: LoginAccessUser,
  options: LoginAccessOptions = {},
) => {
  if (!user.activo) {
    throw new AppError(
      "La cuenta se encuentra deshabilitada",
      403,
    );
  }

  if (!options.allowUnverifiedEmail && !user.email_verificado) {
    throw new AppError(
      "Debe verificar su correo electrónico antes de iniciar sesión",
      403,
    );
  }

  if (
    user.bloqueado_hasta &&
    new Date(user.bloqueado_hasta) > new Date()
  ) {
    throw new AppError(
      "La cuenta se encuentra temporalmente bloqueada",
      423,
    );
  }
};