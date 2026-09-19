import { z } from "zod";
import {
  createPersonSchema, personAddressSchema, personBirthDateSchema, personSexSchema
} from "./person.validator.js";

export const patientProfileSchema = z.object({
  id_barrio: z.string().uuid("id_barrio no es válido"),
  id_salita_asignada: z.string().uuid("id_salita_asignada no es válido"),
  obra_social: z.string().trim().max(150).nullable().optional(),
  numero_afiliado: z.string().trim().max(80).nullable().optional(),
  contacto_emergencia_nombre: z.string().trim().max(200).nullable().optional(),
  contacto_emergencia_telefono: z.string().trim().max(30).nullable().optional()
}).strict();

export const createPatientSchema = createPersonSchema.extend({
  ...patientProfileSchema.shape,
  fecha_nacimiento: personBirthDateSchema,
  sexo: personSexSchema,
  direccion: personAddressSchema
}).strict();

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientProfileSchema = patientProfileSchema.partial();
export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;