import api from './api';
import type { NotificacionesResponse } from '../types/notificacion.types';

// La API determina el destinatario desde la sesión.
export const getNotificaciones = async (page = 1, leida?: boolean) =>
  (await api.get<NotificacionesResponse>('/notificaciones', {
    params: { page, limit: 10, ...(leida === undefined ? {} : { leida: String(leida) }) },
  })).data;

export const leerNotificacion = async (id: string) => { await api.patch(`/notificaciones/${id}/leer`); };
export const leerTodasNotificaciones = async () => { await api.patch('/notificaciones/leer-todas'); };
