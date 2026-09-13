import { z } from "zod";

/**
 * Valida los datos necesarios para registrar
 * una cuenta nueva.
 */
export const registerSchema = z.object({
  nombre_usuario: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(60, "El nombre de usuario no puede superar 60 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "El usuario solo puede contener letras, números, punto, guion y guion bajo"
    ),

  email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .max(254, "El correo electrónico es demasiado largo"),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(
      /[^A-Za-z0-9]/,
      "Debe contener al menos un carácter especial"
    )
});

/**
 * TypeScript obtiene automáticamente el tipo
 * a partir del esquema de Zod.
 */
export type RegisterInput = z.infer<typeof registerSchema>;