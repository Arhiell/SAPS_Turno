import {
  getAllZonas,
  getZonaById,
  createZona,
  updateZona,
  deleteZona
} from "../repositories/zona.repository.js";

export const getZonas = async () => {
  return await getAllZonas();
};

export const getZona = async (id: string) => {
  return await getZonaById(id);
};

export const crearZona = async (zona: {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}) => {
  return await createZona(zona);
};

export const actualizarZona = async (
  id: string,
  zona: {
    nombre?: string;
    descripcion?: string | null;
    activo?: boolean;
  }
) => {
  return await updateZona(id, zona);
};

export const eliminarZona = async (id: string) => {
  return await deleteZona(id);
};