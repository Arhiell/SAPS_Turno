import {
  canViewAccount,
} from '../repositories/account-display.select.js';

import { supabase } from '../config/supabase.js';
import { agendaDateTime } from '../utils/turno-time.js';
import { AppError } from '../utils/app-error.js';

export { 
  publicSalitas as getPublicSalitas 
} from '../repositories/public-salitas.repository.js';

import {
  createSalita,
  deleteSalita,
  getAllSalitas,
  getSalitaById,
  getSalitasByIds,
  updateSalita,
} from '../repositories/salita.repository.js';

import type {
  AuthenticatedUser,
} from '../types/auth.types.js';

import {
  getTurnoScope,
} from './turno-access.service.js';

import {
  emitirCambioSalita,
} from './socket.service.js';

// Obtiene todas las salitas disponibles.
export const getSalitas = async () => {
  return await getAllSalitas();
};

// Obtiene las salitas administrativas según el alcance del usuario.
export const getSalitasAdministrativas = async (
  user: AuthenticatedUser
) => {
  const scope =
    await getTurnoScope(user);

  // El SUPER_ADMIN puede acceder a todas las salitas.
  if (scope === null) {
    return await getAllSalitas(
      canViewAccount(user)
    );
  }

  // Limita las salitas según el alcance asignado al usuario.
  return await getSalitasByIds(
    scope,
    canViewAccount(user)
  );
};

// Obtiene una salita por su identificador.
export const getSalita = async (
  id: string
) => {
  return await getSalitaById(
    id
  );
};

// Crea una nueva salita.
export const crearSalita = async (
  salita: {
    codigo: string;
    nombre: string;
    direccion: string;
    id_barrio: string;
    telefono?: string | null;
    email?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    horario_apertura?: string | null;
    horario_cierre?: string | null;
    activo?: boolean;
  }
) => {
  const created = await createSalita(
    salita
  );

  try {
    emitirCambioSalita({
      tipo: 'SALITA_CREADA',
      mensaje: `Nueva salita creada: ${created.nombre}`,
      id_salita: created.id_salita,
      activo: created.activo,
    });
  } catch {
    // Notificación en tiempo real es complementaria
  }

  return created;
};

// Actualiza los datos de una salita.
export const actualizarSalita = async (
  id: string,
  salita: {
    codigo?: string;
    nombre?: string;
    direccion?: string;
    id_barrio?: string;
    telefono?: string | null;
    email?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    horario_apertura?: string | null;
    horario_cierre?: string | null;
    activo?: boolean;
  }
) => {
  const updated = await updateSalita(
    id,
    salita
  );

  try {
    const esCambioEstado = typeof salita.activo === 'boolean';
    emitirCambioSalita({
      tipo: esCambioEstado ? 'SALITA_ESTADO_CAMBIADO' : 'SALITA_ACTUALIZADA',
      mensaje: esCambioEstado
        ? `Estado de salita ${salita.activo ? 'activado' : 'desactivado'}`
        : `Datos de salita actualizados`,
      id_salita: id,
      activo: updated?.activo,
    });
  } catch {
    // Notificación en tiempo real es complementaria
  }

  return updated;
};

// Realiza la baja lógica de una salita.
export const eliminarSalita = async (
  id: string
) => {
  const deleted = await deleteSalita(
    id
  );

  try {
    emitirCambioSalita({
      tipo: 'SALITA_ESTADO_CAMBIADO',
      mensaje: `Salita dada de baja (inactivada)`,
      id_salita: id,
      activo: false,
    });
  } catch {
    // Notificación en tiempo real es complementaria
  }

  return deleted;
};

// ========================================
// COBERTURA TERRITORIAL PARA GESTIÓN DE PACIENTES
// ========================================

/**
 * Obtiene la cobertura territorial autorizada para una salita específica.
 * Devuelve únicamente las zonas y barrios que dicha salita cubre activamente.
 */
export const getCoberturaTerritorialSalita = async (idSalita: string) => {
  const today = agendaDateTime(new Date()).date;

  const { data: salita, error: salitaError } = await supabase
    .from('salitas')
    .select('id_salita, codigo, nombre, direccion, id_barrio, activo')
    .eq('id_salita', idSalita)
    .single();

  if (salitaError || !salita) {
    throw new AppError('Salita no encontrada', 404);
  }

  const { data: coberturas, error: cobError } = await supabase
    .from('salita_barrios')
    .select(`
      id_salita,
      id_barrio,
      es_barrio_sede,
      activo,
      fecha_desde,
      fecha_hasta,
      barrio:barrios!inner(
        id_barrio,
        id_zona,
        nombre,
        codigo_postal,
        activo,
        zona:zonas!inner(
          id_zona,
          nombre,
          activo
        )
      )
    `)
    .eq('id_salita', idSalita)
    .eq('activo', true)
    .lte('fecha_desde', today)
    .or(`fecha_hasta.is.null,fecha_hasta.gte.${today}`);

  if (cobError) throw cobError;

  const zonasMap = new Map<string, { id_zona: string; nombre: string; activo: boolean }>();
  const barriosList: Array<{
    id_barrio: string;
    id_zona: string;
    nombre: string;
    codigo_postal?: string | null;
    es_barrio_sede: boolean;
    activo: boolean;
  }> = [];

  for (const c of coberturas || []) {
    const b = c.barrio as any;
    if (b && b.activo && b.zona && b.zona.activo) {
      if (!zonasMap.has(b.id_zona)) {
        zonasMap.set(b.id_zona, {
          id_zona: b.zona.id_zona,
          nombre: b.zona.nombre,
          activo: true,
        });
      }
      barriosList.push({
        id_barrio: b.id_barrio,
        id_zona: b.id_zona,
        nombre: b.nombre,
        codigo_postal: b.codigo_postal,
        es_barrio_sede: Boolean(c.es_barrio_sede),
        activo: true,
      });
    }
  }

  const zonasList = Array.from(zonasMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es-AR')
  );

  barriosList.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-AR'));

  return {
    salita,
    salitas: [salita],
    zonas: zonasList,
    barrios: barriosList,
    coberturas: (coberturas || []).map((c) => ({
      id_salita: c.id_salita,
      id_barrio: c.id_barrio,
      es_barrio_sede: Boolean(c.es_barrio_sede),
      activo: Boolean(c.activo),
      fecha_desde: c.fecha_desde,
      fecha_hasta: c.fecha_hasta,
    })),
  };
};

