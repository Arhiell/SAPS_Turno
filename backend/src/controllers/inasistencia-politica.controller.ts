import type { RequestHandler } from 'express';
import {
  crearJustificacionSchema,
  evaluarJustificacionSchema,
  rectificarInasistenciaSchema,
  justificacionesQuerySchema,
  advertenciasQuerySchema,
  anularAdvertenciaSchema,
} from '../validators/inasistencia-politica.validator.js';
import {
  obtenerEstadoInasistenciasPaciente,
  presentarJustificacion,
  evaluarJustificacion,
  rectificarInasistencia,
  obtenerJustificacionesAdmin,
  obtenerAdvertenciasAdmin,
  anularAdvertenciaOperativa,
  obtenerInasistenciasAdmin,
  obtenerMetricasInasistenciasAdmin,
} from '../services/inasistencia-politica.service.js';
import { AppError } from '../utils/app-error.js';

export const getEstadoInasistenciasController: RequestHandler = async (req, res) => {
  const param = req.params.id_paciente;
  const id_paciente = Array.isArray(param) ? param[0] : param;
  if (!id_paciente) {
    throw new AppError('Identificador de paciente requerido', 400);
  }

  // Pacientes solo pueden consultar su propio estado o el de personas a su cargo autorizadas
  if (req.user?.rol === 'PACIENTE') {
    const { resolveManagedPatient } = await import('../services/patient-managed.service.js');
    await resolveManagedPatient(req.user, id_paciente);
  }

  const estado = await obtenerEstadoInasistenciasPaciente(id_paciente);
  res.json({
    success: true,
    data: estado,
  });
};

export const crearJustificacionController: RequestHandler = async (req, res) => {
  const input = crearJustificacionSchema.parse(req.body);
  const justificacion = await presentarJustificacion(input, req.user!);
  res.status(201).json({
    success: true,
    message: 'Justificación presentada correctamente. Será evaluada por el equipo de tu salita.',
    data: { justificacion },
  });
};

export const listJustificacionesController: RequestHandler = async (req, res) => {
  const query = justificacionesQuerySchema.parse(req.query);
  const result = await obtenerJustificacionesAdmin(query, req.user!);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

export const evaluarJustificacionController: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new AppError('Identificador de justificación requerido', 400);

  const input = evaluarJustificacionSchema.parse(req.body);
  const justificacion = await evaluarJustificacion(id, input, req.user!);
  res.json({
    success: true,
    message: `Justificación ${input.estado.toLowerCase()} correctamente`,
    data: { justificacion },
  });
};

export const rectificarInasistenciaController: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new AppError('Identificador de turno requerido', 400);

  const input = rectificarInasistenciaSchema.parse(req.body);
  const result = await rectificarInasistencia(id, input, req.user!);
  res.json(result);
};

export const listInasistenciasAdminController: RequestHandler = async (req, res) => {
  const { id_salita, id_profesional, id_especialidad, fecha_desde, fecha_hasta, search, page, limit } = req.query;
  const result = await obtenerInasistenciasAdmin(
    {
      id_salita: typeof id_salita === 'string' ? id_salita : undefined,
      id_profesional: typeof id_profesional === 'string' ? id_profesional : undefined,
      id_especialidad: typeof id_especialidad === 'string' ? id_especialidad : undefined,
      fecha_desde: typeof fecha_desde === 'string' ? fecha_desde : undefined,
      fecha_hasta: typeof fecha_hasta === 'string' ? fecha_hasta : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    },
    req.user!
  );
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

export const listAdvertenciasAdminController: RequestHandler = async (req, res) => {
  const query = advertenciasQuerySchema.parse(req.query);
  const result = await obtenerAdvertenciasAdmin(query, req.user!);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

export const anularAdvertenciaAdminController: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new AppError('Identificador de advertencia requerido', 400);

  const input = anularAdvertenciaSchema.parse(req.body);
  const anulada = await anularAdvertenciaOperativa(id, input.motivo_anulacion, req.user!);
  res.json({
    success: true,
    message: 'Advertencia anulada correctamente',
    data: { advertencia: anulada },
  });
};

export const getMetricasInasistenciasController: RequestHandler = async (req, res) => {
  const metricas = await obtenerMetricasInasistenciasAdmin(req.user!);
  res.json({
    success: true,
    data: metricas,
  });
};
