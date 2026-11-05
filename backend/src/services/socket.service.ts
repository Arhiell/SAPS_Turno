import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { randomUUID } from 'node:crypto';
import { verifyAccessToken } from './jwt.service.js';
import { findUserById, findRoleById } from '../repositories/user.repository.js';
import { getOwnEntity } from './auth-profile.service.js';
import type { AuthenticatedUser } from '../types/auth.types.js';

export interface EventoAgenda {
  id: string;
  tipo:
    | 'TURNO_CREADO'
    | 'TURNO_REPROGRAMADO'
    | 'TURNO_CANCELADO'
    | 'TURNO_ACTUALIZADO'
    | 'BLOQUEO_AGENDA'
    | 'HORARIO_ATENCION_ACTUALIZADO';
  mensaje: string;
  id_turno?: string | undefined;
  id_horario?: string | undefined;
  dia_semana?: number | undefined;
  id_profesional: string;
  id_salita?: string | undefined;
  paciente?: string | undefined;
  fecha_anterior?: string | undefined;
  horario_anterior?: string | undefined;
  nueva_fecha?: string | undefined;
  nuevo_horario?: string | undefined;
  motivo?: string | undefined;
  timestamp: string;
}

let io: SocketIOServer | null = null;

export const initSocketServer = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Middleware de autenticación con JWT
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

      if (!token) {
        return next(new Error('Token de autenticación requerido'));
      }

      const payload = await verifyAccessToken(token);
      if (!payload.sub) {
        return next(new Error('Token inválido'));
      }

      const user = await findUserById(payload.sub);
      if (!user || !user.activo) {
        return next(new Error('Usuario inactivo o no autorizado'));
      }

      const role = await findRoleById(user.id_rol);
      if (!role || !role.activo) {
        return next(new Error('Rol de usuario inválido'));
      }

      const authUser: AuthenticatedUser = {
        id_usuario: user.id_usuario,
        email: user.email,
        nombre_usuario: user.nombre_usuario,
        rol: role.codigo,
        id_persona: user.id_persona,
        email_verificado: user.email_verificado,
        perfil_completo: Boolean(user.id_persona),
      };

      socket.data.user = authUser;

      // Si es profesional, resolvemos su ID de profesional para suscribirlo a su sala
      if (authUser.rol === 'PROFESIONAL') {
        const own = await getOwnEntity(authUser);
        if (own.key === 'id_profesional') {
          socket.data.idProfesional = own.id;
        }
      }

      next();
    } catch (err: any) {
      next(new Error(err?.message || 'Error en autenticación WebSocket'));
    }
  });

  io.on('connection', (socket) => {
    const user: AuthenticatedUser | undefined = socket.data.user;
    const idProf: string | undefined = socket.data.idProfesional;

    if (user?.rol === 'PROFESIONAL' && idProf) {
      // El profesional se une única y automáticamente a su sala privada
      socket.join(`profesional:${idProf}`);
    }

    socket.on('disconnect', () => {
      // Desconexión limpia
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer | null => io;

/**
 * Emite una notificación de cambio de agenda a la sala privada del profesional afectado.
 */
export const emitirCambioAgenda = (
  evento: Omit<EventoAgenda, 'id' | 'timestamp'>
) => {
  if (!io) return;

  const payload: EventoAgenda = {
    ...evento,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };

  // Emisión segura a la sala del profesional
  io.to(`profesional:${evento.id_profesional}`).emit('agenda:cambio', payload);

  // Si se incluye id_salita, también notificamos a la sala de la salita
  if (evento.id_salita) {
    io.to(`salita:${evento.id_salita}`).emit('agenda:cambio', payload);
  }
};

/**
 * Emite una notificación de actualización de horario de atención laboral
 * EXCLUSIVAMENTE a la sala privada del profesional correspondiente.
 */
export const emitirHorarioAtencionActualizado = (
  evento: Omit<EventoAgenda, 'id' | 'timestamp' | 'tipo'> & {
    tipo?: 'HORARIO_ATENCION_ACTUALIZADO' | undefined;
  }
) => {
  if (!io) return;

  const payload: EventoAgenda = {
    ...evento,
    tipo: 'HORARIO_ATENCION_ACTUALIZADO',
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };

  // Enviar el evento ÚNICAMENTE a la sala privada del profesional correspondiente
  io.to(`profesional:${evento.id_profesional}`).emit('agenda:cambio', payload);
};
