import { z } from "zod";

export const personDniSchema = z.string().regex(
  /^[0-9]{7,15}$/, "El DNI debe contener entre 7 y 15 números"
);
export const personSexSchema = z.enum(["FEMENINO", "MASCULINO", "X", "NO_INFORMA"]);
export const personBirthDateSchema = z.string().date().refine(
  (date) => date <= new Date().toISOString().slice(0, 10),
  "La fecha de nacimiento no puede ser futura"
);
export const personAddressSchema = z.string().trim().min(3).max(250);

// Los requisitos adicionales de cada perfil se definen en su propio validator.
export const createPersonSchema = z.object({
  dni: personDniSchema,
  nombres: z.string().trim().min(2).max(100),
  apellidos: z.string().trim().min(2).max(100),
  fecha_nacimiento: personBirthDateSchema.nullable().optional(),
  sexo: personSexSchema.nullable().optional(),
  telefono: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  direccion: personAddressSchema.nullable().optional(),
  localidad: z.string().trim().max(120).optional(),
  provincia: z.string().trim().max(120).optional(),
  codigo_postal: z.string().trim().max(12).nullable().optional()
}).strict();

export const updatePersonSchema = createPersonSchema.partial();
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;