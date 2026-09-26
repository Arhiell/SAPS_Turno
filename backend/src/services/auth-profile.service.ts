import { 
  supabase 
} from "../config/supabase.js";

import { 
  findUserById 
} from "../repositories/user.repository.js";

import { 
  findPersonByDni, findPersonsByEmail
} from "../repositories/person-read.repository.js";

import { 
  createPerson 
} from "../repositories/person.repository.js";

import { 
  findPatientByPersonId, 
  findPatientById 
} from "../repositories/patient-read.repository.js";

import { 
  createPatient 
} from "../repositories/patient.repository.js";

import {
  createPatientSchema, 
  patientProfileSchema 
} from "../validators/patient.validator.js";

import { 
  createPersonSchema 
} from "../validators/person.validator.js";

import { 
  splitPatientInput 
} from "./patient-data.js";

import { 
  AppError 
} from "../utils/app-error.js";
import { rethrowPatientError } from "../utils/profile-error.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

export const getOwnProfile = async (user: AuthenticatedUser) => {
  const account = await findUserById(user.id_usuario);
  
  if (!account) throw new AppError("Usuario no encontrado", 401);
  
  const patient = user.rol === "PACIENTE" && account.id_persona
    ? await findPatientByPersonId(account.id_persona) : null;
  
    return { 
      user, 
      patient: patient ? await findPatientById(patient.id_paciente) : null };
};

export const completeOwnProfile = async (body: unknown, user: AuthenticatedUser) => {
  if (user.rol !== "PACIENTE") throw new AppError("Solo pacientes", 403);
  
  const input = createPatientSchema.omit({ email: true }).parse(body);
 
  const account = await findUserById(user.id_usuario);
 
  if (!account) throw new AppError("Usuario no encontrado", 401);
 
  if (account.id_persona && await findPatientByPersonId(account.id_persona)) {
    throw new AppError("El perfil ya está completo", 409);
  }
 
  const existing = await findPersonByDni(input.dni);
  // Conocer un DNI no prueba identidad: una vinculación previa requiere revisión administrativa.
  if (existing && existing.id_persona !== account.id_persona) {
    throw new AppError("El DNI ya está registrado. Contactá a tu salita para vincular tu cuenta sin duplicar el paciente.", 409);
  }
 
  if (account.id_persona && existing?.id_persona !== account.id_persona) {
    throw new AppError("El DNI no coincide con tu persona registrada", 409);
  }
  const emailPersons = await findPersonsByEmail(account.email);
  if (emailPersons.some(person => person.id_persona !== account.id_persona)) {
    throw new AppError("Tu correo ya está asociado a una persona. Contactá a tu salita para vincular tu cuenta.", 409);
  }
 
  const parts = splitPatientInput({ ...input, email: account.email });
 
  const person = existing ?? await createPerson(createPersonSchema.parse(parts.person));
 
  if (!account.id_persona) {
    const { data, error } = await supabase.from("usuarios").update({ id_persona: person.id_persona })
      .eq("id_usuario", user.id_usuario).is("id_persona", null).select("id_usuario").maybeSingle();
 
      if (error) throw error;
 
      if (!data) throw new AppError("La cuenta cambió. Volvé a consultar tu perfil", 409);
  }
 
  try {
    await createPatient({ ...patientProfileSchema.parse(parts.patient), id_persona: person.id_persona });
  } catch (error) {
    rethrowPatientError(error);
  }
 
  return getOwnProfile(user);
};

export const getOwnEntity = async (user: AuthenticatedUser) => {
  const account = await findUserById(user.id_usuario);
  
  if (!account?.id_persona) throw new AppError("Completá o vinculá tu perfil en la salita", 403);
  
  const professional = user.rol === "PROFESIONAL";
  
  const key = professional ? "id_profesional" : "id_paciente";
  
  const { data, error } = await supabase.from(professional ? "profesionales" : "pacientes")
    .select(key).eq("id_persona", account.id_persona).eq("activo", true).maybeSingle();
  
    if (error) throw error;
  
    const id = (data as unknown as Record<string, string> | null)?.[key];
  
    if (!id) throw new AppError("No tenés un perfil activo asociado", 403);
  
    return { key, id };
};
