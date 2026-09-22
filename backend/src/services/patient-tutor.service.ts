import {
  findActivePatientTutorRelation,
  findCurrentPrincipalTutor,
  createPatientTutorRelation,
  findTutorsByPatientId,
  findPatientsByTutorId,
  updatePatientTutorRelation,
  endPatientTutorRelation
} from "../repositories/patient-tutor.repository.js";

import {
  getPatientById
} from "./patient-read.service.js";

import {
  getTutorById
} from "./tutor-read.service.js";

import type {
  CreatePatientTutorInput,
  UpdatePatientTutorInput
} from "../validators/patient-tutor.validator.js";

import {
  AppError
} from "../utils/app-error.js";

import {
  hasDatabaseCode
} from "../utils/profile-error.js";


/**
 * Lista los tutores vigentes de un paciente.
 */
export const getPatientTutors = async (
  patientId: string
) => {
  await getPatientById(patientId);

  return await findTutorsByPatientId(patientId);
};


/**
 * Lista los pacientes vigentes asociados a un tutor.
 */
export const getTutorPatients = async (
  tutorId: string
) => {
  await getTutorById(tutorId);

  return await findPatientsByTutorId(tutorId);
};


/**
 * Asocia un tutor a un paciente.
 */
export const addTutorToPatient = async (
  patientId: string,
  input: CreatePatientTutorInput
) => {
  const patient =
    await getPatientById(patientId);

  const tutor =
    await getTutorById(input.id_tutor);

  if (!patient.activo) {
    throw new AppError(
      "El paciente debe estar activo",
      400
    );
  }

  if (!tutor.activo) {
    throw new AppError(
      "El tutor debe estar activo",
      400
    );
  }

  const existing =
    await findActivePatientTutorRelation(
      patientId,
      input.id_tutor
    );

  if (existing) {
    throw new AppError(
      "El tutor ya está asociado actualmente a este paciente",
      409
    );
  }

  if (
    input.fecha_desde !== undefined &&
    input.fecha_hasta !== undefined &&
    input.fecha_hasta !== null &&
    input.fecha_hasta < input.fecha_desde
  ) {
    throw new AppError(
      "La fecha_hasta no puede ser anterior a fecha_desde",
      400
    );
  }

  if (input.es_principal === true) {
    const principal =
      await findCurrentPrincipalTutor(patientId);

    if (principal) {
      throw new AppError(
        "El paciente ya posee un tutor principal vigente",
        409
      );
    }
  }

  try {
    return await createPatientTutorRelation(
      patientId,
      input
    );
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      throw new AppError(
        "Ya existe una relación vigente entre el paciente y el tutor",
        409
      );
    }

    if (hasDatabaseCode(error, "23503")) {
      throw new AppError(
        "El paciente o el tutor no existen",
        404
      );
    }

    throw error;
  }
};


/**
 * Modifica datos de una relación vigente.
 */
export const editPatientTutorRelation = async (
  patientId: string,
  tutorId: string,
  input: UpdatePatientTutorInput
) => {
  await getPatientById(patientId);
  await getTutorById(tutorId);

  const current =
    await findActivePatientTutorRelation(
      patientId,
      tutorId
    );

  if (!current) {
    throw new AppError(
      "La relación paciente-tutor no existe o ya fue finalizada",
      404
    );
  }

  const fechaDesde =
    input.fecha_desde ??
    current.fecha_desde;

  const fechaHasta =
    input.fecha_hasta !== undefined
      ? input.fecha_hasta
      : current.fecha_hasta;

  if (
    fechaHasta !== null &&
    fechaHasta < fechaDesde
  ) {
    throw new AppError(
      "La fecha_hasta no puede ser anterior a fecha_desde",
      400
    );
  }

  if (
    input.es_principal === true &&
    current.es_principal !== true
  ) {
    const principal =
      await findCurrentPrincipalTutor(patientId);

    if (
      principal &&
      principal.id_tutor !== tutorId
    ) {
      throw new AppError(
        "El paciente ya posee un tutor principal vigente",
        409
      );
    }
  }

  const updated =
    await updatePatientTutorRelation(
      patientId,
      tutorId,
      input
    );

  if (!updated) {
    throw new AppError(
      "La relación paciente-tutor cambió; vuelva a consultar",
      409
    );
  }

  return updated;
};


/**
 * Finaliza una relación vigente.
 */
export const finishPatientTutorRelation = async (
  patientId: string,
  tutorId: string
) => {
  await getPatientById(patientId);
  await getTutorById(tutorId);

  const relation =
    await findActivePatientTutorRelation(
      patientId,
      tutorId
    );

  if (!relation) {
    throw new AppError(
      "La relación paciente-tutor no existe o ya fue finalizada",
      404
    );
  }

  const today = new Date().toISOString().slice(0, 10);

    if (today < relation.fecha_desde) {
        throw new AppError(
        "No se puede finalizar la relación antes de su fecha de inicio",
        400
        );
    }

    const updated =
    await endPatientTutorRelation(
    patientId,
    tutorId,
    today
  );

  if (!updated) {
    throw new AppError(
      "La relación paciente-tutor cambió; vuelva a consultar",
      409
    );
  }

  return updated;
};