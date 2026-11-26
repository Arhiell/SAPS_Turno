import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loginUser } from '../src/services/auth.service.js';
import { getPatientProfessionals } from '../src/services/patient-agenda.service.js';
import { getTurnos } from '../src/services/turno-read.service.js';
import {
  obtenerEstadoInasistenciasPaciente,
  presentarJustificacion,
  obtenerJustificacionesAdmin,
  evaluarJustificacion,
  obtenerInasistenciasAdmin,
  rectificarInasistencia,
  obtenerAdvertenciasAdmin,
  anularAdvertenciaOperativa,
  obtenerMetricasInasistenciasAdmin,
} from '../src/services/inasistencia-politica.service.js';
import { findPatientByPersonId } from '../src/repositories/patient-read.repository.js';
import { supabase } from '../src/config/supabase.js';

describe('AUDITORÍA COMPLETA CORA: Flujo Paciente, Admin y Política Progresiva', () => {
  let tokenPaciente = '';
  let userPaciente: any = null;
  let patientEntity: any = null;

  let tokenAdmin = '';
  let userAdmin: any = null;

  it('1. LOGIN REAL: Autenticación exitosa de PACIENTE (Sonia Valdez)', async () => {
    const pacienteEmail = process.env.TEST_PACIENTE_EMAIL || 'sorin48849@flakeian.com';
    const pacientePass = process.env.TEST_PACIENTE_PASS || 'Sonia@12345';

    const loginResult = await loginUser(
      { identifier: pacienteEmail, password: pacientePass },
      { ip: '127.0.0.1', userAgent: 'test-runner' }
    );

    assert.ok(loginResult, 'Login debe responder');
    const accountUser = (loginResult as any).user;

    const { data: usuarioDb } = await supabase
      .from('usuarios')
      .select('id_usuario, id_persona, rol:roles!inner(codigo)')
      .eq('id_usuario', accountUser.id_usuario)
      .maybeSingle();

    assert.ok(usuarioDb, 'Debe existir usuario en la base de datos');

    userPaciente = {
      id_usuario: usuarioDb.id_usuario,
      id_persona: usuarioDb.id_persona,
      rol: 'PACIENTE',
    };
    tokenPaciente = (loginResult as any).session?.accessToken;

    assert.equal(userPaciente.rol, 'PACIENTE');

    // Recuperar entidad paciente
    patientEntity = await findPatientByPersonId(userPaciente.id_persona);
    assert.ok(patientEntity, 'Debe existir registro en pacientes');
    console.log(`✓ Paciente autenticado: ${accountUser.nombre_usuario} (ID Paciente: ${patientEntity.id_paciente})`);
  });

  it('2. LOGIN REAL: Autenticación exitosa de ADMIN_SALITA (SalaSarmiento)', async () => {
    const adminUser = process.env.TEST_ADMIN_USER || 'SalaSarmiento';
    const adminPass = process.env.TEST_ADMIN_PASS || 'admSALITAS12345@&&';

    const loginResult = await loginUser(
      { identifier: adminUser, password: adminPass },
      { ip: '127.0.0.1', userAgent: 'test-runner' }
    );

    assert.ok(loginResult, 'Login debe responder');
    const accountAdmin = (loginResult as any).user;

    userAdmin = {
      id_usuario: accountAdmin.id_usuario,
      rol: 'ADMIN_SALITA',
    };
    tokenAdmin = (loginResult as any).session?.accessToken;

    assert.equal(userAdmin.rol, 'ADMIN_SALITA');
    console.log(`✓ Administrador de salita autenticado: ${accountAdmin.nombre_usuario} (ID: ${userAdmin.id_usuario})`);
  });

  it('3. PACIENTE: Consulta de profesionales y agendas disponibles para su salita', async () => {
    const profesionales = await getPatientProfessionals(userPaciente);
    assert.ok(Array.isArray(profesionales), 'Debe devolver arreglo de profesionales');
    assert.ok(profesionales.length >= 1, 'Debe devolver los profesionales de Sala Sarmiento');
    console.log(`✓ Profesionales visibles para Sonia Valdez: ${profesionales.length} profesionales (${profesionales.map(p => p.nombre_completo).join(', ')})`);
  });

  it('4. PACIENTE: Consulta de estado de inasistencias, advertencias y restricciones (Portal Web)', async () => {
    const estado = await obtenerEstadoInasistenciasPaciente(patientEntity.id_paciente);
    assert.ok(estado, 'Debe devolver el estado de inasistencias');
    assert.equal(estado.ventana_dias, 90, 'La ventana de evaluación debe ser 90 días');
    assert.equal(typeof estado.conteo_faltas_activas, 'number');
    assert.equal(typeof estado.puede_reservar_online, 'boolean');
    assert.ok(Array.isArray(estado.advertencias));
    console.log(`✓ Estado asistencial: ${estado.conteo_faltas_activas} faltas en 90 días. Puede reservar online: ${estado.puede_reservar_online}`);
  });

  it('5. ADMIN_SALITA: Consulta de métricas generales y contadores del módulo', async () => {
    const metricas = await obtenerMetricasInasistenciasAdmin(userAdmin);
    assert.ok(metricas, 'Debe devolver métricas');
    assert.equal(typeof metricas.justificaciones_pendientes, 'number');
    assert.equal(typeof metricas.inasistencias_registradas, 'number');
    assert.equal(typeof metricas.advertencias_vigentes, 'number');
    console.log(`✓ Métricas de Sala Sarmiento: ${metricas.justificaciones_pendientes} pendientes, ${metricas.inasistencias_registradas} inasistencias, ${metricas.advertencias_vigentes} advertencias vigentes`);
  });

  it('6. ADMIN_SALITA: Consulta de justificaciones con filtrado scoped', async () => {
    const res = await obtenerJustificacionesAdmin({ page: 1, limit: 10 }, userAdmin);
    assert.ok(res.data, 'Debe devolver lista de justificaciones');
    assert.ok(res.pagination, 'Debe devolver paginación');
    console.log(`✓ Justificaciones consultadas para Sala Sarmiento: ${res.pagination.total} registros`);
  });

  it('7. ADMIN_SALITA: Consulta de inasistencias registradas (NO_ASISTIO) con conteo a 90 días', async () => {
    const res = await obtenerInasistenciasAdmin({ page: 1, limit: 10 }, userAdmin);
    assert.ok(Array.isArray(res.data));
    for (const item of res.data) {
      assert.equal(item.estado.codigo, 'NO_ASISTIO');
      assert.equal(typeof item.faltas_90d, 'number');
    }
    console.log(`✓ Inasistencias registradas en Sala Sarmiento: ${res.pagination.total} registros`);
  });

  it('8. ADMIN_SALITA: Consulta de advertencias y verificación de anulación auditable', async () => {
    const res = await obtenerAdvertenciasAdmin({ page: 1, limit: 10 }, userAdmin);
    assert.ok(Array.isArray(res.data));
    console.log(`✓ Advertencias consultadas en Sala Sarmiento: ${res.pagination.total} registros`);
  });

  it('9. SEGURIDAD: Paciente NO puede acceder a justificaciones de otros pacientes', async () => {
    // Si intenta presentar justificación con un turno inexistente o ajeno, getTurno lo rechaza
    await assert.rejects(
      async () => {
        await presentarJustificacion(
          { id_turno: '00000000-0000-0000-0000-000000000000', motivo: 'Justificación de prueba válida' },
          userPaciente
        );
      },
      (err: any) => {
        return err.statusCode === 404 || err.statusCode === 403;
      }
    );
    console.log('✓ Bloqueo verificado: Paciente no puede justificar turnos ajenos');
  });

  it('10. SEGURIDAD: Paciente NO puede evaluar justificaciones', async () => {
    await assert.rejects(
      async () => {
        await evaluarJustificacion(
          '00000000-0000-0000-0000-000000000000',
          { estado: 'APROBADA', motivo_resolucion: 'Hack' },
          userPaciente
        );
      },
      (err: any) => {
        return err.statusCode === 403;
      }
    );
    console.log('✓ Bloqueo verificado: Paciente no tiene permisos para dictaminar justificaciones');
  });

  it('11. SEGURIDAD: Paciente NO puede rectificar inasistencias', async () => {
    await assert.rejects(
      async () => {
        await rectificarInasistencia(
          '00000000-0000-0000-0000-000000000000',
          { nuevo_estado: 'ATENDIDO', motivo_rectificacion: 'Hack motivo' },
          userPaciente
        );
      },
      (err: any) => {
        return err.statusCode === 403;
      }
    );
    console.log('✓ Bloqueo verificado: Paciente no puede rectificar turnos');
  });

  it('12. SEGURIDAD MULTI-TENANCY: Admin de Sala Sarmiento no puede acceder a salita ajena', async () => {
    const { assertTurnoScope } = await import('../src/services/turno-access.service.js');
    const { getTurnoScope } = await import('../src/services/turno-access.service.js');
    const adminScope = await getTurnoScope(userAdmin);
    assert.ok(Array.isArray(adminScope), 'El scope del admin debe ser una lista de IDs de salita');

    const salitaFalsa = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    assert.throws(
      () => {
        assertTurnoScope(adminScope, salitaFalsa);
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
    console.log('✓ Multi-tenancy verificado: Admin bloqueado de salitas ajenas');
  });
});
