import {
  getAllSalitaBarrios,
  getBarriosBySalita,
  getSalitasByBarrio,
  createSalitaBarrio,
  updateSalitaBarrio,
  deleteSalitaBarrio
} from "../repositories/salita-barrio.repository.js";

export const getSalitaBarrios = async () => {
  return await getAllSalitaBarrios();
};

export const getBarriosDeSalita = async (idSalita: string) => {
  return await getBarriosBySalita(idSalita);
};

export const getSalitasDeBarrio = async (idBarrio: string) => {
  return await getSalitasByBarrio(idBarrio);
};

export const crearSalitaBarrio = async (relacion: {
  id_salita: string;
  id_barrio: string;
  es_barrio_sede?: boolean;
  activo?: boolean;
  fecha_desde: string;
  fecha_hasta?: string | null;
}) => {
  return await createSalitaBarrio(relacion);
};

export const actualizarSalitaBarrio = async (
  idSalita: string,
  idBarrio: string,
  relacion: {
    es_barrio_sede?: boolean;
    activo?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string | null;
  }
) => {
  return await updateSalitaBarrio(idSalita, idBarrio, relacion);
};

export const eliminarSalitaBarrio = async (
  idSalita: string,
  idBarrio: string
) => {
  return await deleteSalitaBarrio(idSalita, idBarrio);
};