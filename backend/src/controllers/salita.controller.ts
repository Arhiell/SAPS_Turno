import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  getSalitas,
  getSalitasAdministrativas,
  getSalita,
  crearSalita,
  actualizarSalita,
  eliminarSalita,
} from "../services/salita.service.js";

// GET /
export const getAllSalitas = async (
  _req: Request, res: Response, next: NextFunction) => {
    try {
      const salitas = await getSalitas();

      return res.status(200).json({
        success: true,
        data: salitas,
      });
    } catch (error) {
      next(error);
    }
};

export const getAdminSalitas = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const salitas = await getSalitasAdministrativas(req.user!);

      return res.status(200).json({
        success: true,
        data: salitas,
      });
    } catch (error) {
      next(error);
    }
};

// GET /:id
export const getSalitaById = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const salita = await getSalita(String(req.params.id));

      if (!salita) {
        return res.status(404).json({
          success: false,
          message: "Salita no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        data: salita,
      });
    } catch (error) {
      next(error);
    }
};

// POST /
export const createSalita = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const salita = await crearSalita(req.body);

      return res.status(201).json({
        success: true,
        data: salita,
      });
    } catch (error) {
      next(error);
    }
};

// PUT /:id
export const updateSalita = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const salita = await actualizarSalita(String(req.params.id), req.body);

      if (!salita) {
        return res.status(404).json({
          success: false,
          message: "Salita no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        data: salita,
      });
    } catch (error) {
      next(error);
    }
};

// DELETE /:id
export const deleteSalita = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const salita = await eliminarSalita(String(req.params.id));

      if (!salita) {
        return res.status(404).json({
          success: false,
          message: "Salita no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Salita eliminada correctamente",
        data: salita,
      });
    } catch (error) {
      next(error);
    }
};
