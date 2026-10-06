import type {
  PatientListQuery
} from "../validators/patient-query.validator.js";

import {
  findPatientById,
  findPatientDetailsByDni,
  findPatients
} from "../repositories/patient-read.repository.js";

import {
  AppError
} from "../utils/app-error.js";

/**
 * Obtiene listado paginado.
 */
export const getPatients = async (
  query: PatientListQuery, scope: string[] | null = null, includeAccount = false
) => {
  const {
    page,
    limit
  } = query;

  const from =
    (page - 1) * limit;

  const to =
    from + limit - 1;

  const result =
    await findPatients(
      from,
      to, scope, query.search, query.estado, includeAccount
    );

  const totalPages =
    Math.ceil(
      result.total / limit
    );

  return {
    patients:
      result.patients,

    pagination: {
      page,
      limit,
      total:
        result.total,
      totalPages
    }
  };
};

/**
 * Obtiene un paciente por ID.
 */
export const getPatientById = async (
  idPatient: string, includeAccount = false
) => {
  const patient =
    await findPatientById(
      idPatient, includeAccount
    );

  if (!patient) {
    throw new AppError(
      "Paciente no encontrado",
      404
    );
  }

  return patient;
};

/**
 * Obtiene un paciente por DNI.
 */
export const getPatientByDni = async (
  dni: string, includeAccount = false
) => {
  const patient =
    await findPatientDetailsByDni(
      dni, includeAccount
    );

  if (!patient) {
    throw new AppError(
      "Paciente no encontrado",
      404
    );
  }

  return patient;
};
