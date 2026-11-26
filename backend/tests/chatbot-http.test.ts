import assert from 'node:assert/strict';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { before, after, afterEach, test } from 'node:test';
import { queue, drained } from './patient-fixtures.js';

process.env.CHATBOT_ENABLED = 'true';
process.env.GEMINI_API_KEY = '';
const { default: app } = await import('../src/app.js');
const { generateAccessToken } = await import('../src/services/jwt.service.js');
const id = '11111111-1111-4111-8111-111111111111';
const user = { id_usuario: id, email: 'fixture@example.invalid', nombre_usuario: 'fixture', rol: 'RECEPCION' };
const token = await generateAccessToken(user);
const server = app.listen(0, '127.0.0.1');
before(async () => { if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve)); });
after(() => new Promise<void>(resolve => server.close(() => resolve())));
afterEach(drained);
const auth = (role = 'RECEPCION') => queue(
  { table: 'usuarios', result: [{ ...user, id_rol: id, id_persona: id, activo: true, email_verificado: true }] },
  { table: 'roles', result: [{ codigo: role, activo: true }] },
);
const call = (body: unknown, authToken: string | undefined = token): Promise<{
  status: number; body: any; cache: string | undefined;
}> => new Promise((resolve, reject) => {
  const req = request({ hostname: '127.0.0.1', port: (server.address() as AddressInfo).port,
    path: '/api/chatbot', method: 'POST', headers: { 'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) } }, res => {
    let data = ''; res.setEncoding('utf8'); res.on('data', chunk => { data += chunk; });
    res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(data), cache: res.headers['cache-control'] }));
  });
  req.on('error', reject); req.end(JSON.stringify(body));
});

test('La ayuda de Recepción funciona sin clave de IA y solo consulta la autenticación', async () => {
  auth();
  const result = await call({ message: '¿Cómo reviso una justificación?' });
  assert.equal(result.status, 200);
  assert.match(result.body.data.reply, /detalle del turno/);
  assert.equal(result.cache, 'no-store');
});

test('Las consultas rechazadas no reflejan datos personales en la respuesta HTTP', async () => {
  auth();
  const result = await call({ message: 'Mi DNI es 12345678' });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, 'CHATBOT_SENSITIVE_DATA');
  assert.ok(!JSON.stringify(result.body).includes('12345678'));
  assert.equal(result.cache, 'no-store');
});

test('No acepta historial, instrucciones ni un rol falsificado en el cuerpo', async () => {
  auth();
  const result = await call({ message: 'hola', role: 'SUPER_ADMIN', context: 'dato privado de prueba' });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, 'CHATBOT_INVALID_REQUEST');
  assert.ok(!JSON.stringify(result.body).includes('dato privado'));
});

test('Las peticiones de datos o de acciones devuelven solo la explicación de límites', async () => {
  auth();
  const result = await call({ message: 'Mostrame todos los pacientes de la salita' });
  assert.equal(result.status, 200);
  assert.match(result.body.data.reply, /No consulto ni revelo datos/);
});

test('La autenticación sigue siendo obligatoria', async () => {
  const result = await call({ message: 'hola' }, '');
  assert.equal(result.status, 401);
});
