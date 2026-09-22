import {
  getSalitasByProfesional,
  createProfesionalSalita,
  updateProfesionalSalita,
  deleteProfesionalSalita
} from "../repositories/profesional-salita.repository.js";

import {
  createProfesionalSalitaSchema,
  updateProfesionalSalitaSchema,
  type CreateProfesionalSalitaInput,
  type UpdateProfesionalSalitaInput
} from "../validators/profesional-salita.validator.js";

import { hasDatabaseCode } from "../utils/profile-error.js";
import { AppError } from "../utils/app-error.js";

export const getSalitasProfesional = async (
  idProfesional: string
) => {
  return await getSalitasByProfesional(idProfesional);
};

export const agregarSalitaProfesional = async (
  idProfesional: string,
  input: CreateProfesionalSalitaInput
) => {
  const validated =
    createProfesionalSalitaSchema.parse(input);

  if (
    validated.fecha_desde !== undefined &&
    validated.fecha_hasta !== undefined &&
    validated.fecha_hasta !== null &&
    validated.fecha_hasta < validated.fecha_desde
  ) {
    throw new AppError(
      "La fecha_hasta no puede ser anterior a fecha_desde",
      400
    );
  }

  const relacion: {
    id_profesional: string;
    id_salita: string;
    fecha_desde?: string;
    fecha_hasta?: string | null;
  } = {
    id_profesional: idProfesional,
    id_salita: validated.id_salita
  };

  if (validated.fecha_desde !== undefined) {
    relacion.fecha_desde = validated.fecha_desde;
  }

  if (validated.fecha_hasta !== undefined) {
    relacion.fecha_hasta = validated.fecha_hasta;
  }

  try {
    return await createProfesionalSalita(relacion);
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      throw new AppError(
        "El profesional ya está asignado a esta salita",
        409
      );
    }

    if (hasDatabaseCode(error, "23503")) {
      throw new AppError(
        "El profesional o la salita no existen",
        404
      );
    }

    throw error;
  }
};

export const actualizarSalitaProfesional = async (
  idProfesional: string,
  idSalita: string,
  input: UpdateProfesionalSalitaInput
) => {
  const validated =
    updateProfesionalSalitaSchema.parse(input);

  if (
    validated.fecha_desde !== undefined &&
    validated.fecha_hasta !== undefined &&
    validated.fecha_hasta !== null &&
    validated.fecha_hasta < validated.fecha_desde
  ) {
    throw new AppError(
      "La fecha_hasta no puede ser anterior a fecha_desde",
      400
    );
  }

  const relacion: {
    fecha_desde?: string;
    fecha_hasta?: string | null;
    activo?: boolean;
  } = {};

  if (validated.fecha_desde !== undefined) {
    relacion.fecha_desde = validated.fecha_desde;
  }

  if (validated.fecha_hasta !== undefined) {
    relacion.fecha_hasta = validated.fecha_hasta;
  }

  if (validated.activo !== undefined) {
    relacion.activo = validated.activo;
  }

  return await updateProfesionalSalita(
    idProfesional,
    idSalita,
    relacion
  );
};

export const eliminarSalitaProfesional = async (
  idProfesional: string,
  idSalita: string
) => {
  return await deleteProfesionalSalita(
    idProfesional,
    idSalita
  );
};