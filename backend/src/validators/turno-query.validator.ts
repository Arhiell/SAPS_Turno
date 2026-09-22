import { z } from "zod";

export const turnoIdSchema = z.object(
  { 
    id: z.string().uuid() 
  }
).strict();

// Los códigos son configurables: el servicio verifica que existan en estados_turno.
export const turnoEstadoSchema = z.string().regex(
  /^[A-Z][A-Z0-9_]*$/).max(40);

export const turnoQuerySchema = z.object({
  fecha: z.iso.date().optional(),
  id_profesional: z.string().uuid().optional(),
  id_paciente: z.string().uuid().optional(),
  id_salita: z.string().uuid().optional(),
  estado: turnoEstadoSchema.optional(),
  page: z.coerce.number().int().positive().max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

export type TurnoQuery = z.infer<typeof turnoQuerySchema>;
