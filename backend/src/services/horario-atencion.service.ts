import { timeToSeconds } from "../utils/time.js";
import {
  createHorario,
  deleteHorario,
  getAllHorarios,
  getHorarioById,
  updateHorario,
} from "../repositories/horario-atencion.repository.js";
import { emitirHorarioAtencionActualizado } from "./socket.service.js";

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

  const created = await createHorario(data);
  if (created) {
    try {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const diaNum = Number(created.dia_semana);
      const nombreDia = dias[diaNum - 1] ?? `Día ${created.dia_semana}`;
      emitirHorarioAtencionActualizado({
        id_profesional: created.id_profesional,
        id_salita: created.id_salita,
        id_horario: created.id_horario,
        dia_semana: created.dia_semana,
        nuevo_horario: `${created.hora_inicio.slice(0, 5)} a ${created.hora_fin.slice(0, 5)}`,
        mensaje: `Se asignó un nuevo horario de atención para el ${nombreDia} (${created.hora_inicio.slice(0, 5)} a ${created.hora_fin.slice(0, 5)})`,
      });
    } catch (err) {
      console.error('Error al emitir evento de horario creado:', err);
    }
  }

  return created;
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

  const updated = await updateHorario(id, data);
  if (updated) {
    try {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const diaNum = Number(updated.dia_semana);
      const nombreDia = dias[diaNum - 1] ?? `Día ${updated.dia_semana}`;
      const horaIni = updated.hora_inicio.slice(0, 5);
      const horaFin = updated.hora_fin.slice(0, 5);
      const horaIniAnt = horarioActual?.hora_inicio ? horarioActual.hora_inicio.slice(0, 5) : undefined;
      const horaFinAnt = horarioActual?.hora_fin ? horarioActual.hora_fin.slice(0, 5) : undefined;

      emitirHorarioAtencionActualizado({
        id_profesional: updated.id_profesional,
        id_salita: updated.id_salita,
        id_horario: updated.id_horario,
        dia_semana: updated.dia_semana,
        horario_anterior: horaIniAnt && horaFinAnt ? `${horaIniAnt} a ${horaFinAnt}` : undefined,
        nuevo_horario: `${horaIni} a ${horaFin}`,
        mensaje: `Se actualizó tu horario de atención del ${nombreDia} (${horaIni} a ${horaFin})`,
      });

      if (horarioActual && horarioActual.id_profesional !== updated.id_profesional) {
        emitirHorarioAtencionActualizado({
          id_profesional: horarioActual.id_profesional,
          id_salita: horarioActual.id_salita,
          id_horario: horarioActual.id_horario,
          dia_semana: horarioActual.dia_semana,
          mensaje: `Se reasignó una franja horaria a otro profesional`,
        });
      }
    } catch (err) {
      console.error('Error al emitir evento de horario actualizado:', err);
    }
  }

  return updated;
};

export const eliminarHorario = async (id: string) => {
  const horario = await getHorarioById(id);

  if (!horario) {
    return null;
  }

  const deleted = await deleteHorario(id);
  if (deleted) {
    try {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const diaNum = Number(horario.dia_semana);
      const nombreDia = dias[diaNum - 1] ?? `Día ${horario.dia_semana}`;
      emitirHorarioAtencionActualizado({
        id_profesional: horario.id_profesional,
        id_salita: horario.id_salita,
        id_horario: horario.id_horario,
        dia_semana: horario.dia_semana,
        mensaje: `Se dio de baja el horario de atención del ${nombreDia}`,
      });
    } catch (err) {
      console.error('Error al emitir evento de horario eliminado:', err);
    }
  }

  return deleted;
};