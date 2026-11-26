import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

Object.assign(process.env, {
  SUPABASE_URL: 'http://supabase.invalid',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SECRET_KEY: 'test-secret',
  JWT_ACCESS_SECRET: 'test-secret-for-vis-prof',
  GOOGLE_CLIENT_ID: 'test-client',
});

const idSalitaSarmiento = '22222222-2222-4222-8222-222222222222';
const idSalitaOtra = '99999999-9999-4999-8999-999999999999';
const idBarrioSarmiento = '11111111-1111-4111-8111-111111111111';
const idPaciente = '44444444-4444-4444-8444-444444444444';
const idPersona = '33333333-3333-4333-8333-333333333333';
const idUsuario = '55555555-5555-4555-8555-555555555555';

const idProfLunes = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const idEspPediatria = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const idProfSemana = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const idEspPsicologia = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const idProfSinAgenda = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const idEspSinAgenda = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const pacienteSonia = {
  id_paciente: idPaciente,
  id_persona: idPersona,
  id_barrio: idBarrioSarmiento,
  id_salita_asignada: idSalitaSarmiento,
  activo: true,
  persona: { id_persona: idPersona, nombres: 'Sonia', apellidos: 'Valdez', dni: '35672727' },
};

const userSonia = {
  id_usuario: idUsuario,
  email: 'sonia@example.com',
  nombre_usuario: 'sonia',
  rol: 'PACIENTE',
};

let db = {
  profesionales: [] as any[],
  horarios: [] as any[],
  turnos: [] as any[],
  justificaciones: [] as any[],
};

beforeEach(() => {
  db = {
    profesionales: [],
    horarios: [],
    turnos: [],
    justificaciones: [],
  };
});

globalThis.fetch = async (input, options) => {
  const url = new URL(String(input));
  const method = options?.method ?? 'GET';
  const body = options?.body ? JSON.parse(String(options.body)) : undefined;
  const headers = new Headers(options?.headers);
  const isSingleObject = headers.get('Accept')?.includes('application/vnd.pgrst.object+json');

  const reply = (data: any, status = 200) => {
    let finalBody = data;
    if (isSingleObject && Array.isArray(data)) {
      finalBody = data.length === 1 ? data[0] : null;
    }
    return new Response(JSON.stringify(finalBody), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': Array.isArray(data) ? `0-${data.length}/${data.length}` : '*/0',
      },
    });
  };

  const path = url.pathname;

  if (path === '/rest/v1/usuarios') {
    return reply([{ id_usuario: idUsuario, id_persona: idPersona, id_rol: 'rol-paciente', activo: true }]);
  }
  if (path === '/rest/v1/roles') {
    return reply([{ codigo: 'PACIENTE', activo: true }]);
  }
  if (path === '/rest/v1/pacientes') {
    return reply([pacienteSonia]);
  }
  if (path === '/rest/v1/barrios') {
    return reply([{ id_barrio: idBarrioSarmiento, activo: true }]);
  }
  if (path === '/rest/v1/salitas') {
    return reply([{ id_salita: idSalitaSarmiento, activo: true }]);
  }
  if (path === '/rest/v1/salita_barrios' || path === '/rest/v1/salitas_barrios') {
    return reply([{ id_salita: idSalitaSarmiento, id_barrio: idBarrioSarmiento, activo: true, fecha_desde: '2020-01-01', fecha_hasta: null }]);
  }
  if (path === '/rest/v1/tutores') {
    return reply([]);
  }
  if (path === '/rest/v1/paciente_tutores') {
    return reply([]);
  }
  if (path === '/rest/v1/sanciones') {
    return reply([]);
  }
  if (path === '/rest/v1/cierres_calendario') {
    return reply([]);
  }
  if (path === '/rest/v1/bloqueos_agenda') {
    return reply([]);
  }
  if (path === '/rest/v1/configuracion' || path === '/rest/v1/configuraciones') {
    return reply([]);
  }
  if (path === '/rest/v1/profesionales') {
    return reply(db.profesionales);
  }
  if (path === '/rest/v1/horarios_atencion') {
    return reply(db.horarios);
  }
  if (path === '/rest/v1/turnos') {
    if (method === 'POST') {
      const inserted = { id_turno: 't-' + (db.turnos.length + 1), ...body };
      db.turnos.push(inserted);
      return reply([inserted], 201);
    }
    return reply(db.turnos);
  }
  if (path === '/rest/v1/inasistencias_justificaciones') {
    if (method === 'HEAD') {
      const pendingCount = db.justificaciones.filter((j) => j.estado === 'PENDIENTE').length;
      return new Response(null, {
        status: 200,
        headers: { 'Content-Range': `*/${pendingCount}` },
      });
    }
    if (method === 'POST') {
      const inserted = {
        id_justificacion: 'just-' + (db.justificaciones.length + 1),
        estado: 'PENDIENTE',
        documentacion_ref: body.documentacion_ref ?? null,
        ...body,
      };
      db.justificaciones.push(inserted);
      return reply([inserted], 201);
    }
    return reply(db.justificaciones);
  }

  return reply([]);
};

