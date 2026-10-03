import api from './api';
import { getAdminSalitas } from './salitas.service';

import type {
  Bloqueo,
  BloqueoInput,
  CatalogoInput,
  CatalogoRegistro,
  CatalogoTipo,
  Cobertura,
  Horario,
  HorarioInput,
  Parametro,
  Zona,
} from '../types/configuracion.types';

// Relaciona cada catálogo con el nombre de su campo identificador.
const ids = {
  zonas: 'id_zona',
  barrios: 'id_barrio',
  especialidades: 'id_especialidad',
} as const;

// ========================================
// ZONAS
// ========================================

// Obtiene todas las zonas.
export const getZonas = async () =>
  (
    await api.get<{ data: Zona[] }>(
      '/zonas'
    )
  ).data.data;

// ========================================
// CATÁLOGOS
// ========================================

// Obtiene zonas, barrios o especialidades según el tipo indicado.
export const getCatalogo = async (
  tipo: CatalogoTipo
): Promise<CatalogoRegistro[]> => {
  const response = await api.get<{
    data: (CatalogoInput & Record<string, unknown>)[];
  }>(`/${tipo}`);

  // Normaliza el ID para que todos los catálogos utilicen "id".
  return response.data.data.map((row) => ({
    ...row,
    id: String(row[ids[tipo]]),
  }));
};

// Crea o actualiza un registro de catálogo.
export const guardarCatalogo = async (
  tipo: CatalogoTipo,
  input: CatalogoInput,
  id?: string
) => {
  if (id) {
    await api.put(
      `/${tipo}/${id}`,
      input
    );
  } else {
    await api.post(
      `/${tipo}`,
      input
    );
  }
};

// ========================================
// COBERTURA DE SALITAS
// ========================================

// Obtiene las relaciones entre salitas y barrios.
export const getCoberturas = async () =>
  (
    await api.get<{ data: Cobertura[] }>(
      '/salita-barrios'
    )
  ).data.data;

// Crea o actualiza la cobertura de una salita.
export const guardarCobertura = async (
  input: Cobertura,
  editing: boolean
) => {
  if (editing) {
    const {
      id_salita,
      id_barrio,
      ...data
    } = input;

    await api.put(
      `/salita-barrios/${id_salita}/${id_barrio}`,
      data
    );
  } else {
    await api.post(
      '/salita-barrios',
      input
    );
  }
};

// ========================================
// HORARIOS DE ATENCIÓN
// ========================================

// Obtiene todos los horarios de atención.
export const getHorarios = async () =>
  (
    await api.get<Horario[]>(
      '/horarios-atencion'
    )
  ).data;

// Crea o actualiza un horario de atención.
export const guardarHorario = async (
  input: HorarioInput,
  id?: string
) => {
  if (id) {
    await api.put(
      `/horarios-atencion/${id}`,
      input
    );
  } else {
    await api.post(
      '/horarios-atencion',
      input
    );
  }
};

// ========================================
// BLOQUEOS DE AGENDA
// ========================================

// Obtiene los bloqueos registrados en la agenda.
export const getBloqueos = async () =>
  (
    await api.get<Bloqueo[]>(
      '/bloqueos-agenda'
    )
  ).data;

// Crea o actualiza un bloqueo de agenda.
export const guardarBloqueo = async (
  input: BloqueoInput,
  id?: string
) => {
  if (id) {
    await api.put(
      `/bloqueos-agenda/${id}`,
      input
    );
  } else {
    await api.post(
      '/bloqueos-agenda',
      input
    );
  }
};

// ========================================
// PARÁMETROS DEL SISTEMA
// ========================================

// Obtiene los parámetros visibles para el usuario actual.
export const getParametros = async () =>
  (
    await api.get<{
      configuraciones: Parametro[];
    }>('/configuracion')
  ).data.configuraciones;

// Obtiene las salitas que el usuario puede configurar.
export const getSalitasConfigurables = async (
  superAdmin: boolean
) => {
  const { data } = await getAdminSalitas();

  return superAdmin
    ? data
    : data.filter((salita) => salita.activo);
};

// Crea o actualiza un parámetro del sistema.
export const guardarParametro = async (
  input: Omit<
    Parametro,
    'id_configuracion'
  >,
  id?: string,
  superAdmin = false
) => {
  if (id) {
    await api.patch(
      `/configuracion/${id}`,
      {
        valor: input.valor,
        descripcion: input.descripcion,

        // Solo SUPER_ADMIN puede modificar
        // la visibilidad pública.
        ...(superAdmin
          ? {
              es_publica: input.es_publica,
            }
          : {}),
      }
    );
  } else {
    await api.post(
      '/configuracion',
      input
    );
  }
};
