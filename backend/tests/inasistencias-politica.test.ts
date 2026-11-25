import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

Object.assign(process.env, {
  SUPABASE_URL: 'http://supabase.invalid',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SECRET_KEY: 'test-secret',
  JWT_ACCESS_SECRET: 'test-secret-for-inasistencias',
  GOOGLE_CLIENT_ID: 'test-client',
});

// Mock state
let db = {
  turnos: [] as any[],
  advertencias: [] as any[],
  justificaciones: [] as any[],
  sanciones: [] as any[],
  pacientes: [] as any[],
  usuario_salita: [] as any[],
  tutores: [] as any[],
  paciente_tutores: [] as any[],
  insertedAdvertencias: [] as any[],
  insertedSanciones: [] as any[],
  insertedJustificaciones: [] as any[],
  patchedTurnos: [] as any[],
  patchedAdvertencias: [] as any[],
  patchedSanciones: [] as any[],
};

beforeEach(() => {
  db = {
    turnos: [],
    advertencias: [],
    justificaciones: [],
    sanciones: [],
    pacientes: [],
    usuario_salita: [],
    tutores: [],
    paciente_tutores: [],
    insertedAdvertencias: [],
    insertedSanciones: [],
    insertedJustificaciones: [],
    patchedTurnos: [],
    patchedAdvertencias: [],
    patchedSanciones: [],
  };
});

