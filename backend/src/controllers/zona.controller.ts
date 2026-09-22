import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  getZonas,
  getZona,
  crearZona,
  actualizarZona,
  eliminarZona,
} from "../services/zona.service.js";

// GET /
export const getAllZonas = async (
  _req: Request, res: Response, next: NextFunction) => {
    try {
      const zonas = await getZonas();

      return res.status(200).json({
        success: true,
        data: zonas,
      });
    } catch (error) {
      next(error);
    }
};

// GET /:id
export const getZonaById = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const zona = await getZona(String(req.params.id));

      if (!zona) {
        return res.status(404).json({
          success: false,
          message: "Zona no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        data: zona,
      });
  } catch (error) {
    next(error);
  }
};

// POST /
export const createZona = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const zona = await crearZona(req.body);

      return res.status(201).json({
        success: true,
        data: zona,
      });
    } catch (error) {
      next(error);
    }
};

// PUT /:id
export const updateZona = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const zona = await actualizarZona(String(req.params.id), req.body);

      if (!zona) {
        return res.status(404).json({
          success: false,
          message: "Zona no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        data: zona,
      });
    } catch (error) {
      next(error);
    }
};

// DELETE /:id
export const deleteZona = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const zona = await eliminarZona(String(req.params.id));

      if (!zona) {
        return res.status(404).json({
          success: false,
          message: "Zona no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Zona eliminada correctamente",
        data: zona,
      });
    } catch (error) {
      next(error);
    }
};
