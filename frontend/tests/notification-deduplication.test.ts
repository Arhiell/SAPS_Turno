import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isEventEquivalent,
  hasEquivalentNotification,
  getToastCategory,
  getEventoCategory,
  normalizeText,
} from '../src/utils/notification-deduplication.ts';
import type { EventoAgenda } from '../src/types/socket.types.ts';

test('normalizeText: elimina acentos, mayúsculas y caracteres especiales adecuadamente', () => {
  assert.equal(normalizeText('¡Llegada registrada para Gómez!'), 'llegada registrada para gomez');
  assert.equal(normalizeText('Atención Médica: Cancelación'), 'atencion medica cancelacion');
  assert.equal(normalizeText(''), '');
});

test('getToastCategory y getEventoCategory: clasifican eventos correctamente', () => {
  assert.equal(getToastCategory('Llegada registrada para Gonzalez. Pasa a sala de espera.'), 'LLEGADA_ESPERA');
  assert.equal(getToastCategory('Se registró la llegada de Pérez. El turno pasó a sala de espera.'), 'LLEGADA_ESPERA');
  assert.equal(getToastCategory('Turno cancelado exitosamente'), 'CANCELACION');
  assert.equal(getToastCategory('Turno reprogramado exitosamente'), 'REPROGRAMACION');
  assert.equal(getToastCategory('Turno asignado con éxito'), 'CREACION');
  assert.equal(getToastCategory('Bloqueo registrado correctamente'), 'BLOQUEO');
  assert.equal(getToastCategory('Contraseña actualizada con éxito'), 'OTRO');
  assert.equal(getToastCategory('Paciente modificado correctamente'), 'OTRO');

  const eventoLlegada: EventoAgenda = {
    id: 'evt-1',
    tipo: 'TURNO_ACTUALIZADO',
    estado: 'EN_ESPERA',
    mensaje: 'Un turno de tu agenda cambió a estado En espera',
    timestamp: new Date().toISOString(),
  };
  assert.equal(getEventoCategory(eventoLlegada), 'LLEGADA_ESPERA');

  const eventoCancelado: EventoAgenda = {
    id: 'evt-2',
    tipo: 'TURNO_CANCELADO',
    estado: 'CANCELADO',
    mensaje: 'Se canceló un turno de tu agenda',
    timestamp: new Date().toISOString(),
  };
  assert.equal(getEventoCategory(eventoCancelado), 'CANCELACION');

  const eventoReprogramado: EventoAgenda = {
    id: 'evt-3',
    tipo: 'TURNO_REPROGRAMADO',
    mensaje: 'Se reprogramó un turno de tu agenda',
    timestamp: new Date().toISOString(),
  };
  assert.equal(getEventoCategory(eventoReprogramado), 'REPROGRAMACION');

  const eventoCreado: EventoAgenda = {
    id: 'evt-4',
    tipo: 'TURNO_CREADO',
    mensaje: 'Nuevo turno agendado',
    timestamp: new Date().toISOString(),
  };
  assert.equal(getEventoCategory(eventoCreado), 'CREACION');
});

test('Escenario 1: Registrar llegada de paciente con notificación blanca en panel -> deduplica y suprime toast', () => {
  const eventoBlancoLlegada: EventoAgenda = {
    id: 'evt-llegada-100',
    tipo: 'TURNO_ACTUALIZADO',
    id_turno: 'turno-uuid-1',
    id_paciente: 'paciente-uuid-1',
    estado: 'EN_ESPERA',
    paciente: 'Gonzalez, Maria',
    mensaje: 'Un turno de tu agenda cambió a estado En espera',
    timestamp: new Date().toISOString(),
  };

  const notificacionesActivas = [eventoBlancoLlegada];

  const toastMessage = 'Llegada registrada para Gonzalez. Pasa a sala de espera.';
  const context = {
    id_turno: 'turno-uuid-1',
    id_paciente: 'paciente-uuid-1',
    estado: 'EN_ESPERA',
    paciente: 'Gonzalez',
  };

  // Coincidencia con contexto
  const dedupConContexto = hasEquivalentNotification(toastMessage, notificacionesActivas, context);
  assert.equal(dedupConContexto, true, 'Debe identificar equivalencia exacta por id_turno y estado');

  // Coincidencia semántica pura (sin contexto explícito)
  const dedupSemantico = hasEquivalentNotification(toastMessage, notificacionesActivas);
  assert.equal(dedupSemantico, true, 'Debe identificar equivalencia semántica por categoría y paciente');
});

