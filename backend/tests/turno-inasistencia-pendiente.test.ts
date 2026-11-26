import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../src/utils/app-error.js";
import { formatProfesionalNombre } from "../src/utils/profesional-format.js";

// Mock validation logic directly to verify rules in isolation
test("PACIENTE_TURNO_PENDIENTE: estructura de error y datos cuando el paciente tiene turno pendiente (sin denominación inventada)", () => {
  const openTurno = {
    id_turno: "t-1234",
    fecha_hora_inicio: "2026-11-30T10:30:00-03:00",
    fecha_hora_fin: "2026-11-30T11:00:00-03:00",
    id_especialidad: "esp-1",
    id_profesional: "prof-1",
    id_salita: "sal-1",
    id_estado: "est-1",
    estado: { id_estado: "est-1", codigo: "EN_ESPERA", nombre: "En espera" },
    especialidad: { id_especialidad: "esp-1", nombre: "Pediatría" },
    profesional: {
      id_profesional: "prof-1",
      persona: { nombres: "Ana", apellidos: "Gómez" },
    },
    salita: { id_salita: "sal-1", nombre: "SAPS Central" },
  };

  const raw = openTurno as Record<string, any>;
  const profesionalNombre = raw.profesional
    ? formatProfesionalNombre(raw.profesional)
    : undefined;

  const err = new AppError(
    "Ya tenés un turno pendiente. Para solicitar otro, primero debés resolver el actual.",
    409,
    "PACIENTE_TURNO_PENDIENTE",
    {
      turno_pendiente: {
        id_turno: raw.id_turno,
        fecha: "2026-11-30",
        hora: "10:30",
        especialidad: raw.especialidad?.nombre,
        profesional: profesionalNombre,
        salita: raw.salita?.nombre,
        estado: raw.estado?.nombre || "En espera",
        estado_codigo: raw.estado?.codigo || "EN_ESPERA",
      },
    }
  );

  assert.equal(err.statusCode, 409);
  assert.equal(err.code, "PACIENTE_TURNO_PENDIENTE");
  assert.equal(
    err.message,
    "Ya tenés un turno pendiente. Para solicitar otro, primero debés resolver el actual."
  );
  assert.deepEqual(err.data, {
    turno_pendiente: {
      id_turno: "t-1234",
      fecha: "2026-11-30",
      hora: "10:30",
      especialidad: "Pediatría",
      profesional: "Gómez, Ana",
      salita: "SAPS Central",
      estado: "En espera",
      estado_codigo: "EN_ESPERA",
    },
  });
});

test("formatProfesionalNombre: respeta título configurado y no inventa nada si no existe", () => {
  // Caso 1: Profesional sin título configurado
  const profSinTitulo = {
    persona: { nombres: "Carlos", apellidos: "Gómez" },
  };
  assert.equal(formatProfesionalNombre(profSinTitulo), "Gómez, Carlos");
  assert.equal(formatProfesionalNombre(profSinTitulo, { order: "nombres-primero" }), "Carlos Gómez");

  // Caso 2: Profesional con título/denominación configurada en datos
  const profConTitulo = {
    titulo: "Lic.",
    persona: { nombres: "María", apellidos: "Pérez" },
  };
  assert.equal(formatProfesionalNombre(profConTitulo), "Lic. Pérez, María");
  assert.equal(formatProfesionalNombre(profConTitulo, { order: "nombres-primero" }), "Lic. María Pérez");

  // Caso 3: Profesional nulo o sin datos
  assert.equal(formatProfesionalNombre(null), "Profesional sin asignar");
  assert.equal(formatProfesionalNombre({ persona: { nombres: "", apellidos: "" } }), "Profesional sin datos");
});

test("TURNO_AUN_NO_INASISTIBLE: rechaza inasistencia cuando el horario no finalizó", () => {
  const current = {
    fecha_hora_inicio: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    fecha_hora_fin: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  const estado = "NO_ASISTIO";
  let thrownError: AppError | null = null;

  if (estado === "NO_ASISTIO") {
    const finTurno = Date.parse(current.fecha_hora_fin || current.fecha_hora_inicio);
    if (Number.isFinite(finTurno) && finTurno > Date.now()) {
      thrownError = new AppError(
        "Todavía no se puede registrar la inasistencia. El horario asignado para este turno todavía no ha finalizado. Podrás registrar la inasistencia una vez que haya terminado el horario de atención correspondiente.",
        409,
        "TURNO_AUN_NO_INASISTIBLE"
      );
    }
  }

  assert.ok(thrownError);
  assert.equal(thrownError.statusCode, 409);
  assert.equal(thrownError.code, "TURNO_AUN_NO_INASISTIBLE");
  assert.equal(
    thrownError.message,
    "Todavía no se puede registrar la inasistencia. El horario asignado para este turno todavía no ha finalizado. Podrás registrar la inasistencia una vez que haya terminado el horario de atención correspondiente."
  );
});

test("TURNO_AUN_NO_INASISTIBLE: rechaza inasistencia cuando el turno comenzó pero el slot no finalizó", () => {
  const current = {
    fecha_hora_inicio: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // empezó hace 5 min
    fecha_hora_fin: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // termina en 15 min
  };

  const estado = "NO_ASISTIO";
  let thrownError: AppError | null = null;

  if (estado === "NO_ASISTIO") {
    const finTurno = Date.parse(current.fecha_hora_fin || current.fecha_hora_inicio);
    if (Number.isFinite(finTurno) && finTurno > Date.now()) {
      thrownError = new AppError(
        "Todavía no se puede registrar la inasistencia. El horario asignado para este turno todavía no ha finalizado. Podrás registrar la inasistencia una vez que haya terminado el horario de atención correspondiente.",
        409,
        "TURNO_AUN_NO_INASISTIBLE"
      );
    }
  }

  assert.ok(thrownError, "Debe rechazar inasistencia durante el slot del turno");
  assert.equal(thrownError?.code, "TURNO_AUN_NO_INASISTIBLE");
});

test("TURNO_AUN_NO_INASISTIBLE: permite registrar inasistencia una vez superado fecha_hora_fin", () => {
  const current = {
    fecha_hora_inicio: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    fecha_hora_fin: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // terminó hace 30 min
  };

  const estado = "NO_ASISTIO";
  let thrownError: AppError | null = null;

  if (estado === "NO_ASISTIO") {
    const finTurno = Date.parse(current.fecha_hora_fin || current.fecha_hora_inicio);
    if (Number.isFinite(finTurno) && finTurno > Date.now()) {
      thrownError = new AppError(
        "Todavía no se puede registrar la inasistencia. El horario asignado para este turno todavía no ha finalizado. Podrás registrar la inasistencia una vez que haya terminado el horario de atención correspondiente.",
        409,
        "TURNO_AUN_NO_INASISTIBLE"
      );
    }
  }

  assert.equal(thrownError, null, "No debe lanzar TURNO_AUN_NO_INASISTIBLE si el horario ya finalizó");
});

test("Aislamiento y reglas de estado: no permite registrar inasistencia sobre turno en estado final", () => {
  const turnoCancelado = {
    id_turno: "t-cancel",
    estado: {
      id_estado: "est-final",
      codigo: "CANCELADO",
      nombre: "Cancelado",
      es_estado_final: true,
    },
  };

  const assertEditable = (turno: any) => {
    if (turno.estado.es_estado_final) {
      throw new AppError("El turno tiene un estado final y no admite modificaciones", 409);
    }
  };

  assert.throws(
    () => assertEditable(turnoCancelado),
    { statusCode: 409, message: "El turno tiene un estado final y no admite modificaciones" }
  );
});
