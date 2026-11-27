import assert from "node:assert/strict";
import { request } from "node:http";
import type { AddressInfo } from "node:net";
import { before, after, afterEach, test } from "node:test";
import { queue, drained } from "./patient-fixtures.js";

const { default: app } = await import("../src/app.js");
const { generateAccessToken } = await import("../src/services/jwt.service.js");
const { agendaDateTime } = await import("../src/utils/turno-time.js");

const CIC_NORTE_ID = "1572fdd1-44d7-47bf-8481-47e2c8865e23";
const OTRA_SALITA_ID = "531f7df8-3062-4d18-8647-33aba67ada57";
const ADMIN_USER_ID = "e50f7241-3a37-4a5c-b096-340fe121e5cf";
const RECEP_USER_ID = "d8a55fb8-c306-4043-8baa-ba610cd8a022";
const PROF_ID = "070097e7-bc6a-4e70-bb4e-3eb8733b437f";
const PERSONA_ID = "4aed5182-6204-431b-b538-181fb9c6f1c4";
const OTRO_PROF_ID = "b0c76547-e22f-4e17-b88d-6e78618755e7";

const adminUser = {
  id_usuario: ADMIN_USER_ID,
  email: "admin.norte@test.com",
  nombre_usuario: "CIC_Norte",
  rol: "ADMIN_SALITA",
};

const recepUser = {
  id_usuario: RECEP_USER_ID,
  email: "recep.norte@test.com",
  nombre_usuario: "leonel123",
  rol: "RECEPCION",
};

const adminToken = await generateAccessToken(adminUser);
const recepToken = await generateAccessToken(recepUser);

const server = app.listen(0, "127.0.0.1");

before(async () => {
  if (!server.listening) {
    await new Promise<void>((resolve) => server.once("listening", resolve));
  }
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));
afterEach(drained);

const authSteps = (userObj: typeof adminUser) => [
  {
    table: "usuarios",
    result: [{
      ...userObj,
      id_persona: "b93f77a3-074b-4ef2-adca-df99f70d20aa",
      id_rol: "b45ac050-6aaf-4fbc-82e5-a71fab03522a",
      activo: true,
      email_verificado: true,
    }],
  },
  { table: "roles", result: [{ codigo: userObj.rol, activo: true }] },
];