/**
 * Obtiene la cobertura combinada para múltiples salitas autorizadas (e.g. RECEPCION).
 */
export const getCoberturaTerritorialSalitas = async (idsSalitas: string[]) => {
  const today = agendaDateTime(new Date()).date;

  const { data: salitas, error: salitasError } = await supabase
    .from('salitas')
    .select('id_salita, codigo, nombre, direccion, id_barrio, activo')
    .in('id_salita', idsSalitas)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (salitasError) throw salitasError;

  const { data: coberturas, error: cobError } = await supabase
    .from('salita_barrios')
    .select(`
      id_salita,
      id_barrio,
      es_barrio_sede,
      activo,
      fecha_desde,
      fecha_hasta,
      barrio:barrios!inner(
        id_barrio,
        id_zona,
        nombre,
        codigo_postal,
        activo,
        zona:zonas!inner(
          id_zona,
          nombre,
          activo
        )
      )
    `)
    .in('id_salita', idsSalitas)
    .eq('activo', true)
    .lte('fecha_desde', today)
    .or(`fecha_hasta.is.null,fecha_hasta.gte.${today}`);

  if (cobError) throw cobError;

  const zonasMap = new Map<string, { id_zona: string; nombre: string; activo: boolean }>();
  const barriosMap = new Map<
    string,
    {
      id_barrio: string;
      id_zona: string;
      nombre: string;
      codigo_postal?: string | null;
      es_barrio_sede: boolean;
      activo: boolean;
    }
  >();

  for (const c of coberturas || []) {
    const b = c.barrio as any;
    if (b && b.activo && b.zona && b.zona.activo) {
      if (!zonasMap.has(b.id_zona)) {
        zonasMap.set(b.id_zona, {
          id_zona: b.zona.id_zona,
          nombre: b.zona.nombre,
          activo: true,
        });
      }
      if (!barriosMap.has(b.id_barrio)) {
        barriosMap.set(b.id_barrio, {
          id_barrio: b.id_barrio,
          id_zona: b.id_zona,
          nombre: b.nombre,
          codigo_postal: b.codigo_postal,
          es_barrio_sede: Boolean(c.es_barrio_sede),
          activo: true,
        });
      }
    }
  }

  const zonasList = Array.from(zonasMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es-AR')
  );

  const barriosList = Array.from(barriosMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es-AR')
  );

  return {
    salitas: salitas || [],
    zonas: zonasList,
    barrios: barriosList,
    coberturas: (coberturas || []).map((c) => ({
      id_salita: c.id_salita,
      id_barrio: c.id_barrio,
      es_barrio_sede: Boolean(c.es_barrio_sede),
      activo: Boolean(c.activo),
      fecha_desde: c.fecha_desde,
      fecha_hasta: c.fecha_hasta,
    })),
  };
};

/**
 * Cobertura territorial global (para SUPER_ADMIN).
 */
export const getCoberturaTerritorialGlobal = async () => {
  const today = agendaDateTime(new Date()).date;

  const [salitasRes, zonasRes, barriosRes, cobRes] = await Promise.all([
    supabase
      .from('salitas')
      .select('id_salita, codigo, nombre, direccion, id_barrio, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
    supabase
      .from('zonas')
      .select('id_zona, nombre, descripcion, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
    supabase
      .from('barrios')
      .select('id_barrio, id_zona, nombre, codigo_postal, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
    supabase
      .from('salita_barrios')
      .select('id_salita, id_barrio, es_barrio_sede, activo, fecha_desde, fecha_hasta')
      .eq('activo', true)
      .lte('fecha_desde', today)
      .or(`fecha_hasta.is.null,fecha_hasta.gte.${today}`),
  ]);

  if (salitasRes.error) throw salitasRes.error;
  if (zonasRes.error) throw zonasRes.error;
  if (barriosRes.error) throw barriosRes.error;
  if (cobRes.error) throw cobRes.error;

  return {
    salitas: salitasRes.data || [],
    zonas: zonasRes.data || [],
    barrios: barriosRes.data || [],
    coberturas: (cobRes.data || []).map((c) => ({
      id_salita: c.id_salita,
      id_barrio: c.id_barrio,
      es_barrio_sede: Boolean(c.es_barrio_sede),
      activo: Boolean(c.activo),
      fecha_desde: c.fecha_desde,
      fecha_hasta: c.fecha_hasta,
    })),
  };
};
