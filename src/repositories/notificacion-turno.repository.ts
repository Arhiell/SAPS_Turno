import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

// Busca el usuario asociado al paciente dueño del turno.
export const findUsuarioByTurno = async (
  idTurno: string,
) => {
  const { data: turno, error: turnoError } = await supabase
    .from("turnos")
    .select(`
      id_turno,
      id_paciente,
      pacientes!inner (
        id_persona
      )
    `)
    .eq("id_turno", idTurno)
    .maybeSingle();

  if (turnoError) {
    throw new AppError(
      "No se pudo obtener el paciente del turno",
      500,
    );
  }

  if (!turno) {
    return null;
  }

  const paciente = Array.isArray(turno.pacientes)
    ? turno.pacientes[0]
    : turno.pacientes;

  if (!paciente?.id_persona) {
    return null;
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id_usuario")
    .eq("id_persona", paciente.id_persona)
    .eq("activo", true)
    .maybeSingle();

  if (usuarioError) {
    throw new AppError(
      "No se pudo obtener el usuario del paciente",
      500,
    );
  }

  return usuario?.id_usuario ?? null;
};