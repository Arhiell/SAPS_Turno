import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTerritorialCoverage } from '../src/services/patient-coverage.service.js';
import { getCoberturaTerritorialSalita } from '../src/services/salita.service.js';
import { assertTurnoScope } from '../src/services/turno-access.service.js';

// CIC Norte IDs
const CIC_NORTE_ID = '1572fdd1-44d7-47bf-8481-47e2c8865e23';
const BARRIO_9_DE_JULIO = 'd67c7bf6-2129-48a7-8887-06f4a773db78'; // Cubierto por CIC Norte (Zona Norte)
const ZONA_NORTE_ID = '4cca2e45-10dd-40fd-b080-df77b21160e2';
const ZONA_SUR_ID = '5d9ee18e-4f05-4e89-8d19-3543b59b1f09';
const BARRIO_ARCO_IRIS = '8110444e-2bbd-4aa8-9205-c46a3c381005'; // Cubierto por Sala Sarmiento (Zona Este), NO por CIC Norte

test('getCoberturaTerritorialSalita devuelve únicamente zonas y barrios cubiertos por la salita', async () => {
  const result = await getCoberturaTerritorialSalita(CIC_NORTE_ID);

  assert.equal(result.salita.id_salita, CIC_NORTE_ID);
  assert.ok(result.zonas.length > 0);
  assert.ok(result.barrios.length > 0);

  // CIC Norte cubre barrios en Zona Norte y Zona Centro
  const zonaNombres = result.zonas.map((z) => z.nombre);
  assert.ok(zonaNombres.includes('Zona Norte'));
  assert.ok(zonaNombres.includes('Zona Centro'));
  assert.ok(!zonaNombres.includes('Zona Sur'), 'No debe incluir Zona Sur');
  assert.ok(!zonaNombres.includes('Zona Este'), 'No debe incluir Zona Este');

  // Todos los barrios devueltos deben pertenecer a las zonas de la salita
  const zonaIds = new Set(result.zonas.map((z) => z.id_zona));
  for (const b of result.barrios) {
    assert.ok(zonaIds.has(b.id_zona), `El barrio ${b.nombre} debe pertenecer a una zona autorizada`);
  }

  // Barrio 9 de Julio está cubierto
  assert.ok(result.barrios.some((b) => b.id_barrio === BARRIO_9_DE_JULIO));
  // Barrio Arco Iris (de Sala Sarmiento) NO debe estar presente
  assert.ok(!result.barrios.some((b) => b.id_barrio === BARRIO_ARCO_IRIS));
});

test('assertTerritorialCoverage valida exitosamente cuando el barrio está cubierto por la salita', async () => {
  const result = await assertTerritorialCoverage(CIC_NORTE_ID, BARRIO_9_DE_JULIO, ZONA_NORTE_ID);
  assert.ok(result);
  assert.equal(result.barrio.id_barrio, BARRIO_9_DE_JULIO);
  assert.equal(result.zona.id_zona, ZONA_NORTE_ID);
});

test('assertTerritorialCoverage rechaza barrio fuera de la cobertura de la salita', async () => {
  await assert.rejects(
    async () => {
      // Intentar asignar a CIC Norte un barrio que no cubre (Arco Iris)
      await assertTerritorialCoverage(CIC_NORTE_ID, BARRIO_ARCO_IRIS);
    },
    (err: any) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /no tiene cobertura sobre el barrio seleccionado/i);
      return true;
    }
  );
});

test('assertTerritorialCoverage rechaza inconsistencia entre zona y barrio', async () => {
  await assert.rejects(
    async () => {
      // 9 de Julio es Zona Norte, pasamos Zona Sur como idZona manipulado
      await assertTerritorialCoverage(CIC_NORTE_ID, BARRIO_9_DE_JULIO, ZONA_SUR_ID);
    },
    (err: any) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /no corresponde a la zona indicada/i);
      return true;
    }
  );
});

test('assertTurnoScope impide a un ADMIN_SALITA operar sobre salitas ajenas', () => {
  const scopeAdminCicNorte = [CIC_NORTE_ID];
  const salaSarmientoId = 'eb23d4af-cc18-47a8-947a-0afda170c7f0';

  // Permitido dentro de scope
  assert.doesNotThrow(() => {
    assertTurnoScope(scopeAdminCicNorte, CIC_NORTE_ID);
  });

  // Rechazado fuera de scope
  assert.throws(
    () => {
      assertTurnoScope(scopeAdminCicNorte, salaSarmientoId);
    },
    (err: any) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );

  // SUPER_ADMIN (scope === null) tiene acceso global sin restricciones
  assert.doesNotThrow(() => {
    assertTurnoScope(null, salaSarmientoId);
    assertTurnoScope(null, CIC_NORTE_ID);
  });
});
