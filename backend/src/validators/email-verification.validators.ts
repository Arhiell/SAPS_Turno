import { z } from "zod";

// Solicitud de un correo de verificación.
export const requestEmailVerificationSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email("El correo no es válido")
      .max(254)
  }).strict();

// Confirmación mediante token.
export const verifyEmailSchema =
  z.union([
    z.object({
      token: z.string().length(64, "El token de verificación no es válido"),
    }).strict(),
    z.object({
      email: z.string().trim().email().max(254),
      code: z.string().regex(/^\d{4}$/, "El código debe tener 4 dígitos"),
    }).strict(),
  ]);

export const verifyEmailCodeSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{4}$/),
}).strict();

export type RequestEmailVerificationInput =
  z.infer<
    typeof requestEmailVerificationSchema
  >;

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;