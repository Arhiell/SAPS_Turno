// Servicio de disponibilidad de turnos

import { disponibilidadQuerySchema } from "../validators/disponibilidad.validator.js";

import {
  getHorariosParaDisponibilidad,
  getBloqueosParaDisponibilidad,
  getTurnosParaDisponibilidad,
} from "../repositories/disponibilidad.repository.js";

type Horario = {
  id_horario: string;
  id_profesional: string;
  id_especialidad: string;
  id_salita: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_turno_minutos: number;
  cupo_maximo_diario: number | null;
  vigencia_desde: string;
  vigencia_hasta: string | null;
};

type Bloqueo = {
  id_bloqueo: string;
  id_profesional: string | null;
  id_salita: string;
  id_especialidad: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  dia_completo: boolean;
  motivo: string;
  activo?: boolean;
};

type Turno = {
  id_turno: string;
  id_profesional: string;
  id_salita: string;
  id_especialidad: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  ocupa_agenda: boolean;
  estado:
    | {
        id_estado: string;
        codigo: string;
        nombre: string;
      }
    | null;
};

type Slot = {
  hora_inicio: string;
  hora_fin: string;
  estado: "DISPONIBLE" | "OCUPADO" | "BLOQUEADO";
  motivo?: string;
  id_turno?: string;
  estado_turno?: string;
};

const obtenerDiaSemana = (fecha: string): number => {
  const fechaObj = new Date(`${fecha}T12:00:00-03:00`);

  const dia = fechaObj.getDay();

  return dia === 0 ? 7 : dia;
};

const convertirHoraAMinutos = (hora: string): number => {
  const partes = hora.split(":");

  const horas = Number(partes[0] ?? 0);
  const minutos = Number(partes[1] ?? 0);

  return horas * 60 + minutos;
};

