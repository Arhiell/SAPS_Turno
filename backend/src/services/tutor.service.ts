import type { 
  CreateTutorInput 
} from "../validators/tutor.validator.js";

import { 
  createTutor, 
  findTutorByPersonId 
} from "../repositories/tutor.repository.js";

import { 
  findOrCreatePerson 
} from "./person.service.js";

import { 
  AppError 
} from "../utils/app-error.js";
import { 
  hasDatabaseCode 
} from "../utils/profile-error.js";

import { 
  findTutorPersonState 
} from "../repositories/tutor-read.repository.js";

import {
  rethrowTutorError 
} from "../utils/tutor-error.js";

export const validateTutorPerson = async (idPerson: string) => {
  const person = await findTutorPersonState(idPerson);

  if (!person?.activo || !person.telefono?.trim()) {
    throw new AppError("La persona del tutor debe estar activa y tener telefono", 400);
  }
};

export const registerTutor = async (input: CreateTutorInput) => {
  const person = await findOrCreatePerson(input);
  
  const duplicate = () => new AppError("Ya existe un tutor registrado para esta persona", 409);

  if (await findTutorByPersonId(person.id_persona)) throw duplicate();
  await validateTutorPerson(person.id_persona);
  try {
    const tutor = await createTutor(person.id_persona);
    return { ...person, ...tutor };
  } catch (error) {
    if (hasDatabaseCode(error, "23505") &&
        await findTutorByPersonId(person.id_persona)) throw duplicate();
    rethrowTutorError(error);
  }
};
