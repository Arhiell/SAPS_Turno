import test from 'node:test';
import assert from 'node:assert/strict';
import { advertenciasQuerySchema } from '../src/validators/inasistencia-politica.validator.js';

test('advertenciasQuerySchema valida correctamente los tres niveles de la política progresiva', () => {
  // Nivel 1: Primera advertencia
  const q1 = advertenciasQuerySchema.parse({ nivel: 'PRIMERA_ADVERTENCIA' });
  assert.equal(q1.nivel, 'PRIMERA_ADVERTENCIA');

  // Nivel 2: Advertencia formal
  const q2 = advertenciasQuerySchema.parse({ nivel: 'ADVERTENCIA_FORMAL' });
  assert.equal(q2.nivel, 'ADVERTENCIA_FORMAL');

  // Nivel 3: Restricción (3/3)
  const q3 = advertenciasQuerySchema.parse({ nivel: 'RESTRICCION' });
  assert.equal(q3.nivel, 'RESTRICCION');

  // Sin nivel (Todos los niveles)
  const qTodos = advertenciasQuerySchema.parse({});
  assert.equal(qTodos.nivel, undefined);

  // Valor inválido es rechazado por zod
  assert.throws(() => {
    advertenciasQuerySchema.parse({ nivel: 'INEXISTENTE' });
  });
});

test('advertenciasQuerySchema valida filtros combinados con nivel RESTRICCION', () => {
  const queryCompleta = advertenciasQuerySchema.parse({
    nivel: 'RESTRICCION',
    anulada: 'false',
    fecha_desde: '2026-01-01',
    fecha_hasta: '2026-12-31',
    search: 'Valdez',
    page: '1',
    limit: '15',
  });

  assert.equal(queryCompleta.nivel, 'RESTRICCION');
  assert.equal(queryCompleta.anulada, 'false');
  assert.equal(queryCompleta.fecha_desde, '2026-01-01');
  assert.equal(queryCompleta.fecha_hasta, '2026-12-31');
  assert.equal(queryCompleta.search, 'Valdez');
  assert.equal(queryCompleta.page, 1);
  assert.equal(queryCompleta.limit, 15);
});
