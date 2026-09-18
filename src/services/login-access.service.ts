
import {
  AppError
} from "../utils/app-error.js";

/**
 * Datos mínimos necesarios para decidir
 * si una cuenta puede iniciar sesión.
 */
interface LoginAccessUser {
  activo: boolean;
  email_verificado: boolean;
  bloqueado_hasta: string | null;
}

/**
 * Comprueba reglas generales de acceso.
 *
 * Esta función NO verifica contraseña.
 * Solamente determina si la cuenta
 * puede continuar con el login.
 */
export const validateLoginAccess = (
  user: LoginAccessUser
) => {
  /**
   * Una cuenta desactivada no puede acceder.
   */
  if (!user.activo) {
    throw new AppError(
      "La cuenta se encuentra deshabilitada",
      403
    );
  }

  /**
   * El usuario debe confirmar primero
   * que realmente controla ese email.
   */
  if (!user.email_verificado) {
    throw new AppError(
      "Debe verificar su correo electrónico antes de iniciar sesión",
      403
    );
  }

  /**
   * Si todavía existe un bloqueo vigente,
   * tampoco permitimos continuar.
   */
  if (
    user.bloqueado_hasta &&
    new Date(user.bloqueado_hasta) >
      new Date()
  ) {
    throw new AppError(
      "La cuenta se encuentra temporalmente bloqueada",
      423
    );
  }
};