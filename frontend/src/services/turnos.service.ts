import api from './api';

import type {
  ChangeTurnoStatusRequest,
  CreateTurnoRequest,
  DisponibilidadResponse,
  TurnoResponse,
  TurnosFilters,
  TurnosResponse,
  UpdateTurnoRequest,
} from '../types/turno.types';

export const getTurnos = async (
  filters: TurnosFilters = {},
): Promise<TurnosResponse> => {
  const response =
    await api.get<TurnosResponse>(
      '/turnos',
      {
        params: {
          ...filters,
        },
      },
    );

  return response.data;
};

export const getTurnoById = async (
  id: string,
): Promise<TurnoResponse> => {
  const response =
    await api.get<TurnoResponse>(
      `/turnos/${id}`,
    );

  return response.data;
};

export const createTurno = async (
  data: CreateTurnoRequest,
): Promise<TurnoResponse> => {
  const response =
    await api.post<TurnoResponse>(
      '/turnos',
      data,
    );

  return response.data;
};

export const updateTurno = async (
  id: string,
  data: UpdateTurnoRequest,
): Promise<TurnoResponse> => {
  const response =
    await api.patch<TurnoResponse>(
      `/turnos/${id}`,
      data,
    );

  return response.data;
};

export const changeTurnoStatus =
  async (
    id: string,
    data: ChangeTurnoStatusRequest,
  ): Promise<TurnoResponse> => {
    const response =
      await api.patch<TurnoResponse>(
        `/turnos/${id}/status`,
        data,
      );

    return response.data;
  };

export const getDisponibilidad =
  async (
    fecha: string,
    idProfesional: string,
    idEspecialidad: string,
    idSalita: string,
  ): Promise<DisponibilidadResponse> => {
    const response =
      await api.get<DisponibilidadResponse>(
        '/disponibilidad',
        {
          params: {
            fecha,
            id_profesional:
              idProfesional,
            id_especialidad:
              idEspecialidad,
            id_salita:
              idSalita,
          },
        },
      );

    return response.data;
  };