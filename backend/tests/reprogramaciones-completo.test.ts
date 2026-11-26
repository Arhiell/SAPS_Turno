import test from 'node:test';
import assert from 'node:assert/strict';

import { agendaAvailabilitySchema } from '../src/validators/agenda-impacto.validator.js';
import { destinationAllowed } from '../src/services/agenda-propuesta.service.js';
import { getAgendaAvailability } from '../src/services/agenda-disponibilidad.service.js';
import { confirmAgendaProposal } from '../src/services/agenda-confirmacion.service.js';
import { getAgendaImpact } from '../src/services/agenda-impacto.service.js';

// Super admin user para pruebas
const testUser = {
  id_usuario: '11111111-1111-4111-8111-111111111111',
  email: 'superadmin@cora.gov.ar',
  nombre_usuario: 'superadmin',
  rol: 'SUPER_ADMIN',
  email_verificado: true,
  perfil_completo: true,
};

// 1. Validaciones del esquema de disponibilidad
test('agendaAvailabilitySchema acepta ventanas de días 7, 14, 30, 60 y 90', () => {
  const base = {
    cambio: {
      tipo: 'bloqueo' as const,
      datos: {
        id_profesional: '8d229a43-b047-4672-b52f-27d784aeed79',
        id_salita: '1572fdd1-44d7-47bf-8481-47e2c8865e23',
        fecha: '2026-12-01',
        dia_completo: true,
        motivo: 'Capacitación profesional',
      },
    },
    id_turno: 'f381c983-f949-43ac-8614-ef45d794c776',
  };

  for (const d of [7, 14, 30, 60, 90]) {
    const res = agendaAvailabilitySchema.safeParse({ ...base, dias: d });
    assert.equal(res.success, true, `Debe aceptar ${d} días`);
  }

  // Acepta fecha puntual
  const resFecha = agendaAvailabilitySchema.safeParse({ ...base, fecha: '2026-12-10' });
  assert.equal(resFecha.success, true, 'Debe aceptar fecha puntual');

  // Rechaza si falta tanto fecha como dias
  const resVacio = agendaAvailabilitySchema.safeParse(base);
  assert.equal(resVacio.success, false, 'Debe rechazar si no hay fecha ni días');

  // Rechaza días inválidos
  assert.equal(agendaAvailabilitySchema.safeParse({ ...base, dias: 0 }).success, false);
  assert.equal(agendaAvailabilitySchema.safeParse({ ...base, dias: 100 }).success, false);
  assert.equal(agendaAvailabilitySchema.safeParse({ ...base, dias: -5 }).success, false);
});

// 2. destinationAllowed para ausencias de día completo y por franjas horarias
test('destinationAllowed valida correctamente ausencias completas y parciales', () => {
  // Ausencia día completo 2026-12-15
  const ausenciaDiaCompleto = {
    tipo: 'bloqueo' as const,
    datos: {
      id_profesional: '00000000-0000-0000-0000-000000000001',
      id_salita: '00000000-0000-0000-0000-000000000002',
      fecha: '2026-12-15',
      dia_completo: true,
      motivo: 'Congreso médico',
    },
  };

  // Turno propuesto dentro del día de la ausencia -> debe rechazarse
  assert.equal(
    destinationAllowed(ausenciaDiaCompleto, 'h1', '2026-12-15T09:00:00-03:00', '2026-12-15T09:30:00-03:00'),
    false,
    'Debe rechazar turno en día de ausencia completa'
  );

  // Turno propuesto en día distinto -> permitido
  assert.equal(
    destinationAllowed(ausenciaDiaCompleto, 'h1', '2026-12-16T09:00:00-03:00', '2026-12-16T09:30:00-03:00'),
    true,
    'Debe permitir turno en día posterior no afectado'
  );

  // Ausencia por franja horaria: 2026-12-20 de 08:00 a 10:00
  const ausenciaFranja = {
    tipo: 'bloqueo' as const,
    datos: {
      id_profesional: '00000000-0000-0000-0000-000000000001',
      id_salita: '00000000-0000-0000-0000-000000000002',
      fecha: '2026-12-20',
      dia_completo: false,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      motivo: 'Trámite particular',
    },
  };

  // Turno que colisiona con la franja (08:30 a 09:00) -> rechazado
  assert.equal(
    destinationAllowed(ausenciaFranja, 'h1', '2026-12-20T08:30:00-03:00', '2026-12-20T09:00:00-03:00'),
    false,
    'Debe rechazar turno dentro de la franja horaria bloqueada'
  );

  // Turno el mismo día pero fuera de la franja (10:30 a 11:00) -> permitido
  assert.equal(
    destinationAllowed(ausenciaFranja, 'h1', '2026-12-20T10:30:00-03:00', '2026-12-20T11:00:00-03:00'),
    true,
    'Debe permitir turno el mismo día fuera de la franja bloqueada'
  );
});

