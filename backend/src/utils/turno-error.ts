import { 
  AppError 
} from "./app-error.js";
import { 
  hasDatabaseCode 
} from "./profile-error.js";

// Traduce solamente los errores conocidos de los triggers de Turnos.
const triggerErrors: Record<string, number> = {
  "El estado del turno no existe o esta inactivo": 400,
  "El horario seleccionado no existe o esta inactivo": 400,
  "El turno no coincide con el profesional, especialidad o salita del horario": 400,
  "El turno esta fuera de la vigencia o franja del horario": 400,
  "La duracion del turno no coincide con el horario configurado": 400,
  "La hora de inicio no coincide con un bloque valido de la agenda": 400,
  "Se alcanzo el cupo maximo diario del horario": 409,
  "El profesional no esta habilitado para esa especialidad o salita": 400,
  "La agenda esta bloqueada para la fecha y horario solicitados": 409,
  "El paciente posee una restriccion vigente para esta especialidad": 409
};

export const rethrowTurnoError = (error: unknown): never => {
  const message = typeof error === "object" && error !== null && "message" in error
    ? String(error.message) : "";

  if (hasDatabaseCode(error, "P0001") && triggerErrors[message]) {
    throw new AppError(
      message, 
      triggerErrors[message]
    );
  }

  if (hasDatabaseCode(error, "23P01")) {
    throw new AppError(message.includes("paciente")
      ? "El paciente ya posee un turno en ese horario"
      : "El profesional ya posee un turno asignado en ese horario", 409);
  }

  if (hasDatabaseCode(error, "23505")) {
    throw new AppError(
      "Ya existe un turno abierto para el paciente y la especialidad o un código duplicado",
      409
    );
  }
  
  // El middleware de Leo conserva el manejo de FK, CHECK y fallos inesperados.
  throw error;
};
