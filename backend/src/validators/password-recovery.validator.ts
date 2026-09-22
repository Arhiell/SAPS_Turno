import { z } from "zod";

// Solicitud inicial de recuperación.
export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email(
        "El correo electrónico no es válido"
      )
      .max(254)
  })
  .strict();

// Cambio de contraseña mediante un recovery token válido.
export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(
        64,
        "El token de recuperación no es válido"
      ),

    newPassword: z
      .string()
      .min(
        8,
        "La contraseña debe tener al menos 8 caracteres"
      )
      .max(128)
      .regex(
        /[A-Z]/,
        "Debe contener una mayúscula"
      )
      .regex(
        /[a-z]/,
        "Debe contener una minúscula"
      )
      .regex(
        /[0-9]/,
        "Debe contener un número"
      )
      .regex(
        /[^A-Za-z0-9]/,
        "Debe contener un carácter especial"
      )
  })
  .strict();

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;