// 3. Circuito real de detección y disponibilidad multifecha
test('getAgendaAvailability devuelve slots agrupados por fecha con formato en español', async () => {
  const cambio = {
    tipo: 'bloqueo' as const,
    datos: {
      id_profesional: '8d229a43-b047-4672-b52f-27d784aeed79',
      id_salita: '1572fdd1-44d7-47bf-8481-47e2c8865e23',
      fecha: '2026-11-29',
      dia_completo: true,
      motivo: 'Ausencia médica de prueba',
    },
  };

  const { afectados } = await getAgendaImpact(cambio, testUser as any);
  assert.ok(afectados.length > 0, 'Debe detectar turnos afectados en la fecha del bloqueo');

  const turnoAfectado = afectados[0];

  // Búsqueda a 7 días
  const res7 = await getAgendaAvailability(cambio, turnoAfectado.id_turno, { dias: 7 }, testUser as any);
  assert.equal(typeof res7.total_disponibles, 'number');
  assert.ok(res7.total_disponibles > 0, 'Debe encontrar horarios en 7 días');
  assert.ok(Array.isArray(res7.opciones));
  assert.ok(Array.isArray(res7.agrupadas_por_fecha));

  // Búsqueda a 30 días
  const res30 = await getAgendaAvailability(cambio, turnoAfectado.id_turno, { dias: 30 }, testUser as any);
  assert.ok(res30.total_disponibles >= res7.total_disponibles, '30 días debe ofrecer igual o más turnos que 7 días');

  // Verificamos estructura del agrupamiento
  const primerGrupo = res30.agrupadas_por_fecha[0];
  assert.ok(primerGrupo.fecha, 'Debe incluir fecha YYYY-MM-DD');
  assert.ok(primerGrupo.fecha_formateada, 'Debe incluir fecha formateada en español');
  assert.ok(primerGrupo.dia_semana, 'Debe incluir día de semana');
  assert.ok(primerGrupo.slots.length > 0, 'Debe contener slots');

  const slot = primerGrupo.slots[0];
  assert.ok(slot.id_horario, 'Slot debe tener id_horario');
  assert.ok(slot.hora_inicio, 'Slot debe tener hora_inicio');
  assert.ok(slot.hora_fin, 'Slot debe tener hora_fin');
  assert.ok(Date.parse(slot.fecha_hora_inicio) > Date.now(), 'Slot no puede ser en el pasado');
});

// 4. Protección contra colisiones y versiones en confirmación
test('confirmAgendaProposal rechaza turnos con versión desactualizada o en el pasado', async () => {
  const inputConfirm = {
    cambio: {
      tipo: 'bloqueo' as const,
      datos: {
        id_profesional: '00000000-0000-0000-0000-000000000001',
        id_salita: '00000000-0000-0000-0000-000000000002',
        fecha: '2026-12-01',
        dia_completo: true,
        motivo: 'Prueba',
      },
    },
    motivo: 'Reprogramación por ausencia',
    turnos: [
      {
        id_turno: '00000000-0000-0000-0000-000000000999',
        version: 999, // versión inexistente / no coincide
        id_horario: '00000000-0000-0000-0000-000000000004',
        fecha_hora_inicio: '2026-12-05T09:00:00-03:00',
      },
    ],
  };

  const resultado = await confirmAgendaProposal(inputConfirm, testUser as any);
  assert.equal(resultado.resultados.length, 1);
  assert.equal(resultado.resultados[0].confirmado, false);
  assert.match(resultado.resultados[0].mensaje, /El turno cambió, ya comenzó o dejó de estar afectado/);
});
