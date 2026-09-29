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

export const newPasswordSchema = z
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
  );

// Mantiene vigentes los enlaces emitidos antes del cambio al código.
export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(
        64,
        "El token de recuperación no es válido"
      )
      .optional(),

    email: z.string().trim().email().max(254).optional(),
    code: z.string().regex(/^\d{4}$/, "El código debe tener 4 dígitos").optional(),
    newPassword: newPasswordSchema,
  })
  .strict()
  .refine(
    ({ token, email, code }) =>
      (Boolean(token) && !email && !code) ||
      (!token && Boolean(email) && Boolean(code)),
    {
      message: "Ingresá un token válido o el correo y código de recuperación.",
      path: ["code"],
    }
  );

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;