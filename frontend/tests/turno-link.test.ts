import assert from 'node:assert/strict';
import test from 'node:test';
import { turnoLink, turnoReference } from '../src/utils/turno-link.ts';
import { formatShortRef } from '../src/utils/turno-status.ts';

test('Los códigos de ocho caracteres existentes se muestran con seis', () => {
  const turno = { id_turno: 'uuid-interno', codigo_turno: 'T-7K9M2X4P' };
  assert.equal(turnoLink(turno), '/turnos/T-7K9M2X4P');
  assert.equal(turnoLink(turno, true), '/mis-turnos/T-7K9M2X4P');
  assert.equal(formatShortRef(turno.codigo_turno), '9M2X4P');
});

test('El detalle y los enlaces comparten la referencia visible de seis caracteres', () => {
  const turno = { id_turno: 'uuid-interno',
    codigo_turno: 'T-a6ba0b34df6d4bdbaf398b9518e4', codigo_url: '9518E4' };
  assert.equal(turnoReference(turno), '9518E4');
  assert.equal(turnoLink(turno), '/turnos/9518E4');
  assert.equal(turnoLink(turno, true), '/mis-turnos/9518E4');
});

test('Ante coincidencias conserva el enlace completo verificado por la API', () => {
  const code = 'T-a6ba0b34df6d4bdbaf398b9518e4';
  const turno = { id_turno: 'uuid-interno', codigo_turno: code, codigo_url: code };
  assert.equal(turnoReference(turno), code);
  assert.equal(formatShortRef(code), '9518E4');
  assert.equal(turnoLink(turno), `/turnos/${code}`);
});

test('Las respuestas que solo incluyen UUID conservan un enlace compatible', () => {
  assert.equal(turnoLink({ id_turno: 'uuid-interno' }), '/turnos/uuid-interno');
});
