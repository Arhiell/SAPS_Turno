import api from './api';

import type {
  CreateProfessionalClinicRequest,
  CreateProfessionalRequest,
  CreateProfessionalSpecialtyRequest,
  ProfessionalClinicsResponse,
  ProfessionalResponse,
  ProfessionalsResponse,
  ProfessionalSpecialtiesResponse,
  UpdateProfessionalClinicRequest,
  UpdateProfessionalRequest,
  UpdateProfessionalSpecialtyRequest,
} from '../types/profesional.types';

export const getProfessionals =
  async (): Promise<ProfessionalsResponse> => {
    const response =
      await api.get<ProfessionalsResponse>(
        '/profesionales',
      );

    return response.data;
  };

export const getProfessionalById =
  async (
    id: string,
  ): Promise<ProfessionalResponse> => {
    const response =
      await api.get<ProfessionalResponse>(
        `/profesionales/${id}`,
      );

    return response.data;
  };

export const createProfessional =
  async (
    data: CreateProfessionalRequest,
  ): Promise<ProfessionalResponse> => {
    const response =
      await api.post<ProfessionalResponse>(
        '/profesionales',
        data,
      );

    return response.data;
  };

export const updateProfessional =
  async (
    id: string,
    data: UpdateProfessionalRequest,
  ): Promise<ProfessionalResponse> => {
    const response =
      await api.put<ProfessionalResponse>(
        `/profesionales/${id}`,
        data,
      );

    return response.data;
  };

export const deleteProfessional =
  async (
    id: string,
  ): Promise<ProfessionalResponse> => {
    const response =
      await api.delete<ProfessionalResponse>(
        `/profesionales/${id}`,
      );

    return response.data;
  };

export const getProfessionalSpecialties =
  async (
    id: string,
  ): Promise<ProfessionalSpecialtiesResponse> => {
    const response =
      await api.get<ProfessionalSpecialtiesResponse>(
        `/profesionales/${id}/especialidades`,
      );

    return response.data;
  };

export const addProfessionalSpecialty =
  async (
    id: string,
    data: CreateProfessionalSpecialtyRequest,
  ): Promise<ProfessionalSpecialtiesResponse> => {
    const response =
      await api.post<ProfessionalSpecialtiesResponse>(
        `/profesionales/${id}/especialidades`,
        data,
      );

    return response.data;
  };

export const updateProfessionalSpecialty =
  async (
    id: string,
    idEspecialidad: string,
    data: UpdateProfessionalSpecialtyRequest,
  ): Promise<ProfessionalSpecialtiesResponse> => {
    const response =
      await api.put<ProfessionalSpecialtiesResponse>(
        `/profesionales/${id}/especialidades/${idEspecialidad}`,
        data,
      );

    return response.data;
  };

export const deleteProfessionalSpecialty =
  async (
    id: string,
    idEspecialidad: string,
  ): Promise<ProfessionalSpecialtiesResponse> => {
    const response =
      await api.delete<ProfessionalSpecialtiesResponse>(
        `/profesionales/${id}/especialidades/${idEspecialidad}`,
      );

    return response.data;
  };

export const getProfessionalClinics =
  async (
    id: string,
  ): Promise<ProfessionalClinicsResponse> => {
    const response =
      await api.get<ProfessionalClinicsResponse>(
        `/profesionales/${id}/salitas`,
      );

    return response.data;
  };

export const addProfessionalClinic =
  async (
    id: string,
    data: CreateProfessionalClinicRequest,
  ): Promise<ProfessionalClinicsResponse> => {
    const response =
      await api.post<ProfessionalClinicsResponse>(
        `/profesionales/${id}/salitas`,
        data,
      );

    return response.data;
  };

export const updateProfessionalClinic =
  async (
    id: string,
    idSalita: string,
    data: UpdateProfessionalClinicRequest,
  ): Promise<ProfessionalClinicsResponse> => {
    const response =
      await api.put<ProfessionalClinicsResponse>(
        `/profesionales/${id}/salitas/${idSalita}`,
        data,
      );

    return response.data;
  };

export const deleteProfessionalClinic =
  async (
    id: string,
    idSalita: string,
  ): Promise<ProfessionalClinicsResponse> => {
    const response =
      await api.delete<ProfessionalClinicsResponse>(
        `/profesionales/${id}/salitas/${idSalita}`,
      );

    return response.data;
  };