import { sendSystemNotification } from
  "./notificacion.service.js";

import { findUsuarioByTurno } from
  "../repositories/notificacion-turno.repository.js";

type TipoNotificacionTurno =
  | "TURNO_CREADO"
  | "TURNO_REPROGRAMADO"
  | "TURNO_CANCELADO"
  | "CAMBIO_PROFESIONAL";

// Genera la notificación solo si el paciente posee una cuenta de usuario.
const notifyTurno = async (
  idTurno: string,
  tipo: TipoNotificacionTurno,
  titulo: string,
  mensaje: string,
) => {
  const idUsuario =
    await findUsuarioByTurno(idTurno);

  if (!idUsuario) {
    return null;
  }

  return sendSystemNotification({
    id_usuario: idUsuario,
    id_turno: idTurno,
    tipo,
    titulo,
    mensaje,
  });
};

export const notifyTurnoCreado = async (
  idTurno: string,
) => {
  return notifyTurno(
    idTurno,
    "TURNO_CREADO",
    "Turno confirmado",
    "Se registró correctamente un nuevo turno.",
  );
};

export const notifyTurnoReprogramado = async (
  idTurno: string,
) => {
  return notifyTurno(
    idTurno,
    "TURNO_REPROGRAMADO",
    "Turno reprogramado",
    "La fecha u horario de tu turno fue modificado.",
  );
};

export const notifyTurnoCancelado = async (
  idTurno: string,
) => {
  return notifyTurno(
    idTurno,
    "TURNO_CANCELADO",
    "Turno cancelado",
    "Tu turno fue cancelado.",
  );
};

export const notifyCambioProfesional = async (
  idTurno: string,
) => {
  return notifyTurno(
    idTurno,
    "CAMBIO_PROFESIONAL",
    "Cambio de profesional",
    "El profesional asignado a tu turno fue modificado.",
  );
};

const safeNotify = async (
  callback: () => Promise<unknown>,
) => {
  try {
    return await callback();
  } catch (error) {
    console.error(
      "No se pudo generar la notificación del turno:",
      error,
    );

    return null;
  }
};