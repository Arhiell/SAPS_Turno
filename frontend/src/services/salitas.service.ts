import api from './api';

import type {
  CreateSalitaRequest,
  SalitaResponse,
  SalitasResponse,
  UpdateSalitaRequest,
} from '../types/salita.types';

export const getSalitas = async (): Promise<SalitasResponse> => {
  const response = await api.get<SalitasResponse>(
    '/salitas',
  );

  return response.data;
};

export const getAdminSalitas = async (): Promise<SalitasResponse> => {
  const response = await api.get<SalitasResponse>(
    '/salitas/admin',
  );

  return response.data;
};

export const getSalitaById = async (
  id: string,
): Promise<SalitaResponse> => {
  const response = await api.get<SalitaResponse>(
    `/salitas/${id}`,
  );

  return response.data;
};

export const createSalita = async (
  data: CreateSalitaRequest,
): Promise<SalitaResponse> => {
  const response = await api.post<SalitaResponse>(
    '/salitas',
    data,
  );

  return response.data;
};

export const updateSalita = async (
  id: string,
  data: UpdateSalitaRequest,
): Promise<SalitaResponse> => {
  const response = await api.put<SalitaResponse>(
    `/salitas/${id}`,
    data,
  );

  return response.data;
};

export const deleteSalita = async (
  id: string,
): Promise<SalitaResponse> => {
  const response = await api.delete<SalitaResponse>(
    `/salitas/${id}`,
  );

  return response.data;
};
