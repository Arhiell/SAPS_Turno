import api from './api';

import type {
  PatientProfessional,
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

// Obtiene el listado de profesionales.
export const getProfessionals =
  async (): Promise<ProfessionalsResponse> => {
    const response = await api.get<ProfessionalsResponse>(
      '/profesionales'
    );

    return response.data;
  };

// Obtiene los datos de un profesional por su identificador.
export const getProfessionalById = async (
  id: string
): Promise<ProfessionalResponse> => {
  const response = await api.get<ProfessionalResponse>(
    `/profesionales/${id}`
  );

  return response.data;
};

// Registra un nuevo profesional.
export const createProfessional = async (
  data: CreateProfessionalRequest
): Promise<ProfessionalResponse> => {
  const response = await api.post<ProfessionalResponse>(
    '/profesionales',
    data
  );

  return response.data;
};

// Actualiza los datos de un profesional.
export const updateProfessional = async (
  id: string,
  data: UpdateProfessionalRequest
): Promise<ProfessionalResponse> => {
  const response = await api.put<ProfessionalResponse>(
    `/profesionales/${id}`,
    data
  );

  return response.data;
};

// Elimina un profesional.
export const deleteProfessional = async (
  id: string
): Promise<ProfessionalResponse> => {
  const response = await api.delete<ProfessionalResponse>(
    `/profesionales/${id}`
  );

  return response.data;
};

// Obtiene las especialidades asignadas a un profesional.
export const getProfessionalSpecialties = async (
  id: string
): Promise<ProfessionalSpecialtiesResponse> => {
  const response =
    await api.get<ProfessionalSpecialtiesResponse>(
      `/profesionales/${id}/especialidades`
    );

  return response.data;
};

// Asigna una especialidad a un profesional.
export const addProfessionalSpecialty = async (
  id: string,
  data: CreateProfessionalSpecialtyRequest
): Promise<ProfessionalSpecialtiesResponse> => {
  const response =
    await api.post<ProfessionalSpecialtiesResponse>(
      `/profesionales/${id}/especialidades`,
      data
    );

  return response.data;
};

// Actualiza una especialidad asignada a un profesional.
export const updateProfessionalSpecialty = async (
  id: string,
  idEspecialidad: string,
  data: UpdateProfessionalSpecialtyRequest
): Promise<ProfessionalSpecialtiesResponse> => {
  const response =
    await api.put<ProfessionalSpecialtiesResponse>(
      `/profesionales/${id}/especialidades/${idEspecialidad}`,
      data
    );

  return response.data;
};

// Elimina una especialidad asignada a un profesional.
export const deleteProfessionalSpecialty = async (
  id: string,
  idEspecialidad: string
): Promise<ProfessionalSpecialtiesResponse> => {
  const response =
    await api.delete<ProfessionalSpecialtiesResponse>(
      `/profesionales/${id}/especialidades/${idEspecialidad}`
    );

  return response.data;
};

// Obtiene las salitas asignadas a un profesional.
export const getProfessionalClinics = async (
  id: string
): Promise<ProfessionalClinicsResponse> => {
  const response =
    await api.get<ProfessionalClinicsResponse>(
      `/profesionales/${id}/salitas`
    );

  return response.data;
};

// Asigna una salita a un profesional.
export const addProfessionalClinic = async (
  id: string,
  data: CreateProfessionalClinicRequest
): Promise<ProfessionalClinicsResponse> => {
  const response =
    await api.post<ProfessionalClinicsResponse>(
      `/profesionales/${id}/salitas`,
      data
    );

  return response.data;
};

// Actualiza la asignación de una salita a un profesional.
export const updateProfessionalClinic = async (
  id: string,
  idSalita: string,
  data: UpdateProfessionalClinicRequest
): Promise<ProfessionalClinicsResponse> => {
  const response =
    await api.put<ProfessionalClinicsResponse>(
      `/profesionales/${id}/salitas/${idSalita}`,
      data
    );

  return response.data;
};

// Elimina la asignación de una salita a un profesional.
export const deleteProfessionalClinic = async (
  id: string,
  idSalita: string
): Promise<ProfessionalClinicsResponse> => {
  const response =
    await api.delete<ProfessionalClinicsResponse>(
      `/profesionales/${id}/salitas/${idSalita}`
    );

  return response.data;
};

// Obtiene los profesionales disponibles para los pacientes.
export const getPatientProfessionals = async (
  fecha?: string,
  patientId?: string
) =>
  (
    await api.get<{ data: PatientProfessional[] }>(
      '/profesionales',
      {
        params: {
          fecha,
          ...(patientId ? { id_paciente: patientId } : {}),
        },
      }
    )
  ).data.data;
