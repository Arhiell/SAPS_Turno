import { createPerson } from "../repositories/person.repository.js";
import { findPersonByDni, findPersonById } from "../repositories/person-read.repository.js";
import { updatePerson } from "../repositories/person-update.repository.js";
import {
  createPersonSchema, updatePersonSchema,
  type CreatePersonInput, type UpdatePersonInput
} from "../validators/person.validator.js";
import { AppError } from "../utils/app-error.js";
import { hasDatabaseCode } from "../utils/profile-error.js";

export { findPersonByDni };

export const findOrCreatePerson = async (input: CreatePersonInput) => {
  const validated = createPersonSchema.parse(input);
  const existing = await findPersonByDni(validated.dni);
  if (existing) return existing;
  try {
    return await createPerson(validated);
  } catch (error) {
    // Otra solicitud pudo crear el mismo DNI después de nuestra consulta.
    if (hasDatabaseCode(error, "23505")) {
      const concurrent = await findPersonByDni(validated.dni);
      if (concurrent) return concurrent;
    }
    throw error;
  }
};

export const validatePersonUpdate = async (idPerson: string, input: UpdatePersonInput) => {
  if (input.dni !== undefined) {
    const existing = await findPersonByDni(input.dni);
    if (existing && existing.id_persona !== idPerson) {
      throw new AppError("Ya existe una persona registrada con ese DNI", 409);
    }
  }
};

export const editPerson = async (idPerson: string, input: UpdatePersonInput) => {
  const validated = updatePersonSchema.parse(input);
  const current = await findPersonById(idPerson);
  if (!current) throw new AppError("Persona no encontrada", 404);
  await validatePersonUpdate(idPerson, validated);
  if (!Object.values(validated).some((value) => value !== undefined)) return current;
  try {
    return await updatePerson(idPerson, validated);
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      throw new AppError("Ya existe una persona registrada con ese DNI", 409);
    }
    throw error;
  }
};