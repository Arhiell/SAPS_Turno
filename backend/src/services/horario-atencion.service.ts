import { timeToSeconds } from "../utils/time.js";
import {
  createHorario,
  deleteHorario,
  getAllHorarios,
  getHorarioById,
  updateHorario,
} from "../repositories/horario-atencion.repository.js";

import {
  createHorarioAtencionSchema,
  updateHorarioAtencionSchema,
  type CreateHorarioAtencionInput,
  type UpdateHorarioAtencionInput,
} from "../validators/horario-atencion.validator.js";

export const getHorarios = async (scope: string[] | null = null) => {
  return await getAllHorarios(scope);
};

export const getHorario = async (id: string) => {
  return await getHorarioById(id);
};

const validarHorario = (
  horaInicio: string,
  horaFin: string,
  vigenciaDesde?: string,
  vigenciaHasta?: string | null
) => {
  if (timeToSeconds(horaInicio) >= timeToSeconds(horaFin)) {
    throw new Error("La hora de inicio debe ser menor que la hora de fin");
  }

  if (
    vigenciaHasta !== undefined &&
    vigenciaHasta !== null &&
    vigenciaDesde !== undefined &&
    vigenciaHasta < vigenciaDesde
  ) {
    throw new Error(
      "La fecha de vigencia hasta debe ser mayor o igual a la fecha de vigencia desde"
    );
  }
};

export const crearHorario = async (
  input: CreateHorarioAtencionInput
) => {
  const validated = createHorarioAtencionSchema.parse(input);

  validarHorario(
    validated.hora_inicio,
    validated.hora_fin,
    validated.vigencia_desde,
    validated.vigencia_hasta
  );

  const data: {
    id_profesional: string;
    id_especialidad: string;
    id_salita: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    duracion_turno_minutos?: number;
    cupo_maximo_diario?: number | null;
    vigencia_desde?: string;
    vigencia_hasta?: string | null;
    activo?: boolean;
  } = {
    id_profesional: validated.id_profesional,
    id_especialidad: validated.id_especialidad,
    id_salita: validated.id_salita,
    dia_semana: validated.dia_semana,
    hora_inicio: validated.hora_inicio,
    hora_fin: validated.hora_fin,
  };

  if (validated.duracion_turno_minutos !== undefined) {
    data.duracion_turno_minutos = validated.duracion_turno_minutos;
  }

  if (validated.cupo_maximo_diario !== undefined) {
    data.cupo_maximo_diario = validated.cupo_maximo_diario;
  }

  if (validated.vigencia_desde !== undefined) {
    data.vigencia_desde = validated.vigencia_desde;
  }

  if (validated.vigencia_hasta !== undefined) {
    data.vigencia_hasta = validated.vigencia_hasta;
  }

  if (validated.activo !== undefined) {
    data.activo = validated.activo;
  }

  return await createHorario(data);
};

export const actualizarHorario = async (
  id: string,
  input: UpdateHorarioAtencionInput
) => {
  const validated = updateHorarioAtencionSchema.parse(input);

  const horarioActual = await getHorarioById(id);

  if (!horarioActual) {
    return null;
  }

  const horaInicio =
    validated.hora_inicio ?? horarioActual.hora_inicio;

  const horaFin =
    validated.hora_fin ?? horarioActual.hora_fin;

  const vigenciaDesde =
    validated.vigencia_desde ?? horarioActual.vigencia_desde;

  const vigenciaHasta =
    validated.vigencia_hasta !== undefined
      ? validated.vigencia_hasta
      : horarioActual.vigencia_hasta;

  validarHorario(
    horaInicio,
    horaFin,
    vigenciaDesde,
    vigenciaHasta
  );

  const data: {
    id_profesional?: string;
    id_especialidad?: string;
    id_salita?: string;
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    duracion_turno_minutos?: number;
    cupo_maximo_diario?: number | null;
    vigencia_desde?: string;
    vigencia_hasta?: string | null;
    activo?: boolean;
  } = {};

  if (validated.id_profesional !== undefined) {
    data.id_profesional = validated.id_profesional;
  }

  if (validated.id_especialidad !== undefined) {
    data.id_especialidad = validated.id_especialidad;
  }

  if (validated.id_salita !== undefined) {
    data.id_salita = validated.id_salita;
  }

  if (validated.dia_semana !== undefined) {
    data.dia_semana = validated.dia_semana;
  }

  if (validated.hora_inicio !== undefined) {
    data.hora_inicio = validated.hora_inicio;
  }

  if (validated.hora_fin !== undefined) {
    data.hora_fin = validated.hora_fin;
  }

  if (validated.duracion_turno_minutos !== undefined) {
    data.duracion_turno_minutos = validated.duracion_turno_minutos;
  }

  if (validated.cupo_maximo_diario !== undefined) {
    data.cupo_maximo_diario = validated.cupo_maximo_diario;
  }

  if (validated.vigencia_desde !== undefined) {
    data.vigencia_desde = validated.vigencia_desde;
  }

  if (validated.vigencia_hasta !== undefined) {
    data.vigencia_hasta = validated.vigencia_hasta;
  }

  if (validated.activo !== undefined) {
    data.activo = validated.activo;
  }

  return await updateHorario(id, data);
};

export const eliminarHorario = async (id: string) => {
  const horario = await getHorarioById(id);

  if (!horario) {
    return null;
  }

  return await deleteHorario(id);
};