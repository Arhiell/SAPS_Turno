import { sendSystemNotification } from
  "./notificacion.service.js";

import { sendEmail } from
  "./email.service.js";

import {
  findUsuarioByTurno,
  findTurnoEmailContextById,
} from "../repositories/notificacion-turno.repository.js";

import {
  buildTurnoCreadoEmail,
  buildTurnoReprogramadoEmail,
  buildTurnoCanceladoEmail,
  buildCambioProfesionalEmail,
} from "./turno-email-template.service.js";

import {
  agendaDateTime,
} from "../utils/turno-time.js";

type TipoNotificacionTurno =
  | "TURNO_CREADO"
  | "TURNO_REPROGRAMADO"
  | "TURNO_CANCELADO"
  | "CAMBIO_PROFESIONAL";

  const firstRelation = <T>(
  value: T | T[] | null | undefined,
): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const formatTurnoDateTime = (
  instant: string,
) => {
  const { date, time } = agendaDateTime(instant);

  const [year, month, day] = date.split("-");

  return {
    fecha: `${day}/${month}/${year}`,
    hora: time.slice(0, 5),
  };
};

const sendTurnoEmail = async (
  idTurno: string,
  tipo: TipoNotificacionTurno,
) => {
  const context =
    await findTurnoEmailContextById(idTurno);

  if (!context) {
    return null;
  }

  const paciente =
    firstRelation(context.paciente);

  const personaPaciente =
    firstRelation(paciente?.persona);

  if (!personaPaciente?.email) {
    return null;
  }

  const profesional =
    firstRelation(context.profesional);

  const personaProfesional =
    firstRelation(profesional?.persona);

  const especialidad =
    firstRelation(context.especialidad);

  const salita =
    firstRelation(context.salita);

  const { fecha, hora } =
    formatTurnoDateTime(
      context.fecha_hora_inicio,
    );

  const pacienteNombre = [
    personaPaciente.nombres,
    personaPaciente.apellidos,
  ]
    .filter(Boolean)
    .join(" ");

  const profesionalNombre = [
    personaProfesional?.nombres,
    personaProfesional?.apellidos,
  ]
    .filter(Boolean)
    .join(" ");

  const emailData = {
    pacienteNombre:
      pacienteNombre || "Paciente",

    codigoTurno:
      context.codigo_turno,

    fecha,
    hora,

    profesional:
      profesionalNombre ||
      "Profesional a confirmar",

    especialidad:
      especialidad?.nombre ||
      "Sin especificar",

    salita:
      salita?.nombre ||
      "Sin especificar",

    zona:
      context.zona?.nombre ?? null,

    direccion:
      salita?.direccion ?? null,

    telefono:
      salita?.telefono ?? null,
  };

  let email;

  switch (tipo) {
    case "TURNO_CREADO":
      email =
        buildTurnoCreadoEmail(emailData);
      break;

    case "TURNO_REPROGRAMADO":
      email =
        buildTurnoReprogramadoEmail(
          emailData,
        );
      break;

    case "TURNO_CANCELADO":
      email =
        buildTurnoCanceladoEmail(
          emailData,
        );
      break;

    case "CAMBIO_PROFESIONAL":
      email =
        buildCambioProfesionalEmail(
          emailData,
        );
      break;
  }

  return sendEmail({
    to: personaPaciente.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

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
  const [systemNotification] = await Promise.all([
    safeNotify(() =>
      notifyTurno(
        idTurno,
        "TURNO_CREADO",
        "Turno confirmado",
        "Se registró correctamente un nuevo turno.",
      ),
    ),

    safeNotify(() =>
      sendTurnoEmail(
        idTurno,
        "TURNO_CREADO",
      ),
    ),
  ]);

  return systemNotification;
};

export const notifyTurnoReprogramado = async (
  idTurno: string,
) => {
  const [systemNotification] = await Promise.all([
    safeNotify(() =>
      notifyTurno(
        idTurno,
        "TURNO_REPROGRAMADO",
        "Turno reprogramado",
        "La fecha u horario de tu turno fue modificado.",
      ),
    ),

    safeNotify(() =>
      sendTurnoEmail(
        idTurno,
        "TURNO_REPROGRAMADO",
      ),
    ),
  ]);

  return systemNotification;
};

export const notifyTurnoCancelado = async (
  idTurno: string,
) => {
  const [systemNotification] = await Promise.all([
    safeNotify(() =>
      notifyTurno(
        idTurno,
        "TURNO_CANCELADO",
        "Turno cancelado",
        "Tu turno fue cancelado.",
      ),
    ),

    safeNotify(() =>
      sendTurnoEmail(
        idTurno,
        "TURNO_CANCELADO",
      ),
    ),
  ]);

  return systemNotification;
};

export const notifyCambioProfesional = async (
  idTurno: string,
) => {
  const [systemNotification] = await Promise.all([
    safeNotify(() =>
      notifyTurno(
        idTurno,
        "CAMBIO_PROFESIONAL",
        "Cambio de profesional",
        "El profesional asignado a tu turno fue modificado.",
      ),
    ),

    safeNotify(() =>
      sendTurnoEmail(
        idTurno,
        "CAMBIO_PROFESIONAL",
      ),
    ),
  ]);

  return systemNotification;
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