import type { 
  UpdatePatientInput 
} from "../validators/patient-update.validator.js";

import { 
  findPatientById 
} from "../repositories/patient-read.repository.js";

import { 
  updatePatient, updatePatientStatus 
} from "../repositories/patient-update.repository.js";

import { 
  editPerson, 
  validatePersonUpdate 
} from "./person.service.js";

import { 
  splitPatientInput 
} from "./patient-data.js";

import { 
  AppError 
} from "../utils/app-error.js";

import { 
  rethrowPatientError 
} from "../utils/profile-error.js";


export const editPatient = async (idPatient: string, input: UpdatePatientInput) => {
  const current = await findPatientById(idPatient);
  if (!current) throw new AppError("Paciente no encontrado", 404);
  const { person, patient } = splitPatientInput(input);
  await validatePersonUpdate(current.id_persona, person);
  try {
    // El trigger de cobertura se ejecuta antes de cambiar los datos compartidos.
    if (Object.values(patient).some((value) => value !== undefined)) {
      await updatePatient(idPatient, patient);
    }
    if (Object.values(person).some((value) => value !== undefined)) {
      await editPerson(current.id_persona, person);
    }
    return await findPatientById(idPatient);
  } catch (error) {
    rethrowPatientError(error);
  }
};

export const changePatientStatus = async (idPatient: string, active: boolean) => {
  const patient = await findPatientById(idPatient);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  if (patient.activo === active) {
    throw new AppError(active ? "El paciente ya está activo" : "El paciente ya está inactivo", 409);
  }
  return updatePatientStatus(idPatient, active);
};

