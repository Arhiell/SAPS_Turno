import {
  getAllProfesionales,
  getProfesionalById,
  createProfesional,
  updateProfesional,
  deleteProfesional
} from "../repositories/profesional.repository.js";

export const getProfesionales = async () => {
  return await getAllProfesionales();
};

export const getProfesional = async (id: string) => {
  return await getProfesionalById(id);
};

export const crearProfesional = async (profesional: {
  id_persona: string;
  matricula: string;
  activo?: boolean;
  fecha_alta?: string;
  fecha_baja?: string | null;
}) => {
  return await createProfesional(profesional);
};

export const actualizarProfesional = async (
  id: string,
  profesional: {
    id_persona?: string;
    matricula?: string;
    activo?: boolean;
    fecha_alta?: string;
    fecha_baja?: string | null;
  }
) => {
  return await updateProfesional(id, profesional);
};

export const eliminarProfesional = async (id: string) => {
  return await deleteProfesional(id);
};