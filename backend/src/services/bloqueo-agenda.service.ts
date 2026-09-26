import { timeToSeconds } from "../utils/time.js";

import {
  createBloqueo,
  deleteBloqueo,
  getAllBloqueos,
  getBloqueoById,
  updateBloqueo,
} from "../repositories/bloqueo-agenda.repository.js";

import {
  createBloqueoAgendaSchema,
  updateBloqueoAgendaSchema,
  type CreateBloqueoAgendaInput,
  type UpdateBloqueoAgendaInput,
} from "../validators/bloqueo-agenda.validator.js";

export const getBloqueos = async (scope: string[] | null = null) => {
  return await getAllBloqueos(scope);
};

export const getBloqueo = async (id: string) => {
  return await getBloqueoById(id);
};

export const crearBloqueo = async (
  input: CreateBloqueoAgendaInput
) => {
  const validated = createBloqueoAgendaSchema.parse(input);

  const data: {
    id_profesional?: string | null;
    id_salita: string;
    id_especialidad?: string | null;
    fecha: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    dia_completo: boolean;
    motivo: string;
    activo?: boolean;
  } = {
    id_salita: validated.id_salita,
    fecha: validated.fecha,
    dia_completo: validated.dia_completo ?? false,
    motivo: validated.motivo,
  };

  if (validated.id_profesional !== undefined) {
    data.id_profesional = validated.id_profesional;
  }

  if (validated.id_especialidad !== undefined) {
    data.id_especialidad = validated.id_especialidad;
  }

  if (validated.hora_inicio !== undefined) {
    data.hora_inicio = validated.hora_inicio;
  }

  if (validated.hora_fin !== undefined) {
    data.hora_fin = validated.hora_fin;
  }

  if (validated.activo !== undefined) {
    data.activo = validated.activo;
  }

  return await createBloqueo(data);
};

export const actualizarBloqueo = async (
  id: string,
  input: UpdateBloqueoAgendaInput
) => {
  const validated = updateBloqueoAgendaSchema.parse(input);

  const bloqueoActual = await getBloqueoById(id);

  if (!bloqueoActual) {
    return null;
  }

  const diaCompleto =
    validated.dia_completo ?? bloqueoActual.dia_completo;

  const horaInicio =
    validated.hora_inicio !== undefined
      ? validated.hora_inicio
      : bloqueoActual.hora_inicio;

  const horaFin =
    validated.hora_fin !== undefined
      ? validated.hora_fin
      : bloqueoActual.hora_fin;

  if (diaCompleto) {
    if (horaInicio !== null || horaFin !== null) {
      throw new Error(
        "Un bloqueo de día completo no puede tener horario"
      );
    }
  } else {
    if (horaInicio === null || horaInicio === undefined) {
      throw new Error(
        "Debe indicar la hora de inicio para un bloqueo parcial"
      );
    }

    if (horaFin === null || horaFin === undefined) {
      throw new Error(
        "Debe indicar la hora de fin para un bloqueo parcial"
      );
    }

    if (timeToSeconds(horaInicio) >= timeToSeconds(horaFin)) {
      throw new Error(
        "La hora de inicio debe ser menor que la hora de fin"
      );
    }
  }

  const data: {
    id_profesional?: string | null;
    id_salita?: string;
    id_especialidad?: string | null;
    fecha?: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    dia_completo?: boolean;
    motivo?: string;
    activo?: boolean;
  } = {};

  if (validated.id_profesional !== undefined) {
    data.id_profesional = validated.id_profesional;
  }

  if (validated.id_salita !== undefined) {
    data.id_salita = validated.id_salita;
  }

  if (validated.id_especialidad !== undefined) {
    data.id_especialidad = validated.id_especialidad;
  }

  if (validated.fecha !== undefined) {
    data.fecha = validated.fecha;
  }

  if (validated.hora_inicio !== undefined) {
    data.hora_inicio = validated.hora_inicio;
  }

  if (validated.hora_fin !== undefined) {
    data.hora_fin = validated.hora_fin;
  }

  if (validated.dia_completo !== undefined) {
    data.dia_completo = validated.dia_completo;
  }

  if (validated.motivo !== undefined) {
    data.motivo = validated.motivo;
  }

  if (validated.activo !== undefined) {
    data.activo = validated.activo;
  }

  return await updateBloqueo(id, data);
};

export const eliminarBloqueo = async (id: string) => {
  const bloqueo = await getBloqueoById(id);

  if (!bloqueo) {
    return null;
  }

  return await deleteBloqueo(id);
};