const { getPatientProfessionals, getPatientAvailableDates } = await import(
  '../src/services/patient-agenda.service.js'
);
const { assertOwnCoverage } = await import('../src/services/patient-coverage.service.js');
const { presentarJustificacion } = await import(
  '../src/services/inasistencia-politica.service.js'
);

test('Caso 1: Profesional que atiende lunes se muestra al consultar un miércoles y calcula próxima apertura', async () => {
  db.profesionales = [
    {
      id_profesional: idProfLunes,
      matricula: 'MP-2272798',
      persona: { nombres: 'Mariano', apellidos: 'Lopez' },
      salitas: [{ id_salita: idSalitaSarmiento, activo: true, fecha_desde: '2026-10-01', fecha_hasta: null }],
      especialidades: [
        {
          id_especialidad: idEspPediatria,
          activo: true,
          fecha_desde: '2026-10-01',
          fecha_hasta: null,
          especialidad: { nombre: 'Pediatría', activo: true },
        },
      ],
    },
    {
      id_profesional: idProfSemana,
      matricula: '12543',
      persona: { nombres: 'Julio', apellidos: 'Ortiz' },
      salitas: [{ id_salita: idSalitaSarmiento, activo: true, fecha_desde: '2026-10-01', fecha_hasta: null }],
      especialidades: [
        {
          id_especialidad: idEspPsicologia,
          activo: true,
          fecha_desde: '2026-10-01',
          fecha_hasta: null,
          especialidad: { nombre: 'Psicología', activo: true },
        },
      ],
    },
  ];

  db.horarios = [
    {
      id_horario: '11111111-0000-0000-0000-000000000001',
      id_profesional: idProfLunes,
      id_especialidad: idEspPediatria,
      id_salita: idSalitaSarmiento,
      dia_semana: 1, // Lunes
      hora_inicio: '08:00:00',
      hora_fin: '12:00:00',
      duracion_turno_minutos: 30,
      activo: true,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: null,
    },
    {
      id_horario: '11111111-0000-0000-0000-000000000002',
      id_profesional: idProfSemana,
      id_especialidad: idEspPsicologia,
      id_salita: idSalitaSarmiento,
      dia_semana: 3, // Miércoles
      hora_inicio: '14:00:00',
      hora_fin: '16:00:00',
      duracion_turno_minutos: 30,
      activo: true,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: null,
    },
  ];

  const result = await getPatientProfessionals(userSonia, undefined, idPaciente);

  assert.equal(result.length, 2, 'Deben listarse los 2 profesionales con agenda vigente');
  const profLunesFound = result.find((p) => p.id_profesional === idProfLunes);
  assert.ok(profLunesFound, 'El profesional que atiende lunes debe aparecer en el catálogo');
  assert.equal(profLunesFound.especialidades[0].nombre, 'Pediatría');

  const profSemanaFound = result.find((p) => p.id_profesional === idProfSemana);
  assert.ok(profSemanaFound, 'El profesional que atiende en la semana debe aparecer');
  assert.equal(profSemanaFound.especialidades[0].nombre, 'Psicología');
});

test('Caso 1b: getPatientAvailableDates para profesional que atiende lunes informa próxima disponibilidad', async () => {
  db.profesionales = [
    {
      id_profesional: idProfLunes,
      matricula: 'MP-2272798',
      persona: { nombres: 'Mariano', apellidos: 'Lopez' },
      salitas: [{ id_salita: idSalitaSarmiento, activo: true, fecha_desde: '2026-10-01', fecha_hasta: null }],
      especialidades: [
        {
          id_especialidad: idEspPediatria,
          activo: true,
          fecha_desde: '2026-10-01',
          fecha_hasta: null,
          especialidad: { nombre: 'Pediatría', activo: true },
        },
      ],
    },
  ];

  db.horarios = [
    {
      id_horario: '11111111-0000-0000-0000-000000000001',
      id_profesional: idProfLunes,
      id_especialidad: idEspPediatria,
      id_salita: idSalitaSarmiento,
      dia_semana: 1, // Lunes
      hora_inicio: '08:00:00',
      hora_fin: '12:00:00',
      duracion_turno_minutos: 30,
      activo: true,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: null,
    },
  ];

  const datesResult = await getPatientAvailableDates(userSonia, {
    id_profesional: idProfLunes,
    id_especialidad: idEspPediatria,
    id_salita: idSalitaSarmiento,
    id_paciente: idPaciente,
  });

  assert.ok(datesResult.ventana, 'Debe devolver la ventana de reserva');
  assert.ok(datesResult.proxima_disponibilidad, 'Debe incluir información de próxima disponibilidad');
  assert.ok(datesResult.proxima_disponibilidad.mensaje.includes('lunes'), 'Debe mencionar que atiende los lunes');
  assert.ok(datesResult.proxima_disponibilidad.mensaje.includes('sábado'), 'Debe mencionar cuándo abre la reserva');
});