test('Escenario 2: Acción que solamente genera toast (sin notificación blanca equivalente) -> se muestra normalmente', () => {
  const notificacionesActivas: EventoAgenda[] = [];

  const toastAccionAislada = 'Contraseña actualizada con éxito.';
  const dedupVacio = hasEquivalentNotification(toastAccionAislada, notificacionesActivas);
  assert.equal(dedupVacio, false, 'No habiendo notificaciones blancas, no debe suprimirse el toast verde');

  // Caso con notificación no equivalente en panel
  const eventoNoRelacionado: EventoAgenda = {
    id: 'evt-bloqueo',
    tipo: 'BLOQUEO_AGENDA',
    mensaje: 'Bloqueo de agenda programado',
    timestamp: new Date().toISOString(),
  };

  const dedupConEventoDistinto = hasEquivalentNotification(
    'Datos de contacto del paciente actualizados.',
    [eventoNoRelacionado]
  );
  assert.equal(
    dedupConEventoDistinto,
    false,
    'Un evento no relacionado no debe suprimir el toast verde de otra acción'
  );
});

test('Escenario 3: Sincronización API vs WebSocket -> no duplica independientemente del orden de llegada', () => {
  const eventoWs: EventoAgenda = {
    id: 'evt-ws-1',
    tipo: 'TURNO_CANCELADO',
    id_turno: 'turno-123',
    estado: 'CANCELADO',
    paciente: 'Fernandez, Lucas',
    mensaje: 'Se canceló un turno de tu agenda',
    timestamp: new Date().toISOString(),
  };

  const apiToastMessage = 'Turno cancelado exitosamente';
  const apiContext = { id_turno: 'turno-123', estado: 'CANCELADO' };

  // Caso 3a: WebSocket llega primero
  const notificacionesWsPrimero = [eventoWs];
  const dedupWsPrimero = hasEquivalentNotification(apiToastMessage, notificacionesWsPrimero, apiContext);
  assert.equal(dedupWsPrimero, true, 'Si WebSocket llegó primero, la respuesta API detecta la notificación y suprime el toast');

  // Caso 3b: API responde primero (lista vacía al inicio, luego se incorpora evento WS)
  const notificacionesIniciales: EventoAgenda[] = [];
  assert.equal(
    hasEquivalentNotification(apiToastMessage, notificacionesIniciales, apiContext),
    false,
    'Inicialmente sin WS, el toast podría prepararse'
  );

  // Al llegar el WebSocket 50ms después
  const notificacionesActualizadas = [eventoWs, ...notificacionesIniciales];
  assert.equal(
    hasEquivalentNotification(apiToastMessage, notificacionesActualizadas, apiContext),
    true,
    'Al incorporarse el WS, la deduplicación reacciona inmediatamente suprimiendo el toast'
  );
});

test('Escenario 4: Otras notificaciones pendientes no desaparecen ni interfieren falsamente', () => {
  const notificacionPendientePerez: EventoAgenda = {
    id: 'evt-perez',
    tipo: 'TURNO_CREADO',
    id_turno: 'turno-perez',
    paciente: 'Perez, Juan',
    mensaje: 'Nuevo turno agendado',
    timestamp: new Date(Date.now() - 5000).toISOString(),
  };

  const listaActiva = [notificacionPendientePerez];

  // Acción para otro paciente: llegada de Gomez
  const llegadaGomezToast = 'Llegada registrada para Gomez. Pasa a sala de espera.';
  const contextGomez = {
    id_turno: 'turno-gomez',
    estado: 'EN_ESPERA',
    paciente: 'Gomez',
  };

  // La notificación de Pérez NO debe suprimir la llegada de Gómez
  const esEquivalente = hasEquivalentNotification(llegadaGomezToast, listaActiva, contextGomez);
  assert.equal(
    esEquivalente,
    false,
    'La notificación pendiente de Pérez no debe interferir con la acción de Gómez'
  );

  // La notificación de Pérez sigue intacta en la lista
  assert.equal(listaActiva.length, 1);
  assert.equal(listaActiva[0].id, 'evt-perez');
});