const call = (
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<{ status: number; json: any }> =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = request(
      {
        hostname: "127.0.0.1",
        port: (server.address() as AddressInfo).port,
        path,
        method,
        headers: {
          Authorization: "Bearer " + token,
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode!, json: JSON.parse(raw) }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

const profesionalMock = {
  id_profesional: PROF_ID,
  id_persona: PERSONA_ID,
  matricula: "MP-3125",
  activo: true,
  fecha_alta: "2026-11-26",
  fecha_baja: null,
  fecha_actualizacion: "2026-11-26T22:00:00Z",
  persona: {
    id_persona: PERSONA_ID,
    dni: "23781882",
    nombres: "Lucas",
    apellidos: "Martínez",
    fecha_nacimiento: "1965-11-26",
    sexo: "MASCULINO",
    telefono: "3777543122",
    email: "lucas.martinez@test.com",
    direccion: "José Gómez",
    localidad: "Goya",
    provincia: "Corrientes",
    codigo_postal: "3450",
    activo: true,
  },
};

test("POST /api/profesionales usa fecha local de Argentina en profesional_salita.fecha_desde", async () => {
  const expectedToday = agendaDateTime(new Date()).date;

  queue(
    ...authSteps(adminUser),
    // getTurnoScope -> usuario_salita
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    // professionalScope -> profesional_salita (consulta inicial)
    {
      table: "profesional_salita",
      result: [],
      check: (url) => {
        assert.equal(url.searchParams.get("id_salita"), `in.(${CIC_NORTE_ID})`);
        assert.equal(url.searchParams.get("activo"), "eq.true");
        assert.equal(url.searchParams.has("fecha_desde"), false, "professionalScope no debe excluir asignaciones futuras por fecha_desde");
        assert.equal(url.searchParams.get("or"), `(fecha_hasta.is.null,fecha_hasta.gte.${expectedToday})`);
      },
    },
    // ensureMatriculaAvailable
    { table: "profesionales", result: null },
    // findOrCreatePerson: buscar por dni
    { table: "personas", result: null },
    // findOrCreatePerson: buscar por email
    { table: "personas", result: null },
    // findOrCreatePerson: insertar persona
    { table: "personas", method: "POST", result: profesionalMock.persona },
    // verificar persona no duplicada en profesionales
    { table: "profesionales", result: null },
    // insertar profesional
    { table: "profesionales", method: "POST", result: profesionalMock },
    // agregarSalitaProfesional -> insertar en profesional_salita con fecha_desde local
    {
      table: "profesional_salita",
      method: "POST",
      result: {
        id_profesional: PROF_ID,
        id_salita: CIC_NORTE_ID,
        fecha_desde: expectedToday,
        fecha_hasta: null,
        activo: true,
        salita: { id_salita: CIC_NORTE_ID, nombre: "CIC Norte" },
      },
      check: (_url, body) => {
        assert.equal(body?.id_profesional, PROF_ID);
        assert.equal(body?.id_salita, CIC_NORTE_ID);
        assert.equal(body?.fecha_desde, expectedToday, "Debe enviar explícitamente fecha_desde en zona horaria Argentina");
      },
    }
  );

  const res = await call("POST", "/api/profesionales", adminToken, {
    dni: "23781882",
    nombres: "Lucas",
    apellidos: "Martínez",
    fecha_nacimiento: "1965-11-26",
    sexo: "MASCULINO",
    telefono: "3777543122",
    email: "lucas.martinez@test.com",
    direccion: "José Gómez",
    localidad: "Goya",
    provincia: "Corrientes",
    codigo_postal: "3450",
    matricula: "MP-3125",
  });

  assert.equal(res.status, 201);
  assert.equal(res.json.success, true);
  assert.equal(res.json.data.id_profesional, PROF_ID);
});

test("GET /api/profesionales/:id y /:id/salitas permiten consulta inmediata y asignaciones con fecha_desde futura para ADMIN_SALITA", async () => {
  const expectedToday = agendaDateTime(new Date()).date;

  queue(
    ...authSteps(adminUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    {
      table: "profesional_salita",
      result: [{ id_profesional: PROF_ID }],
      check: (url) => {
        assert.equal(url.searchParams.get("id_salita"), `in.(${CIC_NORTE_ID})`);
        assert.equal(url.searchParams.get("activo"), "eq.true");
        assert.equal(url.searchParams.has("fecha_desde"), false);
        assert.equal(url.searchParams.get("or"), `(fecha_hasta.is.null,fecha_hasta.gte.${expectedToday})`);
      },
    },
    { table: "profesionales", result: profesionalMock }
  );

  const detailRes = await call("GET", `/api/profesionales/${PROF_ID}`, adminToken);
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.json.data.id_profesional, PROF_ID);

  // Consultar salitas vinculadas al profesional
  // (pasa por authenticate en profesionalRoutes, profesionalEspecialidadRoutes y profesionalSalitaRoutes)
  queue(
    ...authSteps(adminUser),
    ...authSteps(adminUser),
    ...authSteps(adminUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    { table: "profesional_salita", result: [{ id_profesional: PROF_ID }] },
    {
      table: "profesional_salita",
      result: [
        {
          id_profesional: PROF_ID,
          id_salita: CIC_NORTE_ID,
          fecha_desde: "2026-12-05",
          fecha_hasta: null,
          activo: true,
          salita: { id_salita: CIC_NORTE_ID, nombre: "CIC Norte" },
        },
      ],
    }
  );

  const salitasRes = await call("GET", `/api/profesionales/${PROF_ID}/salitas`, adminToken);
  assert.equal(salitasRes.status, 200);
  assert.equal(salitasRes.json.data.length, 1);
  assert.equal(salitasRes.json.data[0].id_salita, CIC_NORTE_ID);
});

test("RECEPCION puede consultar profesionales con asignación activa futura de su propia salita", async () => {
  const expectedToday = agendaDateTime(new Date()).date;

  queue(
    ...authSteps(recepUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    {
      table: "profesional_salita",
      result: [{ id_profesional: PROF_ID }],
      check: (url) => {
        assert.equal(url.searchParams.get("id_salita"), `in.(${CIC_NORTE_ID})`);
        assert.equal(url.searchParams.get("activo"), "eq.true");
        assert.equal(url.searchParams.get("or"), `(fecha_hasta.is.null,fecha_hasta.gte.${expectedToday})`);
      },
    },
    { table: "profesionales", result: profesionalMock }
  );

  const res = await call("GET", `/api/profesionales/${PROF_ID}`, recepToken);
  assert.equal(res.status, 200);
  assert.equal(res.json.data.id_profesional, PROF_ID);
});

test("Asignación inactiva o finalizada (fecha_hasta < hoy) NO habilita acceso (403 Forbidden)", async () => {
  const expectedToday = agendaDateTime(new Date()).date;

  queue(
    ...authSteps(adminUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    // La query filtra activo=true y (fecha_hasta.is.null,fecha_hasta.gte.today), por lo tanto
    // asignaciones inactivas o finalizadas no son retornadas por Postgres.
    {
      table: "profesional_salita",
      result: [],
      check: (url) => {
        assert.equal(url.searchParams.get("activo"), "eq.true");
        assert.equal(url.searchParams.get("or"), `(fecha_hasta.is.null,fecha_hasta.gte.${expectedToday})`);
      },
    }
  );

  const res = await call("GET", `/api/profesionales/${PROF_ID}`, adminToken);
  assert.equal(res.status, 403);
  assert.match(res.json.message, /no pertenece a tus salitas/i);
});

test("Aislamiento entre salitas: ADMIN_SALITA no puede ver profesional de otra salita ni crear profesional para otra salita", async () => {
  // 1. Intentar ver profesional perteneciente solo a otra salita
  queue(
    ...authSteps(adminUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] },
    {
      table: "profesional_salita",
      result: [{ id_profesional: PROF_ID }],
      check: (url) => {
        assert.equal(url.searchParams.get("id_salita"), `in.(${CIC_NORTE_ID})`);
      },
    }
  );

  const getOther = await call("GET", `/api/profesionales/${OTRO_PROF_ID}`, adminToken);
  assert.equal(getOther.status, 403);
  assert.match(getOther.json.message, /no pertenece a tus salitas/i);

  // 2. Intentar crear profesional enviando id_salita de otra salita
  queue(
    ...authSteps(adminUser),
    { table: "usuario_salita", result: [{ id_salita: CIC_NORTE_ID }] }
  );

  const postOther = await call("POST", "/api/profesionales", adminToken, {
    id_salita: OTRA_SALITA_ID,
    dni: "23781883",
    nombres: "Otro",
    apellidos: "Profesional",
    matricula: "MP-9999",
  });
  assert.equal(postOther.status, 403);
});
