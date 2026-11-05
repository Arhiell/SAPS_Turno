import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../utils/auth-storage';
import type { EventoAgenda, EstadoConexionSocket } from '../types/socket.types';

interface AgendaSocketContextType {
  estadoConexion: EstadoConexionSocket;
  ultimoEvento: EventoAgenda | null;
  notificaciones: EventoAgenda[];
  descartarNotificacion: (id: string) => void;
  limpiarNotificaciones: () => void;
}

const AgendaSocketContext = createContext<AgendaSocketContextType>({
  estadoConexion: 'desconectado',
  ultimoEvento: null,
  notificaciones: [],
  descartarNotificacion: () => {},
  limpiarNotificaciones: () => {},
});

export const useAgendaSocket = () => useContext(AgendaSocketContext);

export function AgendaSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionSocket>('desconectado');
  const [ultimoEvento, setUltimoEvento] = useState<EventoAgenda | null>(null);
  const [notificaciones, setNotificaciones] = useState<EventoAgenda[]>([]);
  const eventosProcesadosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Solo conectamos WebSocket si el usuario está autenticado y tiene rol PROFESIONAL
    if (!user || user.rol !== 'PROFESIONAL') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setEstadoConexion('desconectado');
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, '');

    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setEstadoConexion('conectado');
    });

    socket.on('disconnect', () => {
      setEstadoConexion('desconectado');
    });

    socket.on('connect_error', () => {
      setEstadoConexion('reconectando');
    });

    socket.io.on('reconnect_attempt', () => {
      setEstadoConexion('reconectando');
    });

    socket.io.on('reconnect', () => {
      setEstadoConexion('conectado');
    });

    // Escucha de eventos de cambio de agenda
    socket.on('agenda:cambio', (evento: EventoAgenda) => {
      if (!evento || !evento.id) return;

      // Evita notificaciones duplicadas mediante Set de IDs procesados
      if (eventosProcesadosRef.current.has(evento.id)) return;
      eventosProcesadosRef.current.add(evento.id);

      // Conserva hasta 50 IDs para evitar crecimiento ilimitado de memoria
      if (eventosProcesadosRef.current.size > 50) {
        const arr = Array.from(eventosProcesadosRef.current);
        eventosProcesadosRef.current = new Set(arr.slice(arr.length - 25));
      }

      setUltimoEvento(evento);
      setNotificaciones((prev) => [evento, ...prev.slice(0, 4)]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setEstadoConexion('desconectado');
    };
  }, [user?.id_usuario, user?.rol]);

  const descartarNotificacion = (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  return (
    <AgendaSocketContext.Provider
      value={{
        estadoConexion,
        ultimoEvento,
        notificaciones,
        descartarNotificacion,
        limpiarNotificaciones,
      }}
    >
      {children}
    </AgendaSocketContext.Provider>
  );
}
