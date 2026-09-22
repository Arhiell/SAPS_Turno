import {
  getAllProfesionales,
  getProfesionalById,
  createProfesional,
  updateProfesional,
  deleteProfesional
} from "../repositories/profesional.repository.js";

import {
  findOrCreatePerson,
  editPerson
} from "./person.service.js";

import {
  createProfesionalSchema,
  updateProfesionalSchema,
  type CreateProfesionalInput,
  type UpdateProfesionalInput
} from "../validators/profesional.validator.js";

export const getProfesionales = async () => {
  return await getAllProfesionales();
};

export const getProfesional = async (id: string) => {
  return await getProfesionalById(id);
};

export const crearProfesional = async (
  input: CreateProfesionalInput
) => {
  const validated =
    createProfesionalSchema.parse(input);

  const {
    matricula,
    ...personData
  } = validated;

  const persona =
    await findOrCreatePerson(personData);

  return await createProfesional({
    id_persona: persona.id_persona,
    matricula
  });
};

export const actualizarProfesional = async (
  id: string,
  input: UpdateProfesionalInput
) => {
  const validated =
    updateProfesionalSchema.parse(input);

  const profesional =
    await getProfesionalById(id);

  if (!profesional) {
    return null;
  }

  const {
    matricula,
    activo,
    fecha_alta,
    fecha_baja,
    ...personData
  } = validated;

  if (
    Object.values(personData).some(
      (value) => value !== undefined
    )
  ) {
    await editPerson(
      profesional.id_persona,
      personData
    );
  }

  const profesionalData: {
    matricula?: string;
    activo?: boolean;
    fecha_alta?: string;
    fecha_baja?: string | null;
  } = {};

  if (matricula !== undefined) {
    profesionalData.matricula = matricula;
  }

  if (activo !== undefined) {
    profesionalData.activo = activo;
  }

  if (fecha_alta !== undefined) {
    profesionalData.fecha_alta = fecha_alta;
  }

  if (fecha_baja !== undefined) {
    profesionalData.fecha_baja = fecha_baja;
  }

  if (Object.keys(profesionalData).length > 0) {
    return await updateProfesional(
      id,
      profesionalData
    );
  }

  return await getProfesionalById(id);
};

export const eliminarProfesional = async (
  id: string
) => {
  return await deleteProfesional(id);
};