import api from './api';

import type {
  AgendaDiariaResponse,
  ReporteEspecialidadesResponse,
  ReporteFiltros,
  ReporteFormato,
  ReporteProfesionalesResponse,
  ReporteResumenResponse,
  ReporteTipo,
} from '../types/reporte.types';

const buildParams = (
  filters: ReporteFiltros,
) => {
  const params: Record<string, string> = {
    fecha_desde:
      filters.fecha_desde,
    fecha_hasta:
      filters.fecha_hasta,
  };

  if (filters.id_salita) {
    params.id_salita =
      filters.id_salita;
  }

  return params;
};

export const getReporteResumen =
  async (
    filters: ReporteFiltros,
  ): Promise<ReporteResumenResponse> => {
    const response =
      await api.get<ReporteResumenResponse>(
        '/reportes/resumen',
        {
          params:
            buildParams(filters),
        },
      );

    return response.data;
  };

export const getReporteEspecialidades =
  async (
    filters: ReporteFiltros,
  ): Promise<ReporteEspecialidadesResponse> => {
    const response =
      await api.get<ReporteEspecialidadesResponse>(
        '/reportes/especialidades',
        {
          params:
            buildParams(filters),
        },
      );

    return response.data;
  };

export const getReporteProfesionales =
  async (
    filters: ReporteFiltros,
  ): Promise<ReporteProfesionalesResponse> => {
    const response =
      await api.get<ReporteProfesionalesResponse>(
        '/reportes/profesionales',
        {
          params:
            buildParams(filters),
        },
      );

    return response.data;
  };

export const descargarReporte =
  async (
    filters: ReporteFiltros,
    tipo: ReporteTipo,
    formato: ReporteFormato,
  ): Promise<void> => {
    const response =
      await api.get<Blob>(
        '/reportes/exportar',
        {
          params: {
            ...buildParams(filters),
            tipo,
            formato,
          },
          responseType: 'blob',
        },
      );

    const blob =
      new Blob(
        [response.data],
      );

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const extension =
      formato === 'xlsx'
        ? 'xlsx'
        : formato === 'docx'
          ? 'docx'
          : 'pdf';

    const link =
      document.createElement(
        'a',
      );

    link.href = url;

    link.download =
      `reporte-${tipo}-${filters.fecha_desde}-${filters.fecha_hasta}.${extension}`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    window.URL.revokeObjectURL(
      url,
    );
  };

/* ========================= */
/* AGENDA DIARIA */
/* ========================= */

export interface AgendaFiltros {
  fecha: string;
  id_salita?: string;
  id_profesional?: string;
  id_especialidad?: string;
  estado?: string;
}

const buildAgendaParams = (
  filters: AgendaFiltros,
) => {
  const params: Record<string, string> = {
    fecha: filters.fecha,
  };

  if (filters.id_salita) {
    params.id_salita =
      filters.id_salita;
  }

  if (filters.id_profesional) {
    params.id_profesional =
      filters.id_profesional;
  }

  if (filters.id_especialidad) {
    params.id_especialidad =
      filters.id_especialidad;
  }

  if (filters.estado) {
    params.estado =
      filters.estado;
  }

  return params;
};

export const getAgendaDiaria =
  async (
    filters: AgendaFiltros,
  ): Promise<AgendaDiariaResponse> => {
    const response =
      await api.get<AgendaDiariaResponse>(
        '/reportes/agenda-diaria',
        {
          params:
            buildAgendaParams(filters),
        },
      );

    return response.data;
  };

export const descargarAgendaDiaria =
  async (
    filters: AgendaFiltros,
    formato: ReporteFormato,
  ): Promise<void> => {
    const response =
      await api.get<Blob>(
        '/reportes/agenda-diaria/exportar',
        {
          params: {
            ...buildAgendaParams(
              filters,
            ),
            formato,
          },
          responseType: 'blob',
        },
      );

    const blob =
      new Blob(
        [response.data],
      );

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const extension =
      formato === 'xlsx'
        ? 'xlsx'
        : formato === 'docx'
          ? 'docx'
          : 'pdf';

    const link =
      document.createElement(
        'a',
      );

    link.href = url;

    link.download =
      `agenda-diaria-${filters.fecha}.${extension}`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    window.URL.revokeObjectURL(
      url,
    );
  };