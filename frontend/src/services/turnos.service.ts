import api from './api';

import type {
  AppointmentHistory,
  ChangeTurnoStatusRequest,
  CreateTurnoRequest,
  DisponibilidadResponse,
  TurnoResponse,
  TurnosFilters,
  TurnosResponse,
  UpdateTurnoRequest,
} from '../types/turno.types';

// Obtiene el historial de cambios de un turno.
export const getTurnoHistory = async (
  id: string
) =>
  (
    await api.get<{ historial: AppointmentHistory[] }>(
      `/turnos/${id}/historial`
    )
  ).data.historial;

// Permite al paciente solicitar su propio turno.
export const createOwnTurno = async (
  data: { id_paciente?: string } & Omit<
    CreateTurnoRequest,
    'id_paciente' | 'observaciones'
  >
) =>
  (
    await api.post<TurnoResponse>(
      '/turnos',
      data
    )
  ).data;

// Obtiene los turnos aplicando los filtros indicados.
export const getTurnos = async (
  filters: TurnosFilters = {}
): Promise<TurnosResponse> => {
  const response = await api.get<TurnosResponse>(
    '/turnos',
    {
      params: {
        ...filters,
      },
    }
  );

  return response.data;
};

// Obtiene los datos de un turno por su identificador.
export const getTurnoById = async (
  id: string
): Promise<TurnoResponse> => {
  const response = await api.get<TurnoResponse>(
    `/turnos/${id}`
  );

  return response.data;
};

// Registra un nuevo turno.
export const createTurno = async (
  data: CreateTurnoRequest
): Promise<TurnoResponse> => {
  const response = await api.post<TurnoResponse>(
    '/turnos',
    data
  );

  return response.data;
};

// Actualiza los datos de un turno existente.
export const updateTurno = async (
  id: string,
  data: UpdateTurnoRequest
): Promise<TurnoResponse> => {
  const response = await api.patch<TurnoResponse>(
    `/turnos/${id}`,
    data
  );

  return response.data;
};

// Modifica el estado de un turno.
export const changeTurnoStatus = async (
  id: string,
  data: ChangeTurnoStatusRequest
): Promise<TurnoResponse> => {
  const response = await api.patch<TurnoResponse>(
    `/turnos/${id}/status`,
    data
  );

  return response.data;
};

// Consulta la disponibilidad de turnos para una fecha y atención.
export const getDisponibilidad = async (
  fecha: string,
  idProfesional: string,
  idEspecialidad: string,
  idSalita: string,
  patientId?: string
): Promise<DisponibilidadResponse> => {
  const response = await api.get<DisponibilidadResponse>(
    '/disponibilidad',
    {
      params: {
        fecha,
        id_profesional: idProfesional,
        id_especialidad: idEspecialidad,
        id_salita: idSalita,
        ...(patientId ? { id_paciente: patientId } : {}),
      },
    }
  );

  return response.data;
};

// Define las fechas disponibles y la ventana de reserva.
export interface PatientAvailableDates {
  fechas: string[];

  ventana: {
    desde: string;
    hasta: string;
    proxima_apertura: string;
  };
}

// Obtiene las fechas disponibles para el paciente.
export const getPatientAvailableDates = async (
  professional: string,
  specialty: string,
  clinic: string,
  patientId?: string
): Promise<PatientAvailableDates> =>
  (
    await api.get<PatientAvailableDates>(
      '/disponibilidad/fechas',
      {
        params: {
          id_profesional: professional,
          id_especialidad: specialty,
          id_salita: clinic,
          ...(patientId ? { id_paciente: patientId } : {}),
        },
      }
    )
  ).data;
