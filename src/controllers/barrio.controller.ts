import type { Request, Response, NextFunction } from "express";

import {
  getBarrios,
  getBarrio,
  crearBarrio,
  actualizarBarrio,
  eliminarBarrio
} from "../services/barrio.service.js";

// GET /
export const getAllBarrios = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const barrios = await getBarrios();

    return res.status(200).json({
      success: true,
      data: barrios
    });
  } catch (error) {
    next(error);
  }
};

// GET /:id
export const getBarrioById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const barrio = await getBarrio(String(req.params.id));

    if (!barrio) {
      return res.status(404).json({
        success: false,
        message: "Barrio no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: barrio
    });
  } catch (error) {
    next(error);
  }
};

// POST /
export const createBarrio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const barrio = await crearBarrio(req.body);

    return res.status(201).json({
      success: true,
      data: barrio
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id
export const updateBarrio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const barrio = await actualizarBarrio(
      String(req.params.id),
      req.body
    );

    if (!barrio) {
      return res.status(404).json({
        success: false,
        message: "Barrio no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: barrio
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /:id
export const deleteBarrio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const barrio = await eliminarBarrio(
      String(req.params.id)
    );

    if (!barrio) {
      return res.status(404).json({
        success: false,
        message: "Barrio no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Barrio eliminado correctamente",
      data: barrio
    });
  } catch (error) {
    next(error);
  }
};