import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

import {
  actualizarHorario,
  crearHorario,
  eliminarHorario,
  getHorario,
  getHorarios,
} from "../services/horario-atencion.service.js";

export const obtenerHorarios = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const horarios = await getHorarios(res.locals.salitaScope);

    return res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
};

export const obtenerHorario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const horario = await getHorario(id);

    if (!horario) {
      return res.status(404).json({
        message: "Horario no encontrado",
      });
    }

    return res.status(200).json(horario);
  } catch (error) {
    next(error);
  }
};

export const crearHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const horario = await crearHorario(req.body);

    return res.status(201).json(horario);
  } catch (error) {
    next(error);
  }
};

export const actualizarHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const horario = await actualizarHorario(id, req.body);

    if (!horario) {
      return res.status(404).json({
        message: "Horario no encontrado",
      });
    }

    return res.status(200).json(horario);
  } catch (error) {
    next(error);
  }
};

export const eliminarHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const horario = await eliminarHorario(id);

    if (!horario) {
      return res.status(404).json({
        message: "Horario no encontrado",
      });
    }

    return res.status(200).json({
      message: "Horario desactivado correctamente",
      horario,
    });
  } catch (error) {
    next(error);
  }
};