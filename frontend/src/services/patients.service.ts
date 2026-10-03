import api from './api';
import type { OwnPatientUpdate } from '../types/patient.types';
import type { ProfileResponse } from '../types/auth.types';

export const updateOwnPatient = async (data: OwnPatientUpdate) =>
  (await api.patch<ProfileResponse>('/auth/profile', data)).data;

import type {
  CreatePatientRequest,
  PatientResponse,
  PatientStatusFilter,
  PatientsResponse,
  UpdatePatientRequest,
} from '../types/patient.types';

export const getPatients = async (
  page = 1,
  limit = 10,
  search = '',
  estado: PatientStatusFilter = 'activo',
): Promise<PatientsResponse> => {
  const response = await api.get<PatientsResponse>(
    '/patients',
    {
      params: {
        page,
        limit,
        search: search || undefined,
        estado,
      },
    },
  );

  return response.data;
};

export const getPatientByDni = async (
  dni: string,
): Promise<PatientResponse> => {
  const response = await api.get<PatientResponse>(
    `/patients/dni/${dni}`,
  );

  return response.data;
};

export const getPatientById = async (
  id: string,
): Promise<PatientResponse> => {
  const response = await api.get<PatientResponse>(
    `/patients/${id}`,
  );

  return response.data;
};

export const createPatient = async (
  data: CreatePatientRequest,
): Promise<PatientResponse> => {
  const response = await api.post<PatientResponse>(
    '/patients',
    data,
  );

  return response.data;
};

export const updatePatientStatus = async (
  id: string,
  activo: boolean,
): Promise<PatientResponse> => {
  const response = await api.patch<PatientResponse>(
    `/patients/${id}/status`,
    {
      activo,
    },
  );

  return response.data;
};

export const updatePatient = async (
  id: string,
  data: UpdatePatientRequest,
): Promise<PatientResponse> => {
  const response = await api.patch<PatientResponse>(
    `/patients/${id}`,
    data,
  );

  return response.data;
};