test('Escenario 5: Coincidencia por ID de turno respeta unicidad estricta', () => {
  const eventoTurnoA: EventoAgenda = {
    id: 'evt-a',
    tipo: 'TURNO_ACTUALIZADO',
    id_turno: 'turno-uuid-A',
    estado: 'EN_ESPERA',
    mensaje: 'Un turno de tu agenda cambió a estado En espera',
    timestamp: new Date().toISOString(),
  };

  // Mismo ID de turno -> equivalente
  assert.equal(
    isEventEquivalent(
      'Llegada registrada',
      eventoTurnoA,
      { id_turno: 'turno-uuid-A', estado: 'EN_ESPERA' }
    ),
    true
  );

  // ID de turno diferente -> NO equivalente (evita colisiones accidentales)
  assert.equal(
    isEventEquivalent(
      'Llegada registrada',
      eventoTurnoA,
      { id_turno: 'turno-uuid-B', estado: 'EN_ESPERA' }
    ),
    false
  );
});

test('Escenario 6: Validación en otros módulos (Reprogramación, Creación y Bloqueos de Agenda)', () => {
  // Reprogramación
  const eventoReprog: EventoAgenda = {
    id: 'evt-reprog',
    tipo: 'TURNO_REPROGRAMADO',
    id_turno: 't-reprog-1',
    mensaje: 'Se reprogramó un turno de tu agenda',
    timestamp: new Date().toISOString(),
  };
  assert.equal(
    hasEquivalentNotification('Turno reprogramado exitosamente', [eventoReprog]),
    true
  );

  // Creación de turno
  const eventoNuevo: EventoAgenda = {
    id: 'evt-nuevo',
    tipo: 'TURNO_CREADO',
    id_turno: 't-nuevo-1',
    paciente: 'Alvarez, Sofia',
    mensaje: 'Nuevo turno agendado',
    timestamp: new Date().toISOString(),
  };
  assert.equal(
    hasEquivalentNotification('Turno asignado con éxito', [eventoNuevo]),
    true
  );

  // Bloqueo de agenda
  const eventoBloqueo: EventoAgenda = {
    id: 'evt-bloq',
    tipo: 'BLOQUEO_AGENDA',
    mensaje: 'Bloqueo de agenda creado para Benitez',
    timestamp: new Date().toISOString(),
  };
  assert.equal(
    hasEquivalentNotification('Bloqueo de agenda registrado con éxito', [eventoBloqueo]),
    true
  );
});

test('Prioridad 1 y 2: Aislamiento estricto por turno entre turnos del mismo paciente', () => {
  const eventoTurnoA: EventoAgenda = {
    id: 'evt-uuid-1',
    tipo: 'TURNO_CANCELADO',
    id_turno: 'turno-paciente1-consulta',
    id_paciente: 'paciente-100',
    estado: 'CANCELADO',
    paciente: 'Ramirez, Carlos',
    mensaje: 'Se canceló un turno de tu agenda',
    timestamp: new Date().toISOString(),
  };

  // Mismo paciente ('paciente-100'), pero acción sobre OTRO turno ('turno-paciente1-laboratorio')
  const contextTurnoB = {
    id_turno: 'turno-paciente1-laboratorio',
    id_paciente: 'paciente-100',
    estado: 'CANCELADO',
    paciente: 'Ramirez',
  };

  // La deduplicación NUNCA debe suprimir el turno B basándose únicamente en id_paciente
  assert.equal(
    isEventEquivalent('Turno cancelado exitosamente', eventoTurnoA, contextTurnoB),
    false,
    'Dos turnos distintos del mismo paciente nunca deben colisionar'
  );

  // Mismo turno A -> debe deduplicar
  const contextTurnoA = {
    id_turno: 'turno-paciente1-consulta',
    id_paciente: 'paciente-100',
    estado: 'CANCELADO',
    paciente: 'Ramirez',
  };
  assert.equal(
    isEventEquivalent('Turno cancelado exitosamente', eventoTurnoA, contextTurnoA),
    true,
    'El mismo turno del paciente debe deduplicar correctamente'
  );

  // Prioridad 1: Coincidencia por id_evento directo
  const contextPorEvento = {
    id_evento: 'evt-uuid-1',
  };
  assert.equal(
    isEventEquivalent('Aviso del sistema', eventoTurnoA, contextPorEvento),
    true,
    'Coincidencia exacta por id_evento tiene máxima prioridad'
  );

  const contextPorOtroEvento = {
    id_evento: 'evt-uuid-OTRO',
  };
  assert.equal(
    isEventEquivalent('Aviso del sistema', eventoTurnoA, contextPorOtroEvento),
    false,
    'id_evento distinto no es equivalente'
  );
});

