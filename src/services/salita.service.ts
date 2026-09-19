import {
  getAllSalitas,
  getSalitaById,
  createSalita,
  updateSalita,
  deleteSalita
} from "../repositories/salita.repository.js";

export const getSalitas = async () => {
  return await getAllSalitas();
};

export const getSalita = async (id: string) => {
  return await getSalitaById(id);
};

export const crearSalita = async (salita: {
  codigo: string;
  nombre: string;
  direccion: string;
  id_barrio: string;
  telefono?: string | null;
  email?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  activo?: boolean;
}) => {
  return await createSalita(salita);
};

export const actualizarSalita = async (
  id: string,
  salita: {
    codigo?: string;
    nombre?: string;
    direccion?: string;
    id_barrio?: string;
    telefono?: string | null;
    email?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    horario_apertura?: string | null;
    horario_cierre?: string | null;
    activo?: boolean;
  }
) => {
  return await updateSalita(id, salita);
};

export const eliminarSalita = async (id: string) => {
  return await deleteSalita(id);
};