test('Caso 2: Profesional que atiende durante la semana actual permite continuar con la reserva', async () => {
  db.profesionales = [
    {
      id_profesional: idProfSemana,
      matricula: '12543',
      persona: { nombres: 'Julio', apellidos: 'Ortiz' },
      salitas: [{ id_salita: idSalitaSarmiento, activo: true, fecha_desde: '2026-10-01', fecha_hasta: null }],
      especialidades: [
        {
          id_especialidad: idEspPsicologia,
          activo: true,
          fecha_desde: '2026-10-01',
          fecha_hasta: null,
          especialidad: { nombre: 'Psicología', activo: true },
        },
      ],
    },
  ];

  db.horarios = [
    {
      id_horario: '22222222-0000-0000-0000-000000000001',
      id_profesional: idProfSemana,
      id_especialidad: idEspPsicologia,
      id_salita: idSalitaSarmiento,
      dia_semana: 3, // Miércoles
      hora_inicio: '08:00:00',
      hora_fin: '10:00:00',
      duracion_turno_minutos: 30,
      activo: true,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: null,
    },
  ];

  const result = await getPatientProfessionals(userSonia, undefined, idPaciente);
  assert.equal(result.length, 1);
  assert.equal(result[0].persona.nombres, 'Julio');
  assert.equal(result[0].especialidades[0].nombre, 'Psicología');
});

test('Caso 3: Profesional sin agenda vigente queda excluido de la lista', async () => {
  db.profesionales = [
    {
      id_profesional: idProfSinAgenda,
      matricula: 'MP-00000',
      persona: { nombres: 'Sin', apellidos: 'Agenda' },
      salitas: [{ id_salita: idSalitaSarmiento, activo: true, fecha_desde: '2026-10-01', fecha_hasta: null }],
      especialidades: [
        {
          id_especialidad: idEspSinAgenda,
          activo: true,
          fecha_desde: '2026-10-01',
          fecha_hasta: null,
          especialidad: { nombre: 'Nutrición', activo: true },
        },
      ],
    },
  ];

  db.horarios = [
    {
      id_horario: '33333333-0000-0000-0000-000000000001',
      id_profesional: idProfSinAgenda,
      id_especialidad: idEspSinAgenda,
      id_salita: idSalitaSarmiento,
      dia_semana: 1,
      hora_inicio: '08:00:00',
      hora_fin: '10:00:00',
      activo: false, // INACTIVO
      vigencia_desde: '2026-01-01',
      vigencia_hasta: null,
    },
  ];

  const result = await getPatientProfessionals(userSonia, undefined, idPaciente);
  assert.equal(result.length, 0, 'Profesional sin agenda vigente no debe mostrarse');
});

test('Caso 4: Paciente que intenta consultar profesionales de otra salita es rechazado por cobertura', async () => {
  await assert.rejects(
    assertOwnCoverage(userSonia, idSalitaOtra, '2026-11-25', idPaciente),
    {
      statusCode: 403,
      message: 'La salita no corresponde a tu cobertura vigente. Consultá tu perfil o contactá a administración.',
    }
  );
});

test('Flujo de justificaciones: Permite documentación opcional y queda en estado PENDIENTE', async () => {
  const idTurno = '77777777-7777-4777-8777-777777777777';

  db.turnos = [
    {
      id_turno: idTurno,
      id_paciente: idPaciente,
      id_salita: idSalitaSarmiento,
      id_profesional: idProfSemana,
      id_especialidad: idEspPsicologia,
      fecha: '2026-11-20',
      hora_inicio: '08:00:00',
      hora_fin: '08:30:00',
      version: 1,
      id_estado: 'st-no-asistio',
      estado: { codigo: 'NO_ASISTIO', nombre: 'No asistió' },
    },
  ];

  const justificacionCreada = await presentarJustificacion(
    {
      id_turno: idTurno,
      motivo: '[Emergencias familiares] Tuve un problema imprevisto con un familiar a cargo.',
    },
    userSonia
  );

  assert.equal(justificacionCreada.estado, 'PENDIENTE', 'La justificación debe crearse en estado PENDIENTE');
  assert.equal(justificacionCreada.documentacion_ref, null, 'Documentación debe ser opcional');
  assert.equal(db.justificaciones.length, 1, 'Debe persistirse en justificaciones');
});
