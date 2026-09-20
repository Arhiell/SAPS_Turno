import { AppError } from "../utils/app-error.js";

import {
  createNotificacion,
  findNotificacionesByUsuario,
  findNotificacionById,
  markNotificacionAsRead,
  markAllNotificacionesAsRead,
} from "../repositories/notificacion.repository.js";

import type {
  CreateNotificacionInput,
  NotificacionQuery,
} from "../validators/notificacion.validator.js";

export const sendSystemNotification = async (
  input: CreateNotificacionInput,
) => {
  return createNotificacion(input);
};

export const getNotificacionesUsuario = async (
  idUsuario: string,
  filters: NotificacionQuery,
) => {
  return findNotificacionesByUsuario(
    idUsuario,
    filters,
  );
};

export const getNotificacionUsuario = async (
  id: string,
  idUsuario: string,
) => {
  const notificacion =
    await findNotificacionById(id, idUsuario);

  if (!notificacion) {
    throw new AppError(
      "La notificación no existe",
      404,
    );
  }

  return notificacion;
};

export const readNotificacion = async (
  id: string,
  idUsuario: string,
) => {
  const actual =
    await getNotificacionUsuario(id, idUsuario);

  if (actual.leida) {
    return actual;
  }

  const result = await markNotificacionAsRead(
    id,
    idUsuario,
  );

  if (!result) {
    throw new AppError(
      "No fue posible actualizar la notificación",
      409,
    );
  }

  return result;
};

export const readAllNotificaciones = async (
  idUsuario: string,
) => {
  const updated =
    await markAllNotificacionesAsRead(idUsuario);

  return {
    actualizadas: updated.length,
  };
};