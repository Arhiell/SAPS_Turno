import type {
  CreatePatientInput
} from "../validators/patient.validator.js";

import {
  createPatient,
  findPatientByDni
} from "../repositories/patient.repository.js";

import {
  AppError
} from "../utils/app-error.js";

/**
 * Registra un nuevo paciente.
 */
export const registerPatient = async (
  input: CreatePatientInput
) => {
  /**
   * El DNI es único en pacientes.
   */
  const existingPatient =
    await findPatientByDni(input.dni);

  if (existingPatient) {
    throw new AppError(
      "Ya existe un paciente registrado con ese DNI",
      409
    );
  }

  try {
    return await createPatient(input);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    /**
     * PostgreSQL valida mediante trigger
     * la cobertura Barrio → Salita.
     */
    if (
      message.includes(
        "La salita asignada no cubre el barrio del paciente"
      )
    ) {
      throw new AppError(
        "La salita seleccionada no cubre el barrio del paciente",
        400
      );
    }

    throw error;
  }
};