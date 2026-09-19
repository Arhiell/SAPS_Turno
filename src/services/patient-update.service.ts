import type {
  UpdatePatientInput
} from "../validators/patient-update.validator.js";

import {
  findPatientById
} from "../repositories/patient-read.repository.js";

import {
  findPatientByDni
} from "../repositories/patient.repository.js";

import {
  updatePatient,
  updatePatientStatus
} from "../repositories/patient-update.repository.js";

import {
  AppError
} from "../utils/app-error.js";

/**
 * Actualiza los datos de un paciente.
 */
export const editPatient = async (
  idPatient: string,
  input: UpdatePatientInput
) => {
  const currentPatient =
    await findPatientById(idPatient);

  if (!currentPatient) {
    throw new AppError(
      "Paciente no encontrado",
      404
    );
  }

  /**
   * Si cambia DNI comprobamos
   * que no pertenezca a otro paciente.
   */
  if (
    input.dni &&
    input.dni !== currentPatient.dni
  ) {
    const existing =
      await findPatientByDni(
        input.dni
      );

    if (
      existing &&
      existing.id_paciente !==
        idPatient
    ) {
      throw new AppError(
        "Ya existe otro paciente con ese DNI",
        409
      );
    }
  }

  try {
    return await updatePatient(
      idPatient,
      input
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    /**
     * Trigger de cobertura:
     * barrio y salita deben coincidir.
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

/**
 * Activa o desactiva un paciente.
 */
export const changePatientStatus =
  async (
    idPatient: string,
    active: boolean
  ) => {
    const patient =
      await findPatientById(
        idPatient
      );

    if (!patient) {
      throw new AppError(
        "Paciente no encontrado",
        404
      );
    }

    /**
     * Evitamos una escritura innecesaria.
     */
    if (patient.activo === active) {
      throw new AppError(
        active
          ? "El paciente ya está activo"
          : "El paciente ya está inactivo",
        409
      );
    }

    return updatePatientStatus(
      idPatient,
      active
    );
};