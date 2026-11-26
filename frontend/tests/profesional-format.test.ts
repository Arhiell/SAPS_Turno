import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatProfesionalName } from '../src/utils/profesional-format.ts';

test('formatProfesionalName: formatea sin inventar título cuando no existe denominación', () => {
  const prof = {
    id_profesional: 'p1',
    matricula: 'MN-1234',
    persona: {
      nombres: 'Carlos',
      apellidos: 'Gómez',
    },
  };

  assert.equal(formatProfesionalName(prof), 'Gómez, Carlos');
  assert.equal(formatProfesionalName(prof, { order: 'nombres-primero' }), 'Carlos Gómez');
  assert.equal(
    formatProfesionalName(prof, { includeMatricula: true }),
    'Gómez, Carlos · Matrícula MN-1234'
  );
  assert.equal(
    formatProfesionalName(prof, { includeMatricula: true, matriculaPrefix: 'Mat.' }),
    'Gómez, Carlos · Mat. MN-1234'
  );
});

test('formatProfesionalName: respeta denominación real cuando está presente en los datos', () => {
  const profConTitulo = {
    id_profesional: 'p2',
    titulo: 'Lic.',
    matricula: 'MP-5678',
    persona: {
      nombres: 'María',
      apellidos: 'Rodríguez',
    },
  };

  assert.equal(formatProfesionalName(profConTitulo), 'Lic. Rodríguez, María');
  assert.equal(formatProfesionalName(profConTitulo, { order: 'nombres-primero' }), 'Lic. María Rodríguez');
  assert.equal(
    formatProfesionalName(profConTitulo, { includeMatricula: true }),
    'Lic. Rodríguez, María · Matrícula MP-5678'
  );
});

test('formatProfesionalName: respeta denominación cuando viene en el objeto persona', () => {
  const profPersonaTitulo = {
    id_profesional: 'p3',
    persona: {
      nombres: 'Lucía',
      apellidos: 'Fernández',
      denominacion: 'Odont.',
    },
  };

  assert.equal(formatProfesionalName(profPersonaTitulo), 'Odont. Fernández, Lucía');
});

test('formatProfesionalName: maneja casos borde, datos nulos o vacíos', () => {
  assert.equal(formatProfesionalName(null), 'Profesional sin asignar');
  assert.equal(formatProfesionalName(undefined), 'Profesional sin asignar');
  assert.equal(formatProfesionalName({}), 'Profesional sin datos');
  assert.equal(
    formatProfesionalName({ persona: { nombres: '', apellidos: '' } }),
    'Profesional sin datos'
  );
  assert.equal(
    formatProfesionalName({ persona: { nombres: 'Juan', apellidos: '' } }),
    'Juan'
  );
  assert.equal(
    formatProfesionalName({ persona: { nombres: '', apellidos: 'Benítez' } }),
    'Benítez'
  );
});