test('Sincronización API vs WebSocket: simulación temporal exhaustiva', async () => {
  // Simulación 1: API responde primero a t=0ms, WebSocket llega a t=100ms
  let notificacionesPanel: EventoAgenda[] = [];
  const toastMsg = 'Llegada registrada para Lopez. Pasa a sala de espera.';
  const context = { id_turno: 't-lopez-1', estado: 'EN_ESPERA', paciente: 'Lopez' };

  // A t=0ms: API responde, WebSocket no ha llegado todavía
  assert.equal(
    hasEquivalentNotification(toastMsg, notificacionesPanel, context),
    false,
    'A t=0ms la lista está vacía'
  );

  // A t=100ms: Llega evento WebSocket
  const eventoWs: EventoAgenda = {
    id: 'evt-ws-lopez',
    tipo: 'TURNO_ACTUALIZADO',
    id_turno: 't-lopez-1',
    estado: 'EN_ESPERA',
    paciente: 'Lopez, Mariana',
    mensaje: 'Un turno de tu agenda cambió a estado En espera',
    timestamp: new Date().toISOString(),
  };
  notificacionesPanel = [eventoWs, ...notificacionesPanel];

  // Inmediatamente al llegar el socket, la deduplicación lo detecta
  assert.equal(
    hasEquivalentNotification(toastMsg, notificacionesPanel, context),
    true,
    'Al recibir el socket a t=100ms se suprime el toast verde sin duplicidad'
  );

  // Simulación 2: WebSocket llega primero a t=0ms, API responde a t=60ms
  const notificacionesConWsPrevio = [eventoWs];
  // A t=60ms la API evalúa:
  assert.equal(
    hasEquivalentNotification(toastMsg, notificacionesConWsPrevio, context),
    true,
    'Si WebSocket llegó primero, la API nunca muestra el toast verde'
  );

  // Simulación 3: WebSocket nunca llega (offline o acción sin WS)
  const notificacionesVacias: EventoAgenda[] = [];
  assert.equal(
    hasEquivalentNotification('Perfil actualizado correctamente', notificacionesVacias),
    false,
    'Si WS no llega, el toast verde se muestra normalmente'
  );

  // Simulación 4: Usuario tiene 3 notificaciones anteriores en panel
  const notificacionesAcumuladas: EventoAgenda[] = [
    {
      id: 'evt-old-1',
      tipo: 'TURNO_CREADO',
      id_turno: 't-old-1',
      paciente: 'Gomez, Pedro',
      mensaje: 'Nuevo turno agendado',
      timestamp: new Date(Date.now() - 10000).toISOString(),
    },
    {
      id: 'evt-old-2',
      tipo: 'TURNO_REPROGRAMADO',
      id_turno: 't-old-2',
      paciente: 'Diaz, Ana',
      mensaje: 'Turno reprogramado',
      timestamp: new Date(Date.now() - 8000).toISOString(),
    },
    {
      id: 'evt-old-3',
      tipo: 'BLOQUEO_AGENDA',
      mensaje: 'Bloqueo matutino',
      timestamp: new Date(Date.now() - 4000).toISOString(),
    },
  ];

  // Una nueva acción de llegada para 'Ruiz' no colisiona con las 3 anteriores
  assert.equal(
    hasEquivalentNotification('Llegada registrada para Ruiz. Pasa a sala de espera.', notificacionesAcumuladas, {
      id_turno: 't-ruiz-1',
      estado: 'EN_ESPERA',
      paciente: 'Ruiz',
    }),
    false,
    'Las notificaciones pendientes de otros pacientes no generan falsos positivos'
  );
  assert.equal(notificacionesAcumuladas.length, 3, 'Las 3 notificaciones previas siguen vigentes');
});