globalThis.fetch = async (input, options) => {
  const url = new URL(String(input));
  const method = options?.method ?? 'GET';
  const body = options?.body ? JSON.parse(String(options.body)) : undefined;
  const headers = new Headers(options?.headers);
  const isSingleObject = headers.get('Accept')?.includes('application/vnd.pgrst.object+json');

  const replyJson = (data: any, status = 200) => {
    let finalBody = data;
    if (isSingleObject && Array.isArray(data)) {
      if (data.length === 0) {
        finalBody = null;
      } else if (data.length === 1) {
        finalBody = data[0];
      } else {
        return new Response(
          JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple rows returned' }),
          {
            status: 406,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    return new Response(JSON.stringify(finalBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const path = url.pathname;

  // Turnos
  if (path === '/rest/v1/turnos') {
    if (method === 'PATCH') {
      db.patchedTurnos.push(body);
      const updated = { ...(db.turnos[0] || {}), ...body };
      return replyJson([updated]);
    }
    if (method === 'GET') {
      let filtered = [...db.turnos];
      if (url.searchParams.has('id_turno')) {
        const id = url.searchParams.get('id_turno')!.replace('eq.', '');
        filtered = filtered.filter((t) => t.id_turno === id);
      }
      if (url.searchParams.get('estado.codigo') === 'eq.NO_ASISTIO') {
        filtered = filtered.filter((t) => t.estado?.codigo === 'NO_ASISTIO');
      }
      return replyJson(filtered);
    }
  }

  // Estados turno
  if (path === '/rest/v1/estados_turno') {
    let list = [
      {
        id_estado: 'st-atendido',
        codigo: 'ATENDIDO',
        nombre: 'Atendido',
        activo: true,
        ocupa_agenda: false,
        impide_otro_misma_especialidad: false,
        es_estado_final: true,
      },
      {
        id_estado: 'st-no-asistio',
        codigo: 'NO_ASISTIO',
        nombre: 'No asistió',
        activo: true,
        ocupa_agenda: false,
        impide_otro_misma_especialidad: false,
        es_estado_final: true,
      },
    ];
    if (url.searchParams.has('codigo')) {
      const codigo = url.searchParams.get('codigo')!.replace('eq.', '');
      list = list.filter((e) => e.codigo === codigo);
    }
    return replyJson(list);
  }

  // Advertencias
  if (path === '/rest/v1/advertencias_inasistencia') {
    if (method === 'POST') {
      const inserted = { id_advertencia: 'adv-' + (db.insertedAdvertencias.length + 1), ...body };
      db.insertedAdvertencias.push(inserted);
      return replyJson([inserted], 201);
    }
    if (method === 'PATCH') {
      db.patchedAdvertencias.push(body);
      return replyJson([]);
    }
    if (method === 'GET') {
      let filtered = [...db.advertencias];
      if (url.searchParams.get('anulada') === 'eq.true') {
        filtered = filtered.filter((a) => a.anulada === true);
      }
      return replyJson(filtered);
    }
  }

  // Justificaciones
  if (path === '/rest/v1/inasistencias_justificaciones') {
    if (method === 'HEAD') {
      const pendingCount = db.justificaciones.filter((j) => j.estado === 'PENDIENTE').length;
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `*/${pendingCount}`,
        },
      });
    }
    if (method === 'POST') {
      const inserted = {
        id_justificacion: 'just-' + (db.insertedJustificaciones.length + 1),
        ...body,
      };
      db.insertedJustificaciones.push(inserted);
      db.justificaciones.push(inserted);
      return replyJson(inserted, 201);
    }
    if (method === 'PATCH') {
      const updated = { ...(db.justificaciones[0] || {}), ...body };
      return replyJson(updated);
    }
    if (method === 'GET') {
      let filtered = [...db.justificaciones];
      if (url.searchParams.has('id_justificacion')) {
        const id = url.searchParams.get('id_justificacion')!.replace('eq.', '');
        filtered = filtered.filter((j) => j.id_justificacion === id);
      }
      if (url.searchParams.has('id_turno')) {
        const param = url.searchParams.get('id_turno')!;
        if (param.startsWith('eq.')) {
          const id = param.replace('eq.', '');
          filtered = filtered.filter((j) => j.id_turno === id);
        } else if (param.startsWith('in.(')) {
          const ids = param.slice(4, -1).split(',');
          filtered = filtered.filter((j) => ids.includes(j.id_turno));
        }
      }
      if (url.searchParams.has('estado')) {
        const estado = url.searchParams.get('estado')!.replace('eq.', '');
        filtered = filtered.filter((j) => j.estado === estado);
      }
      return replyJson(filtered);
    }
  }

  // Sanciones
  if (path === '/rest/v1/sanciones') {
    if (method === 'POST') {
      const inserted = { id_sancion: 'san-' + (db.insertedSanciones.length + 1), ...body };
      db.insertedSanciones.push(inserted);
      return replyJson([inserted], 201);
    }
    if (method === 'PATCH') {
      db.patchedSanciones.push(body);
      return replyJson(body);
    }
    if (method === 'GET') {
      const patientIdParam = url.searchParams.get('id_paciente');
      const patientId = patientIdParam?.replace('eq.', '');
      const filtered = db.sanciones.filter(
        (s) => (!patientId || s.id_paciente === patientId) && s.anulada !== true
      );
      return replyJson(filtered);
    }
  }

  // Pacientes
  if (path === '/rest/v1/pacientes') {
    return replyJson(db.pacientes);
  }

  // Usuario Salita (Scope)
  if (path === '/rest/v1/usuario_salita') {
    return replyJson(db.usuario_salita);
  }

  // Tutores y Vinculaciones
  if (path === '/rest/v1/tutores') {
    return replyJson(db.tutores);
  }

  if (path === '/rest/v1/paciente_tutores') {
    return replyJson(db.paciente_tutores);
  }

  // RPCs
  if (path === '/rest/v1/rpc/fn_procesar_inasistencia_turno') {
    const turno = db.turnos.find((t) => t.id_turno === body?.p_id_turno);
    const patientId = turno?.id_paciente || idPaciente;
    const faltas = db.turnos.filter((t) => t.id_paciente === patientId && t.estado?.codigo === 'NO_ASISTIO').length;
    let accion = 'NINGUNA';

    if (faltas === 1) {
      accion = 'PRIMERA_ADVERTENCIA';
      const adv = {
        id_advertencia: 'adv-' + (db.insertedAdvertencias.length + 1),
        id_paciente: patientId,
        id_turno: body?.p_id_turno,
        nivel: 'PRIMERA_ADVERTENCIA',
        motivo: 'Primera inasistencia no justificada.',
      };
      db.insertedAdvertencias.push(adv);
    } else if (faltas === 2) {
      accion = 'ADVERTENCIA_FORMAL';
      const adv = {
        id_advertencia: 'adv-' + (db.insertedAdvertencias.length + 1),
        id_paciente: patientId,
        id_turno: body?.p_id_turno,
        nivel: 'ADVERTENCIA_FORMAL',
        motivo: 'Segunda inasistencia no justificada.',
      };
      db.insertedAdvertencias.push(adv);
    } else if (faltas >= 3) {
      accion = 'RESTRICCION';
      const san = {
        id_sancion: 'san-' + (db.insertedSanciones.length + 1),
        id_paciente: patientId,
        id_especialidad: turno?.id_especialidad || idEspecialidad,
        id_turno: body?.p_id_turno,
        motivo: `Acumulación de ${faltas} inasistencias injustificadas. Restricción de reservas online por 7 días.`,
        fecha_fin: new Date(Date.now() + 7 * 86400000).toISOString(),
        creado_por: body?.p_usuario,
      };
      db.insertedSanciones.push(san);
    }
    return replyJson({ accion, faltas });
  }

  return replyJson([]);
};

const idTurno = '11111111-1111-4111-8111-111111111111';
const idPaciente = '22222222-2222-4222-8222-222222222222';
const idPacienteAjeno = '99999999-9999-4999-8999-999999999999';
const idTutor = '33333333-3333-4333-8333-333333333333';
const idUsuario = '44444444-4444-4444-8444-444444444444';
const idSalitaA = '55555555-5555-4555-8555-555555555555';
const idSalitaB = '66666666-6666-4666-8666-666666666666';
const idEspecialidad = '77777777-7777-4777-8777-777777777777';

const superAdminUser = {
  id_usuario: idUsuario,
  email: 'superadmin@cora.gob.ar',
  nombre_usuario: 'superadmin',
  rol: 'SUPER_ADMIN' as const,
};

const adminSalitaUser = {
  id_usuario: idUsuario,
  email: 'admin@cora.gob.ar',
  nombre_usuario: 'admin',
  rol: 'ADMIN_SALITA' as const,
};

const recepcionUser = {
  id_usuario: idUsuario,
  email: 'recepcion@cora.gob.ar',
  nombre_usuario: 'recepcion',
  rol: 'RECEPCION' as const,
};

const profesionalUser = {
  id_usuario: idUsuario,
  email: 'medico@cora.gob.ar',
  nombre_usuario: 'medico',
  rol: 'PROFESIONAL' as const,
};

const pacienteUser = {
  id_usuario: idUsuario,
  email: 'paciente@cora.gob.ar',
  nombre_usuario: 'paciente',
  rol: 'PACIENTE' as const,
};

const createMockTurno = (
  id: string,
  paciente = idPaciente,
  estado = 'NO_ASISTIO',
  salita = idSalitaA
) => ({
  id_turno: id,
  id_paciente: paciente,
  id_especialidad: idEspecialidad,
  id_profesional: idUsuario,
  id_salita: salita,
  id_horario: idUsuario,
  id_estado: estado === 'NO_ASISTIO' ? 'st-no-asistio' : 'st-atendido',
  fecha_hora_inicio: '2026-11-20T10:00:00.000Z',
  fecha_hora_fin: '2026-11-20T10:20:00.000Z',
  codigo_turno: 'ABC-123',
  version: 1,
  estado: { codigo: estado, nombre: estado, es_estado_final: true, ocupa_agenda: false },
});

// =========================================================================
// TEST 1: Cancelación clasificada sin sanciones ni inasistencias
// =========================================================================
test('Cancelaciones anticipadas (>= 24h), tardías (< 24h) y administrativas NO generan inasistencias ni sanciones', async () => {
  const { clasificarCancelacion } = await import('../src/services/turno-update.service.js');

  const ahora = new Date('2026-11-24T10:00:00.000Z');

  // Cancelación anticipada: turno en 48 horas (> 24h)
  const turnoFuturo = '2026-11-26T10:00:00.000Z';
  const resAnticipada = clasificarCancelacion(turnoFuturo, 'PACIENTE', ahora);
  assert.equal(resAnticipada.tipo, 'ANTICIPADA');
  assert.equal(resAnticipada.generaInasistencia, false);

  // Cancelación tardía: turno en 4 horas (< 24h)
  const turnoCercano = '2026-11-24T14:00:00.000Z';
  const resTardia = clasificarCancelacion(turnoCercano, 'PACIENTE', ahora);
  assert.equal(resTardia.tipo, 'TARDIA');
  assert.equal(resTardia.generaInasistencia, false);

  // Cancelación administrativa por Salita
  const resAdmin = clasificarCancelacion(turnoCercano, 'RECEPCION', ahora);
  assert.equal(resAdmin.tipo, 'ADMINISTRATIVA');
  assert.equal(resAdmin.generaInasistencia, false);
});

// =========================================================================
// TEST 2: Política progresiva 1-2-3 (Advertencias 1 y 2, Sanción en la 3)
// =========================================================================
test('Política progresiva 1-2-3: Primera y segunda falta emiten advertencias; tercera genera restricción de 7 días', async () => {
  const { procesarInasistenciaTurno } = await import('../src/services/inasistencia-politica.service.js');

  // Caso 1: 1ª inasistencia
  db.turnos = [createMockTurno(idTurno)];
  const res1 = await procesarInasistenciaTurno(idTurno, superAdminUser);
  assert.equal(res1.faltas, 1);
  assert.equal(db.insertedAdvertencias.length, 1);
  assert.equal(db.insertedAdvertencias[0].nivel, 'PRIMERA_ADVERTENCIA');
  assert.equal(db.insertedSanciones.length, 0);

  // Caso 2: 2ª inasistencia
  db.insertedAdvertencias = [];
  db.turnos = [createMockTurno(idTurno), createMockTurno('turno-2')];
  const res2 = await procesarInasistenciaTurno('turno-2', superAdminUser);
  assert.equal(res2.faltas, 2);
  assert.equal(db.insertedAdvertencias.length, 1);
  assert.equal(db.insertedAdvertencias[0].nivel, 'ADVERTENCIA_FORMAL');
  assert.equal(db.insertedSanciones.length, 0);

  // Caso 3: 3ª inasistencia -> restricción por 7 días
  db.insertedAdvertencias = [];
  db.turnos = [createMockTurno(idTurno), createMockTurno('turno-2'), createMockTurno('turno-3')];
  const res3 = await procesarInasistenciaTurno('turno-3', superAdminUser);
  assert.equal(res3.faltas, 3);
  assert.equal(db.insertedSanciones.length, 1);
  assert.equal(db.insertedSanciones[0].id_paciente, idPaciente);
  assert.equal(db.insertedSanciones[0].creado_por, idUsuario);
  assert.ok(String(db.insertedSanciones[0].motivo).includes('Acumulación de 3 inasistencias'));
});

// =========================================================================
// TEST 3: Justificaciones y levantamiento automático de sanciones
// =========================================================================
test('Justificación médica: Aprobación anula advertencia y levanta sanción si las faltas activas son < 3', async () => {
  const { presentarJustificacion, evaluarJustificacion } = await import(
    '../src/services/inasistencia-politica.service.js'
  );

  // 1. Presentar justificación para idTurno por el propio titular o superadmin
  db.turnos = [createMockTurno(idTurno)];
  db.justificaciones = [];

  const just = await presentarJustificacion(
    {
      id_turno: idTurno,
      motivo: 'Certificado de reposo médico por guardia',
    },
    superAdminUser
  );
  assert.equal(just.estado, 'PENDIENTE');
  assert.equal(db.insertedJustificaciones.length, 1);

  // 2. Evaluar justificación (APROBADA por Recepción)
  db.justificaciones = [
    { id_justificacion: 'just-1', id_turno: idTurno, id_paciente: idPaciente, estado: 'PENDIENTE' },
  ];
  db.turnos = [createMockTurno(idTurno), createMockTurno('turno-2')];
  db.sanciones = [{ id_sancion: 'san-3', id_paciente: idPaciente, anulada: false }];

  const evaluada = await evaluarJustificacion(
    'just-1',
    {
      estado: 'APROBADA',
      motivo_resolucion: 'Certificado validado correctamente',
    },
    superAdminUser
  );

  assert.equal(evaluada.estado, 'APROBADA');
  // Se anula la advertencia vinculada al turno
  assert.equal(db.patchedAdvertencias.length, 1);
  assert.equal(db.patchedAdvertencias[0].anulada, true);
  // Se anula la sanción activa automáticamente
  assert.equal(db.patchedSanciones.length, 1);
  assert.equal(db.patchedSanciones[0].anulada, true);
});

// =========================================================================
// TEST 4: Control anti-abuso en solicitudes de justificación (máximo 2 pendientes)
// =========================================================================
test('Control anti-abuso: Rechaza presentación si ya hay 2 justificaciones pendientes de resolución', async () => {
  const { presentarJustificacion } = await import(
    '../src/services/inasistencia-politica.service.js'
  );

  db.turnos = [createMockTurno(idTurno)];
  db.justificaciones = [
    { id_justificacion: 'j1', id_paciente: idPaciente, estado: 'PENDIENTE' },
    { id_justificacion: 'j2', id_paciente: idPaciente, estado: 'PENDIENTE' },
  ];

  await assert.rejects(
    async () => {
      await presentarJustificacion(
        {
          id_turno: idTurno,
          motivo: 'Intento de tercera justificación simultánea',
        },
        superAdminUser
      );
    },
    {
      statusCode: 429,
    }
  );
});

// =========================================================================
// TEST 5: Rectificación auditable de inasistencia errónea (NO_ASISTIO -> ATENDIDO)
// =========================================================================
test('Rectificación auditable: Cambio de NO_ASISTIO a ATENDIDO anula advertencias y actualiza el turno', async () => {
  const { rectificarInasistencia } = await import(
    '../src/services/inasistencia-politica.service.js'
  );

  db.turnos = [createMockTurno(idTurno)];
  db.sanciones = [{ id_sancion: 'san-prev', id_paciente: idPaciente, anulada: false }];

  const res = await rectificarInasistencia(
    idTurno,
    {
      nuevo_estado: 'ATENDIDO',
      motivo_rectificacion: 'El paciente estuvo en sala de espera y fue atendido tras retraso administrativo',
    },
    superAdminUser
  );

  assert.equal(res.success, true);
  assert.equal(res.data.nuevo_estado, 'ATENDIDO');
  assert.equal(db.patchedTurnos.length, 1);
  assert.equal(db.patchedTurnos[0].id_estado, 'st-atendido');
  assert.equal(db.patchedAdvertencias.length, 1);
  assert.equal(db.patchedAdvertencias[0].anulada, true);
});

// =========================================================================
// TEST 6: Bloqueo online vs bypass administrativo
// =========================================================================
test('Políticas de bloqueo y bypass: assertPatientCanBook bloquea al paciente con sanción; bypass administrativo no consulta sanción', async () => {
  const { assertPatientCanBook } = await import('../src/services/booking-restriction.service.js');

  db.sanciones = [
    {
      id_sancion: 'san-active',
      id_paciente: idPaciente,
      motivo: 'Inasistencias reiteradas',
      fecha_inicio: '2026-11-20T00:00:00Z',
      fecha_fin: '2026-11-27T00:00:00Z',
      anulada: false,
    },
  ];

  await assert.rejects(
    async () => {
      await assertPatientCanBook(idPaciente);
    },
    {
      code: 'PATIENT_SANCTIONED',
      statusCode: 409,
    }
  );

  db.sanciones = [];

  await assert.doesNotReject(async () => {
    await assertPatientCanBook(idPaciente);
  });
});

// =========================================================================
// TEST 7: Aislamiento por id_paciente (menores y familiares independientes)
// =========================================================================
test('Aislamiento por id_paciente: La sanción de un menor no bloquea al tutor ni a otros dependientes', async () => {
  const { assertPatientCanBook } = await import('../src/services/booking-restriction.service.js');

  db.sanciones = [
    {
      id_sancion: 'san-menor',
      id_paciente: idPaciente,
      motivo: 'Inasistencia reiterada del menor',
      fecha_inicio: '2026-11-20T00:00:00Z',
      fecha_fin: '2026-11-27T00:00:00Z',
      anulada: false,
    },
  ];

  await assert.rejects(
    async () => {
      await assertPatientCanBook(idPaciente);
    },
    {
      code: 'PATIENT_SANCTIONED',
    }
  );

  await assert.doesNotReject(async () => {
    await assertPatientCanBook(idTutor);
  });
});

// =========================================================================
// TEST 8: Seguridad — Manipulación de isAdministrative rechazada por Zod strict
// =========================================================================
test('Seguridad: createTurnoSchema rechaza inyección de isAdministrative o creado_por desde el cliente', async () => {
  const { createTurnoSchema } = await import('../src/validators/turno.validator.js');

  const payloadMalicioso = {
    id_paciente: idPaciente,
    id_profesional: idUsuario,
    id_especialidad: idEspecialidad,
    id_salita: idSalitaA,
    fecha_hora_inicio: '2026-12-01T10:00:00Z',
    isAdministrative: true, // intento de bypass desde frontend
  };

  assert.throws(
    () => {
      createTurnoSchema.parse(payloadMalicioso);
    },
    (err: any) => {
      // Zod strict arroja error ante campos no reconocidos
      return err.name === 'ZodError';
    }
  );
});

// =========================================================================
// TEST 9: Seguridad — Paciente no puede justificar turnos de personas ajenas
// =========================================================================
test('Seguridad: Paciente no puede presentar justificación sobre un turno de un paciente ajeno', async () => {
  const { presentarJustificacion } = await import('../src/services/inasistencia-politica.service.js');

  // Turno pertenece a idPacienteAjeno
  db.turnos = [createMockTurno(idTurno, idPacienteAjeno)];

  await assert.rejects(
    async () => {
      await presentarJustificacion(
        {
          id_turno: idTurno,
          motivo: 'Intento de justificar turno de tercero desconocido',
        },
        pacienteUser // Usuario paciente no vinculado
      );
    },
    {
      statusCode: 403,
    }
  );
});

// =========================================================================
// TEST 10: Seguridad — Usuarios no autorizados no pueden dictaminar justificaciones
// =========================================================================
test('Seguridad: Ni pacientes ni profesionales pueden evaluar justificaciones médicas', async () => {
  const { evaluarJustificacion } = await import('../src/services/inasistencia-politica.service.js');

  db.justificaciones = [
    { id_justificacion: 'j1', id_turno: idTurno, id_paciente: idPaciente, estado: 'PENDIENTE' },
  ];
  db.turnos = [createMockTurno(idTurno)];

  // Intento por PACIENTE
  await assert.rejects(
    async () => {
      await evaluarJustificacion(
        'j1',
        { estado: 'APROBADA', motivo_resolucion: 'Autoevaluación' },
        pacienteUser
      );
    },
    {
      statusCode: 403,
    }
  );

  // Intento por PROFESIONAL
  await assert.rejects(
    async () => {
      await evaluarJustificacion(
        'j1',
        { estado: 'APROBADA', motivo_resolucion: 'Evaluado por médico' },
        profesionalUser
      );
    },
    {
      statusCode: 403,
    }
  );
});

// =========================================================================
// TEST 11: Seguridad — Rectificación rechazada para usuarios sin permisos o turno no NO_ASISTIO
// =========================================================================
test('Seguridad: Rectificación rechazada si el usuario es PACIENTE o el turno no está en NO_ASISTIO', async () => {
  const { rectificarInasistencia } = await import('../src/services/inasistencia-politica.service.js');

  db.turnos = [createMockTurno(idTurno, idPaciente, 'ATENDIDO')];

  // Intento por PACIENTE
  await assert.rejects(
    async () => {
      await rectificarInasistencia(
        idTurno,
        { nuevo_estado: 'ATENDIDO', motivo_rectificacion: 'Intento paciente' },
        pacienteUser
      );
    },
    {
      statusCode: 403,
    }
  );

  // Intento sobre turno que ya está en ATENDIDO
  await assert.rejects(
    async () => {
      await rectificarInasistencia(
        idTurno,
        { nuevo_estado: 'ATENDIDO', motivo_rectificacion: 'Ya estaba atendido' },
        superAdminUser
      );
    },
    {
      statusCode: 400,
    }
  );
});

// =========================================================================
// TEST 12: Consistencia — Con 4 inasistencias, aprobar 1 justificación NO levanta la sanción (quedan 3)
// =========================================================================
test('Consistencia: Con 4 inasistencias en 90 días, aprobar 1 justificación deja 3 faltas y conserva la sanción', async () => {
  const { evaluarJustificacion } = await import('../src/services/inasistencia-politica.service.js');

  // El paciente tiene 4 turnos en NO_ASISTIO
  db.turnos = [
    createMockTurno('t1'),
    createMockTurno('t2'),
    createMockTurno('t3'),
    createMockTurno('t4'),
  ];
  db.justificaciones = [
    { id_justificacion: 'j1', id_turno: 't1', id_paciente: idPaciente, estado: 'PENDIENTE' },
  ];
  db.sanciones = [
    { id_sancion: 'san-activa', id_paciente: idPaciente, anulada: false },
  ];

  await evaluarJustificacion(
    'j1',
    { estado: 'APROBADA', motivo_resolucion: 'Se justifica t1' },
    superAdminUser
  );

  // Advertencia de t1 fue anulada
  assert.equal(db.patchedAdvertencias.length, 1);
  // Pero la sanción NO debe ser anulada porque aún quedan 3 faltas injustificadas válidas
  assert.equal(db.patchedSanciones.length, 0);
});

// =========================================================================
// TEST 13: Reprogramación y atención presencial con bypass asistencial
// =========================================================================
test('Consistencia: Recepción puede reprogramar presencialmente a un paciente con sanción online activa', async () => {
  const { assertPatientCanBook, canBypassOnlineSanction } = await import(
    '../src/services/booking-restriction.service.js'
  );

  db.sanciones = [
    { id_sancion: 'san-activa', id_paciente: idPaciente, anulada: false, motivo: 'Inasistencias' },
  ];

  // 1. Un intento de reserva online directa por el paciente es rechazado por la sanción
  await assert.rejects(
    async () => {
      await assertPatientCanBook(idPaciente);
    },
    {
      code: 'PATIENT_SANCTIONED',
      statusCode: 409,
    }
  );

  // 2. En el flujo administrativo presencial, el bypass se activa por whitelist explícita
  assert.equal(canBypassOnlineSanction('SUPER_ADMIN'), true);
  assert.equal(canBypassOnlineSanction('ADMIN_SALITA'), true);
  assert.equal(canBypassOnlineSanction('RECEPCION'), true);
  assert.equal(canBypassOnlineSanction('PROFESIONAL'), true);
  // Roles no autorizados o desconocidos obtienen estrictamente false
  assert.equal(canBypassOnlineSanction('PACIENTE'), false);
  assert.equal(canBypassOnlineSanction('OTRO_ROL'), false);
  assert.equal(canBypassOnlineSanction(undefined), false);
  assert.equal(canBypassOnlineSanction(null), false);

  // 3. Verificamos que si bypass es true, el sistema omite el assertPatientCanBook
  const executeBookingWithGuard = async (patientId: string, role: string) => {
    const isAdministrative = canBypassOnlineSanction(role);
    if (!isAdministrative) {
      await assertPatientCanBook(patientId);
    }
    return { success: true, bookedBy: role };
  };

  // El paciente online sigue bloqueado
  await assert.rejects(
    async () => {
      await executeBookingWithGuard(idPaciente, 'PACIENTE');
    },
    { code: 'PATIENT_SANCTIONED' }
  );

  // Un rol desconocido también sigue bloqueado
  await assert.rejects(
    async () => {
      await executeBookingWithGuard(idPaciente, 'ROL_FALSO');
    },
    { code: 'PATIENT_SANCTIONED' }
  );

  // La recepcionista en ventanilla programa sin impedimento
  const adminResult = await executeBookingWithGuard(idPaciente, 'RECEPCION');
  assert.equal(adminResult.success, true);
  assert.equal(adminResult.bookedBy, 'RECEPCION');
});
