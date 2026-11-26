import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatbotSession } from '../src/utils/chatbot-session.ts';

test('Una respuesta pendiente no se presenta después de cambiar usuario o rol', () => {
  let identity: string | null = 'cuenta-a:PACIENTE';
  const session = new ChatbotSession(() => identity);
  const ticket = session.begin();
  assert.equal(ticket.isCurrent(), true);
  identity = 'cuenta-b:PACIENTE';
  assert.equal(ticket.isCurrent(), false);
  identity = 'cuenta-a:RECEPCION';
  assert.equal(ticket.isCurrent(), false);
});

test('Cerrar sesión invalida la respuesta que estaba en vuelo', () => {
  let identity: string | null = 'cuenta-a:PACIENTE';
  const session = new ChatbotSession(() => identity);
  const ticket = session.begin();
  identity = null;
  assert.equal(ticket.isCurrent(), false);
});

test('Limpiar la conversación cancela la solicitud pendiente', () => {
  const session = new ChatbotSession(() => 'cuenta-a:PACIENTE');
  const ticket = session.begin();
  session.invalidate();
  assert.equal(ticket.signal.aborted, true);
  assert.equal(ticket.isCurrent(), false);
});

test('Una consulta nueva no puede mostrar tardíamente la respuesta anterior', () => {
  const session = new ChatbotSession(() => 'cuenta-a:PACIENTE');
  const old = session.begin();
  const current = session.begin();
  assert.equal(old.signal.aborted, true);
  assert.equal(old.isCurrent(), false);
  assert.equal(current.isCurrent(), true);
});
