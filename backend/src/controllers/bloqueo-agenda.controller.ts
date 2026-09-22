import type { Request, Response, NextFunction } from "express";

import {
  actualizarBloqueo,
  crearBloqueo,
  eliminarBloqueo,
  getBloqueo,
  getBloqueos,
} from "../services/bloqueo-agenda.service.js";

export const obtenerBloqueos = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bloqueos = await getBloqueos();

    return res.status(200).json(bloqueos);
  } catch (error) {
    next(error);
  }
};

export const obtenerBloqueo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const bloqueo = await getBloqueo(id);

    if (!bloqueo) {
      return res.status(404).json({
        message: "Bloqueo no encontrado",
      });
    }

    return res.status(200).json(bloqueo);
  } catch (error) {
    next(error);
  }
};

export const crearBloqueoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bloqueo = await crearBloqueo(req.body);

    return res.status(201).json(bloqueo);
  } catch (error) {
    next(error);
  }
};

export const actualizarBloqueoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const bloqueo = await actualizarBloqueo(id, req.body);

    if (!bloqueo) {
      return res.status(404).json({
        message: "Bloqueo no encontrado",
      });
    }

    return res.status(200).json(bloqueo);
  } catch (error) {
    next(error);
  }
};

export const eliminarBloqueoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const bloqueo = await eliminarBloqueo(id);

    if (!bloqueo) {
      return res.status(404).json({
        message: "Bloqueo no encontrado",
      });
    }

    return res.status(200).json({
      message: "Bloqueo desactivado correctamente",
      bloqueo,
    });
  } catch (error) {
    next(error);
  }
};