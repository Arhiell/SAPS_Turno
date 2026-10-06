import { z } from 'zod';

import {
  usernamePattern,
  fieldMessages,
} from './field-rules.js';

// Valida los datos necesarios para registrar una cuenta nueva.
export const registerSchema = z.object({
  nombre_usuario: z
    .string()
    .trim()
    .min(
      3,
      'El nombre de usuario debe tener al menos 3 caracteres'
    )
    .max(
      60,
      'El nombre de usuario no puede superar 60 caracteres'
    )
    .regex(
      usernamePattern,
      fieldMessages.username
    )
    .optional(),

  email: z
    .string()
    .trim()
    .email(
      'El correo electrónico no es válido'
    )
    .max(
      254,
      'El correo electrónico es demasiado largo'
    ),

  password: z
    .string()
    .min(
      8,
      'La contraseña debe tener al menos 8 caracteres'
    )
    .max(
      128,
      'La contraseña es demasiado larga'
    )
    .regex(
      /[A-Z]/,
      'Debe contener al menos una letra mayúscula'
    )
    .regex(
      /[a-z]/,
      'Debe contener al menos una letra minúscula'
    )
    .regex(
      /[0-9]/,
      'Debe contener al menos un número'
    )
    .regex(
      /[^A-Za-z0-9]/,
      'Debe contener al menos un carácter especial'
    ),
});

// Obtiene el tipo a partir del esquema de registro.
export type RegisterInput =
  z.infer<typeof registerSchema>;

// Valida el inicio de sesión mediante email o nombre de usuario.
export const loginSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(3),

    password: z
      .string()
      .min(1),
  })
  .strict();

export type LoginInput =
  z.infer<typeof loginSchema>;

// Valida el refresh token utilizado para renovar o cerrar sesión.
export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(
        64,
        'Refresh token inválido'
      ),
  })
  .strict();