const convertirMinutosAHora = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(
    minutosRestantes
  ).padStart(2, "0")}`;
};

/**
 * Acepta tanto HH:mm como HH:mm:ss.
 */
const obtenerFechaHoraArgentina = (
  fecha: string,
  hora: string
): Date => {
  const partesHora = hora.split(":");

  const horas = partesHora[0] ?? "00";
  const minutos = partesHora[1] ?? "00";
  const segundos = partesHora[2] ?? "00";

  return new Date(
    `${fecha}T${horas}:${minutos}:${segundos}-03:00`
  );
};

const intervalosSeSuperponen = (
  inicioA: Date,
  finA: Date,
  inicioB: Date,
  finB: Date
): boolean => {
  return inicioA < finB && finA > inicioB;
};

const slotEstaBloqueado = (
  fecha: string,
  horaInicio: string,
  horaFin: string,
  bloqueos: Bloqueo[]
): {
  bloqueado: boolean;
  motivo?: string;
} => {
  const inicioSlot = obtenerFechaHoraArgentina(
    fecha,
    horaInicio
  );

  const finSlot = obtenerFechaHoraArgentina(
    fecha,
    horaFin
  );

  for (const bloqueo of bloqueos) {
    if (bloqueo.dia_completo) {
      return {
        bloqueado: true,
        motivo: bloqueo.motivo,
      };
    }

    if (
      bloqueo.hora_inicio === null ||
      bloqueo.hora_fin === null
    ) {
      continue;
    }

    const inicioBloqueo =
      obtenerFechaHoraArgentina(
        fecha,
        bloqueo.hora_inicio
      );

    const finBloqueo =
      obtenerFechaHoraArgentina(
        fecha,
        bloqueo.hora_fin
      );

    if (
      intervalosSeSuperponen(
        inicioSlot,
        finSlot,
        inicioBloqueo,
        finBloqueo
      )
    ) {
      return {
        bloqueado: true,
        motivo: bloqueo.motivo,
      };
    }
  }

  return {
    bloqueado: false,
  };
};

const slotEstaOcupado = (
  fecha: string,
  horaInicio: string,
  horaFin: string,
  turnos: Turno[]
): {
  ocupado: boolean;
  id_turno?: string;
  estado_turno?: string;
} => {
  const inicioSlot =
    obtenerFechaHoraArgentina(
      fecha,
      horaInicio
    );

  const finSlot =
    obtenerFechaHoraArgentina(
      fecha,
      horaFin
    );

  for (const turno of turnos) {
    const inicioTurno = new Date(
      turno.fecha_hora_inicio
    );

    const finTurno = new Date(
      turno.fecha_hora_fin
    );

    if (
      intervalosSeSuperponen(
        inicioSlot,
        finSlot,
        inicioTurno,
        finTurno
      )
    ) {
      const resultado: {
        ocupado: boolean;
        id_turno?: string;
        estado_turno?: string;
      } = {
        ocupado: true,
        id_turno: turno.id_turno,
      };

      if (turno.estado?.nombre) {
        resultado.estado_turno =
          turno.estado.nombre;
      }

      return resultado;
    }
  }

  return {
    ocupado: false,
  };
};

export const obtenerDisponibilidad = async (
  query: unknown
) => {
  const {
    fecha,
    id_profesional,
    id_especialidad,
    id_salita,
  } = disponibilidadQuerySchema.parse(query);

  const diaSemana =
    obtenerDiaSemana(fecha);

  const [
    horarios,
    bloqueos,
    turnos,
  ] = await Promise.all([
    getHorariosParaDisponibilidad(
      id_profesional,
      id_especialidad,
      id_salita,
      diaSemana,
      fecha
    ),

    getBloqueosParaDisponibilidad(
      id_profesional,
      id_especialidad,
      id_salita,
      fecha
    ),

    getTurnosParaDisponibilidad(
      id_profesional,
      id_salita,
      fecha
    ),
  ]);

  const horariosTipados =
    horarios as unknown as Horario[];

  const bloqueosTipados =
    bloqueos as unknown as Bloqueo[];

  const turnosTipados =
    turnos as unknown as Turno[];

  const slots: Slot[] = [];

  for (const horario of horariosTipados) {
    const inicio =
      convertirHoraAMinutos(
        horario.hora_inicio
      );

    const fin =
      convertirHoraAMinutos(
        horario.hora_fin
      );

    const duracion =
      horario.duracion_turno_minutos;

    let cantidadGenerada = 0;

    for (
      let minutoActual = inicio;
      minutoActual + duracion <= fin;
      minutoActual += duracion
    ) {
      if (
        horario.cupo_maximo_diario !== null &&
        cantidadGenerada >=
          horario.cupo_maximo_diario
      ) {
        break;
      }

      const horaInicio =
        convertirMinutosAHora(
          minutoActual
        );

      const horaFin =
        convertirMinutosAHora(
          minutoActual + duracion
        );

      const bloqueo =
        slotEstaBloqueado(
          fecha,
          horaInicio,
          horaFin,
          bloqueosTipados
        );

      if (bloqueo.bloqueado) {
        const slotBloqueado: Slot = {
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado: "BLOQUEADO",
        };

        if (bloqueo.motivo) {
          slotBloqueado.motivo =
            bloqueo.motivo;
        }

        slots.push(slotBloqueado);
      } else {
        const ocupado =
          slotEstaOcupado(
            fecha,
            horaInicio,
            horaFin,
            turnosTipados
          );

        if (ocupado.ocupado) {
          const slotOcupado: Slot = {
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            estado: "OCUPADO",
          };

          if (ocupado.id_turno) {
            slotOcupado.id_turno =
              ocupado.id_turno;
          }

          if (ocupado.estado_turno) {
            slotOcupado.estado_turno =
              ocupado.estado_turno;
          }

          slots.push(slotOcupado);
        } else {
          slots.push({
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            estado: "DISPONIBLE",
          });
        }
      }

      cantidadGenerada++;
    }
  }

  const disponibles =
    slots.filter(
      (slot) =>
        slot.estado === "DISPONIBLE"
    ).length;

  const ocupados =
    slots.filter(
      (slot) =>
        slot.estado === "OCUPADO"
    ).length;

  const bloqueados =
    slots.filter(
      (slot) =>
        slot.estado === "BLOQUEADO"
    ).length;

  return {
    fecha,

    dia_semana: diaSemana,

    id_profesional,

    id_especialidad,

    id_salita,

    resumen: {
      total_slots: slots.length,
      disponibles,
      ocupados,
      bloqueados,
    },

    slots,

    horarios_utilizados:
      horariosTipados.map(
        (horario) => ({
          id_horario:
            horario.id_horario,

          hora_inicio:
            horario.hora_inicio,

          hora_fin:
            horario.hora_fin,

          duracion_turno_minutos:
            horario.duracion_turno_minutos,

          cupo_maximo_diario:
            horario.cupo_maximo_diario,
        })
      ),
  };
};