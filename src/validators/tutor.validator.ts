import { z } from "zod";
import { createPersonSchema } from "./person.validator.js";

export const createTutorSchema = createPersonSchema.pick({
  dni: true, nombres: true, apellidos: true, email: true, direccion: true
}).extend({
  telefono: z.string().trim().min(6, "El teléfono es demasiado corto").max(30)
}).strict();

export type CreateTutorInput = z.infer<typeof createTutorSchema>;