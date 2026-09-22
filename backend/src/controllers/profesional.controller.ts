import type { Request, Response, NextFunction } from "express";

import {
  getProfesionales,
  getProfesional,
  crearProfesional,
  actualizarProfesional,
  eliminarProfesional
} from "../services/profesional.service.js";

// GET /
export const getAllProfesionales = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profesionales = await getProfesionales();

    return res.status(200).json({
      success: true,
      data: profesionales
    });
  } catch (error) {
    next(error);
  }
};

// GET /:id
export const getProfesionalById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profesional = await getProfesional(
      String(req.params.id)
    );

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: "Profesional no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: profesional
    });
  } catch (error) {
    next(error);
  }
};

// POST /
export const createProfesional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profesional = await crearProfesional(req.body);

    return res.status(201).json({
      success: true,
      data: profesional
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id
export const updateProfesional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profesional = await actualizarProfesional(
      String(req.params.id),
      req.body
    );

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: "Profesional no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: profesional
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /:id
export const deleteProfesional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profesional = await eliminarProfesional(
      String(req.params.id)
    );

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: "Profesional no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profesional eliminado correctamente",
      data: profesional
    });
  } catch (error) {
    next(error);
  }
};