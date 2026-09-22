import {
  getAllBarrios,
  getBarrioById,
  createBarrio,
  updateBarrio,
  deleteBarrio
} from "../repositories/barrio.repository.js";

export const getBarrios = async () => {
  return await getAllBarrios();
};

export const getBarrio = async (id: string) => {
  return await getBarrioById(id);
};

export const crearBarrio = async (barrio: {
  id_zona: string;
  nombre: string;
  codigo_postal?: string | null;
  activo?: boolean;
}) => {
  return await createBarrio(barrio);
};

export const actualizarBarrio = async (
  id: string,
  barrio: {
    id_zona?: string;
    nombre?: string;
    codigo_postal?: string | null;
    activo?: boolean;
  }
) => {
  return await updateBarrio(id, barrio);
};

export const eliminarBarrio = async (id: string) => {
  return await deleteBarrio(id);
};