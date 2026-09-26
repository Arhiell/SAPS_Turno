import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { queue, drained, id, user, turno, state } from "./turno-fixtures.js";
import { input, person, row } from "./patient-fixtures.js";
const { getTurnos, getTurno } = await import("../src/services/turno-read.service.js");
const { changeTurnoStatus, updateTurno } = await import("../src/services/turno-update.service.js");
const { completeOwnProfile, getOwnProfile } = await import("../src/services/auth-profile.service.js");
const { resetPassword } = await import("../src/services/password-recovery.service.js");
const { registerSchema } = await import("../src/validators/auth.validator.js");
const { getPatients } = await import("../src/services/patient-read.service.js");
const { getReporteResumen } = await import("../src/services/reporte.service.js");
afterEach(drained);
const patient = { ...user, rol: "PACIENTE" };
const professional = { ...user, rol: "PROFESIONAL" };
const account = { ...user, id_persona: person.id_persona, activo: true };
const own = (role: string, entityId = id) => [
  { table: "usuarios", result: [account] },
  { table: role === "PROFESIONAL" ? "profesionales" : "pacientes", result: [{ [role === "PROFESIONAL" ? "id_profesional" : "id_paciente"]: entityId }] },
];

test("Registro acepta email y contraseÃ±a, sin permitir elegir un rol", () => {
  const parsed = registerSchema.parse({ email: "paciente@example.test", password: "Safe-Test123!", rol: "SUPER_ADMIN" });
  assert.equal('rol' in parsed, false);
  assert.equal(parsed.nombre_usuario, undefined);
});
test("Paciente y profesional filtran por la identidad de servidor, no por la enviada", async () => {
  for (const actor of [patient, professional]) {
    const key = actor.rol === "PACIENTE" ? "id_paciente" : "id_profesional";
    queue(...own(actor.rol), { table: "turnos", result: [], check: url => assert.equal(url.searchParams.get(key), `eq.${id}`) });
    await getTurnos({ page: 1, limit: 20, [key]: person.id_persona }, actor);
    queue(...own(actor.rol), { table: "turnos", result: [{ ...turno, [key]: person.id_persona }] });
    await assert.rejects(getTurno(id, actor), { statusCode: 403 });
  }
});
test("Profesional solo cambia estados de atenciÃ³n de sus turnos", async () => {
  await assert.rejects(changeTurnoStatus(id, { estado: "CANCELADO" }, professional), { statusCode: 403 });
  await assert.rejects(updateTurno(id, { observaciones: "No permitido" }, professional), { statusCode: 403 });
  await assert.rejects(changeTurnoStatus(id, { estado: "CANCELADO" }, patient), { statusCode: 403 });
  for (const codigo of ["ATENDIDO", "NO_ASISTIO"]) {
    const final = { ...state, id_estado: person.id_persona, codigo, ocupa_agenda: false, es_estado_final: true };
    queue(...own("PROFESIONAL"), { table: "turnos", result: [turno] }, { table: "estados_turno", result: [final] },
      { table: "turnos", method: "PATCH", result: [{ ...turno, estado: final }] });
    assert.equal((await changeTurnoStatus(id, { estado: codigo }, professional)).estado.codigo, codigo);
  }
});
test("Perfil incompleto no consulta pacientes ajenos", async () => {
  queue({ table: "usuarios", result: [{ ...account, id_persona: null }] });
  assert.equal((await getOwnProfile(patient)).patient, null);
});
test("Completar perfil no permite apropiarse de un DNI existente ni duplicarlo", async () => {
  queue({ table: "usuarios", result: [{ ...account, id_persona: null }] }, { table: "personas", result: [person] });
  await assert.rejects(completeOwnProfile(input, patient), { statusCode: 409 });
  queue({ table: "usuarios", result: [account] }, { table: "pacientes", result: [row] });
  await assert.rejects(completeOwnProfile(input, patient), { statusCode: 409 });
  await assert.rejects(completeOwnProfile(input, professional), { statusCode: 403 });
});
test("El correo del perfil procede de la cuenta, no del formulario", async () => {
  await assert.rejects(completeOwnProfile({ ...input, email: "other@example.test" }, patient));
});
test("Pacientes y reportes administrativos aplican el alcance en SQL", async () => {
  queue({ table: "pacientes", result: [], check: url => assert.equal(url.searchParams.get('id_salita_asignada'), `in.(${id})`) });
  await getPatients({ page: 1, limit: 20 }, [id]);
  queue({ table: "turnos", result: [], check: url => assert.equal(url.searchParams.get('id_salita'), `in.(${id})`) });
  await getReporteResumen({ fecha_desde: "2026-09-01", fecha_hasta: "2026-09-30" }, [id]);
});
test("RecuperaciÃ³n rechaza token inexistente y vencido sin modificar contraseÃ±as", async () => {
  const data = { token: 'a'.repeat(64), newPassword: 'Safe-Test123!' };
  queue({ table: "tokens_recuperacion", result: [] });
  await assert.rejects(resetPassword(data), { statusCode: 400 });
  queue({ table: "tokens_recuperacion", result: [{ fecha_expiracion: '2000-01-01T00:00:00Z' }] });
  await assert.rejects(resetPassword(data), { statusCode: 400 });
});

