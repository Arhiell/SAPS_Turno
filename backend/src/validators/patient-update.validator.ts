import { z } from "zod";
import { createPatientSchema } from "./patient.validator.js";

export const updatePatientSchema = createPatientSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Debe enviar al menos un campo para actualizar" }
);

export const patientStatusSchema = z.object({ activo: z.boolean() }).strict();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientStatusInput = z.infer<typeof patientStatusSchema>;