import { createPatient } from "../repositories/patient.repository.js";
import { findPatientByPersonId } from "../repositories/patient-read.repository.js";
import { createPersonSchema } from "../validators/person.validator.js";
import { patientProfileSchema, type CreatePatientInput } from "../validators/patient.validator.js";
import { findOrCreatePerson } from "./person.service.js";
import { splitPatientInput } from "./patient-data.js";
import { AppError } from "../utils/app-error.js";
import { hasDatabaseCode, rethrowPatientError } from "../utils/profile-error.js";

const duplicatePatient = () =>
  new AppError("Ya existe un paciente registrado para esta persona", 409);

export const registerPatient = async (input: CreatePatientInput) => {
  const parts = splitPatientInput(input);
  const person = await findOrCreatePerson(createPersonSchema.parse({
    ...parts.person,
    localidad: parts.person.localidad ?? "Goya",
    provincia: parts.person.provincia ?? "Corrientes"
  }));
  if (await findPatientByPersonId(person.id_persona)) throw duplicatePatient();
  try {
    return await createPatient({
      ...patientProfileSchema.parse(parts.patient), id_persona: person.id_persona
    });
  } catch (error) {
    if (hasDatabaseCode(error, "23505") &&
        await findPatientByPersonId(person.id_persona)) throw duplicatePatient();
    rethrowPatientError(error);
  }
};