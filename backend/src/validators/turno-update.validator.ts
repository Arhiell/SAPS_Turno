import { z } from "zod";

import { 
  turnoFields 
} from "./turno.validator.js";

import { 
  turnoEstadoSchema 
} from "./turno-query.validator.js";

// No se cambia el paciente de un registro histórico ni se aceptan campos calculados.
const { 
  id_paciente: _patient, ...editable 
} = turnoFields;

export const updateTurnoSchema = z.object(editable).partial().strict()
  .refine(value => Object.values(value).some(
    item => item !== undefined
  ), 
  {
    message: "Debe enviar al menos un campo para actualizar"
  }
);

export const turnoStatusSchema = z.object({
  estado: turnoEstadoSchema,
  motivo_cancelacion: z.string().trim().min(1).max(2000).optional()
}).strict().refine(
  value => value.estado === "CANCELADO" || !value.motivo_cancelacion, {
    message: "El motivo de cancelación solo corresponde al estado CANCELADO"
});

export type UpdateTurnoInput = z.infer<typeof updateTurnoSchema>;
export type TurnoStatusInput = z.infer<typeof turnoStatusSchema>;
