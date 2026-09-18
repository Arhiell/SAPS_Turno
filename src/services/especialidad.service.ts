import {
  getAllEspecialidades
} from "../repositories/especialidad.repository.js";

export const getEspecialidades = async () => {
  return await getAllEspecialidades();
};