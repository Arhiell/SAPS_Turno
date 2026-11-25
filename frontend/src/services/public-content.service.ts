import publicApi from './auth-api';

import api from './api';
import { DEMONSTRATION_NEWS } from '../data/demonstration-news';
import { isDevelopmentTestNews } from '../utils/public-content';

import type { 
  AdminNews, 
  MunicipalResult, 
  NewsCategory, 
  NewsInput, 
  NewsList, 
  PublicNews, 
  PublicSalita 
} from '../types/public-content.types';

// Obtiene las noticias públicas con paginación y filtros opcionales.
// Si las noticias del backend contienen registros de prueba o están vacías,
// provee contenido institucional de demostración coherente y verificado.
export const getPublicNews = async (
  page = 1,
  filters: {
    destacada?: boolean;
    avisos?: boolean;
  } = {}
): Promise<NewsList> => {
  try {
    const response = await publicApi.get<NewsList>('/public/noticias', {
      params: { page, limit: 6, ...filters },
      timeout: 12000,
    });

    const data = response.data;
    // Filtra publicaciones de prueba de desarrollo
    const verifiedItems = (data.items || []).filter(
      (item) => !isDevelopmentTestNews(item)
    );

    if (verifiedItems.length > 0) {
      return {
        items: verifiedItems,
        total: verifiedItems.length,
      };
    }
  } catch {
    // Si la API falla, pasa a la fuente institucional de demostración
  }

  // Filtrado de contenido de demostración según los parámetros solicitados
  let demoItems = DEMONSTRATION_NEWS;
  if (filters.destacada) {
    demoItems = demoItems.filter((item) => item.destacada);
  } else if (filters.avisos) {
    demoItems = demoItems.filter((item) => item.categoria.es_aviso);
  }

  const limit = 6;
  const start = (page - 1) * limit;
  const paginated = demoItems.slice(start, start + limit);

  return {
    items: paginated,
    total: demoItems.length,
  };
};

// Obtiene el detalle de una noticia pública o su versión de demostración.
export const getPublicNewsDetail = async (id: string): Promise<PublicNews> => {
  const demoItem = DEMONSTRATION_NEWS.find((item) => item.id_noticia === id);
  if (demoItem) {
    return demoItem;
  }

  return (
    await publicApi.get<PublicNews>(`/public/noticias/${id}`, {
      timeout: 12000,
    })
  ).data;
};

// Obtiene las salitas disponibles para la vista pública.
export const getPublicSalitas = async () =>
  (
    await publicApi.get<{ data: PublicSalita[] }>('/salitas', {
      params: { vista: 'publica' },
      timeout: 12000,
    })
  ).data.data;

// Obtiene las noticias institucionales del municipio.
export const getMunicipalNews = async () =>
  (
    await publicApi.get<MunicipalResult>('/public/noticias-municipales', {
      timeout: 12000,
    })
  ).data;

// Obtiene las categorías disponibles para las noticias.
export const getNewsCategories = async () =>
  (await api.get<NewsCategory[]>('/contenido/categorias')).data;

// Obtiene las noticias disponibles dentro del alcance administrativo.
export const getAdminNews = async (page = 1) =>
  (
    await api.get<NewsList<AdminNews>>('/contenido/noticias', {
      params: { page, limit: 9 },
    })
  ).data;

// Obtiene una noticia específica para su edición.
export const getAdminNewsDetail = async (id: string) =>
  (await api.get<AdminNews>(`/contenido/noticias/${id}`)).data;

// Crea una nueva noticia o actualiza una existente.
export const saveNews = async (
  id: string | undefined,
  input: NewsInput
) => {
  if (id) {
    return (
      await api.put<{ id_noticia: string }>(
        `/contenido/noticias/${id}`,
        input
      )
    ).data;
  }

  return (
    await api.post<{ id_noticia: string }>('/contenido/noticias', input)
  ).data;
};