import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { queue, drained, id, user, turno } from './turno-fixtures.js';
import { generateTurnoCode } from '../src/utils/turno-code.js';
import { turnoReferenceSchema, turnoIdSchema } from '../src/validators/turno-query.validator.js';
const { insertTurno } = await import('../src/repositories/turno.repository.js');
const { getTurno } = await import('../src/services/turno-read.service.js');
afterEach(drained);

const code = 'T-7K9M2X4P';
const insert = {
  id_paciente: id, id_profesional: id, id_especialidad: id, id_salita: id,
  id_horario: id, id_estado: id, creado_por: id,
  fecha_hora_inicio: turno.fecha_hora_inicio, fecha_hora_fin: turno.fecha_hora_fin,
};

test('Conserva el código interno original y admite referencias visibles de seis caracteres', () => {
  for (let i = 0; i < 100; i++) assert.match(generateTurnoCode(), /^T-[a-f0-9]{28}$/);
  assert.equal(turnoReferenceSchema.parse({ id: code.toLowerCase() }).id, code);
  assert.equal(turnoReferenceSchema.parse({ id }).id, id);
  assert.equal(turnoReferenceSchema.parse({ id: '9518e4' }).id, '9518E4');
  assert.equal(turnoReferenceSchema.safeParse({ id: 'T-00000000' }).success, false);
  assert.equal(turnoReferenceSchema.safeParse({ id: 'T-x,or(id_turno)' }).success, false);
  assert.equal(turnoIdSchema.safeParse({ id: code }).success, false);
});

const legacyCode = 'T-a6ba0b34df6d4bdbaf398b9518e4';

test('El enlace largo obtiene la referencia visible de seis caracteres sin escribir datos', async () => {
  queue({ table: 'turnos', result: [{ ...turno, codigo_turno: legacyCode }] },
    { table: 'turnos', result: [{ id_turno: id }], check: url => {
      assert.equal(url.searchParams.get('or'),
        '(codigo_turno.eq.9518E4,codigo_turno.ilike.T-______________________9518E4,codigo_turno.ilike.T-__9518E4)');
      assert.equal(url.searchParams.get('limit'), '2');
    } });
  const result = await getTurno(legacyCode, user);
  assert.equal(result.codigo_turno, legacyCode);
  assert.equal('codigo_url' in result && result.codigo_url, '9518E4');
});

test('El enlace de seis caracteres abre el mismo turno original', async () => {
  queue({ table: 'turnos', result: [{ id_turno: id }] },
    { table: 'turnos', result: [{ ...turno, codigo_turno: legacyCode }] });
  const result = await getTurno('9518E4', user);
  assert.equal(result.id_turno, id);
  assert.equal('codigo_url' in result && result.codigo_url, '9518E4');
});

test('Los enlaces de ocho caracteres existentes conservan una referencia visible de seis', async () => {
  queue({ table: 'turnos', result: [{ ...turno, codigo_turno: code }] },
    { table: 'turnos', result: [{ id_turno: id }] });
  const result = await getTurno(code, user);
  assert.equal('codigo_url' in result && result.codigo_url, '9M2X4P');
  queue({ table: 'turnos', result: [{ id_turno: id }] },
    { table: 'turnos', result: [{ ...turno, codigo_turno: code }] });
  assert.equal((await getTurno('9M2X4P', user)).id_turno, id);
});

test('Dos referencias iguales no abren un turno arbitrario; el enlace completo sigue funcionando', async () => {
  const matches = [{ id_turno: id }, { id_turno: 'otro-turno' }];
  queue({ table: 'turnos', result: matches });
  await assert.rejects(getTurno('9518E4', user), { statusCode: 409 });
  queue({ table: 'turnos', result: [{ ...turno, codigo_turno: legacyCode }] },
    { table: 'turnos', result: matches });
  const result = await getTurno(id, user);
  assert.equal('codigo_url' in result && result.codigo_url, legacyCode);
});

test('La referencia corta respeta el alcance de la salita', async () => {
  queue({ table: 'usuario_salita', result: [] },
    { table: 'turnos', result: [{ id_turno: id }] },
    { table: 'turnos', result: [{ ...turno, codigo_turno: legacyCode }] });
  await assert.rejects(getTurno('9518E4', { ...user, rol: 'ADMIN_SALITA' }), { statusCode: 403 });
});

test('Una referencia corta inexistente devuelve 404 sin escribir datos', async () => {
  queue({ table: 'turnos', result: [] });
  await assert.rejects(getTurno('9518E4', user), { statusCode: 404 });
});

test('Consulta el código completo por igualdad y conserva la lectura por UUID', async () => {
  for (const reference of [code, id]) {
    queue({ table: 'turnos', result: [{ ...turno, codigo_turno: code }], check: url => {
      const column = reference === code ? 'codigo_turno' : 'id_turno';
      assert.equal(url.searchParams.get(column), `eq.${reference}`);
    } }, { table: 'turnos', result: [{ id_turno: id }] });
    assert.equal((await getTurno(reference, user)).id_turno, id);
  }
});

test('Conocer el código no habilita el acceso a otra salita', async () => {
  queue({ table: 'usuario_salita', result: [] }, { table: 'turnos', result: [turno] });
  await assert.rejects(getTurno(code, { ...user, rol: 'ADMIN_SALITA' }), { statusCode: 403 });
});

test('Conocer el código no habilita el acceso a otro profesional', async () => {
  queue({ table: 'usuarios', result: [{ ...user, id_persona: id }] },
    { table: 'profesionales', result: [{ id_profesional: 'otro-profesional' }] },
    { table: 'turnos', result: [turno] });
  await assert.rejects(getTurno(code, { ...user, rol: 'PROFESIONAL' }), { statusCode: 403 });
});

test('Un código inexistente devuelve 404', async () => {
  queue({ table: 'turnos', result: [] });
  await assert.rejects(getTurno(code, user), { statusCode: 404 });
});

test('Reintenta exclusivamente una colisión de código bajo la restricción UNIQUE', async () => {
  let firstCode: unknown;
  queue({ table: 'turnos', method: 'POST', status: 409,
    result: { code: '23505', message: 'duplicate key violates unique constraint "turnos_codigo_turno_key"' },
    check: (_, body) => { firstCode = body?.codigo_turno; } },
  { table: 'turnos', method: 'POST', result: turno, check: (_, body) => {
    assert.match(String(body?.codigo_turno), /^T-[a-f0-9]{28}$/);
    assert.notEqual(body?.codigo_turno, firstCode);
  } });
  assert.equal((await insertTurno(insert)).id_turno, id);
});

test('No reintenta conflictos de paciente ni solapamientos de agenda', async () => {
  for (const error of [
    { code: '23505', message: 'duplicate key violates unique constraint "uq_turnos_paciente_especialidad"' },
    { code: '23P01', message: 'ex_turnos_profesional_solapados' },
  ]) {
    queue({ table: 'turnos', method: 'POST', status: 409, result: error });
    await assert.rejects(insertTurno(insert), { statusCode: 409 });
  }
});

test('Limita los reintentos ante colisiones persistentes de códigos', async () => {
  queue(...Array.from({ length: 5 }, () => ({ table: 'turnos', method: 'POST', status: 409,
    result: { code: '23505', message: 'duplicate key violates unique constraint "turnos_codigo_turno_key"' },
  })));
  await assert.rejects(insertTurno(insert), { statusCode: 409 });
});
