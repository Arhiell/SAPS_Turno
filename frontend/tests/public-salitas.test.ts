import test from 'node:test';
import assert from 'node:assert/strict';
import { formatZonaLabel, isDevelopmentTestNews, resolveActiveSalitaIndex } from '../src/utils/public-content.ts';

test('formatZonaLabel: evita duplicar la palabra "Zona" cuando ya viene provista', () => {
  // Caso exacto detectado en la auditoría visual: «Zona Zona Sur»
  assert.equal(formatZonaLabel('Zona Sur'), 'Zona Sur');
  assert.equal(formatZonaLabel('Zona Norte'), 'Zona Norte');
  assert.equal(formatZonaLabel('zona este'), 'Zona este');
  assert.equal(formatZonaLabel('Zona Centro'), 'Zona Centro');
});

test('formatZonaLabel: prefija "Zona " cuando solo se recibe el nombre del área', () => {
  assert.equal(formatZonaLabel('Sur'), 'Zona Sur');
  assert.equal(formatZonaLabel('Norte'), 'Zona Norte');
  assert.equal(formatZonaLabel('Rural'), 'Zona Rural');
});

test('formatZonaLabel: devuelve "Centro de Salud" si el campo está vacío o no definido', () => {
  assert.equal(formatZonaLabel(null), 'Centro de Salud');
  assert.equal(formatZonaLabel(undefined), 'Centro de Salud');
  assert.equal(formatZonaLabel(''), 'Centro de Salud');
  assert.equal(formatZonaLabel('   '), 'Centro de Salud');
});

test('isDevelopmentTestNews: identifica y filtra títulos de prueba de desarrollo', () => {
  // Casos señalados en la auditoría visual: «Prueba III», «Prueba 1», etc.
  assert.equal(isDevelopmentTestNews({ titulo: 'Prueba III', resumen: 'Noticia de prueba' }), true);
  assert.equal(isDevelopmentTestNews({ titulo: 'Prueba 2', resumen: 'Texto' }), true);
  assert.equal(isDevelopmentTestNews({ titulo: 'Test notificaciones', resumen: '' }), true);
  assert.equal(isDevelopmentTestNews({ titulo: 'Noticia de prueba', resumen: '' }), true);

  // Casos institucionales reales válidos
  assert.equal(isDevelopmentTestNews({ titulo: 'Campaña de Vacunación Antigripal', resumen: 'Centros de salud' }), false);
  assert.equal(isDevelopmentTestNews({ titulo: 'Jornada de Control Pediátrico en Barrios', resumen: 'Controles integrales' }), false);
});

test('resolveActiveSalitaIndex: conserva el índice si la salita seleccionada pertenece al resultado filtrado', () => {
  const salitas = [
    { id_salita: 'salita-1', nombre: 'CAPS Belgrano' },
    { id_salita: 'salita-2', nombre: 'CAPS San Martín' },
    { id_salita: 'salita-3', nombre: 'CAPS Sarmiento' },
  ];

  // Si seleccionó salita-2, devuelve el índice 1
  assert.equal(resolveActiveSalitaIndex(salitas, 'salita-2'), 1);
  // Si seleccionó salita-3, devuelve el índice 2
  assert.equal(resolveActiveSalitaIndex(salitas, 'salita-3'), 2);
  // Si seleccionó salita-1, devuelve el índice 0
  assert.equal(resolveActiveSalitaIndex(salitas, 'salita-1'), 0);
});

test('resolveActiveSalitaIndex: restablece automáticamente a 0 si la salita no pertenece al resultado o es nula', () => {
  const salitasFiltradas = [
    { id_salita: 'salita-4', nombre: 'CAPS Esperanza' },
    { id_salita: 'salita-5', nombre: 'CAPS Itatí' },
  ];

  // La salita previa (salita-2) no está en el nuevo filtro de zona
  assert.equal(resolveActiveSalitaIndex(salitasFiltradas, 'salita-2'), 0);
  assert.equal(resolveActiveSalitaIndex(salitasFiltradas, null), 0);
  assert.equal(resolveActiveSalitaIndex(salitasFiltradas, undefined), 0);
  assert.equal(resolveActiveSalitaIndex([], 'salita-1'), 0);
});
