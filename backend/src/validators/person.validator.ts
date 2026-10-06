import { z } from 'zod';

import {
  dniPattern,
  namePattern,
  phonePattern,
  fieldMessages,
} from './field-rules.js';

// Valida nombres y apellidos.
export const personNameSchema = z
  .string()
  .trim()
  .min(
    2,
    'El nombre o apellido debe tener al menos 2 letras'
  )
  .max(100)
  .regex(
    namePattern,
    fieldMessages.name
  );

// Valida el nombre de un contacto.
export const contactNameSchema = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) =>
      value === '' ||
      namePattern.test(value),
    fieldMessages.name
  );

// Valida números de teléfono.
export const personPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) =>
      value === '' ||
      phonePattern.test(value),
    fieldMessages.phone
  );

// Valida direcciones de correo electrónico.
export const personEmailSchema = z
  .string()
  .trim()
  .email(
    'El correo electrónico no es válido'
  )
  .max(254);

// Valida el DNI de una persona.
export const personDniSchema = z
  .string()
  .regex(
    dniPattern,
    fieldMessages.dni
  );

// Valida los valores permitidos para el sexo.
export const personSexSchema = z.enum([
  'FEMENINO',
  'MASCULINO',
  'X',
  'NO_INFORMA',
]);

// Valida la fecha de nacimiento.
export const personBirthDateSchema = z
  .string()
  .date(
    'Ingresá una fecha de nacimiento válida (AAAA-MM-DD)'
  )
  .refine(
    (date) =>
      date <=
      new Date()
        .toISOString()
        .slice(0, 10),
    'La fecha de nacimiento no puede ser futura'
  );

// Valida direcciones con números, espacios y puntuación.
export const personAddressSchema = z
  .string()
  .trim()
  .min(
    3,
    'La dirección debe tener al menos 3 caracteres'
  )
  .max(
    250,
    'La dirección no puede superar 250 caracteres'
  );

// Valida los datos generales de una persona.
export const createPersonSchema = z
  .object({
    dni:
      personDniSchema,

    nombres:
      personNameSchema,

    apellidos:
      personNameSchema,

    fecha_nacimiento:
      personBirthDateSchema
        .nullable()
        .optional(),

    sexo:
      personSexSchema
        .nullable()
        .optional(),

    telefono:
      personPhoneSchema
        .nullable()
        .optional(),

    email:
      personEmailSchema
        .nullable()
        .optional(),

    direccion:
      personAddressSchema
        .nullable()
        .optional(),

    localidad: z
      .string()
      .trim()
      .max(120)
      .optional(),

    provincia: z
      .string()
      .trim()
      .max(120)
      .optional(),

    codigo_postal: z
      .string()
      .trim()
      .max(12)
      .nullable()
      .optional(),
  })
  .strict();

// Permite actualizar parcialmente los datos de una persona.
export const updatePersonSchema =
  createPersonSchema.partial();

// Tipo utilizado para crear una persona.
export type CreatePersonInput =
  z.infer<
    typeof createPersonSchema
  >;

// Tipo utilizado para actualizar una persona.
export type UpdatePersonInput =
  z.infer<
    typeof updatePersonSchema
  >;