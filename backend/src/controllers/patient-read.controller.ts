import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

import {
  patientDniSchema,
  patientIdSchema,
  patientListQuerySchema,
} from "../validators/patient-query.validator.js";

import {
  getPatientByDni,
  getPatientById,
  getPatients
} from "../services/patient-read.service.js";

/**
 * GET /api/patients
 */
export const listPatientsController = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = patientListQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Parámetros de consulta inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const result = await getPatients
      (
        validation.data, 
        res.locals.salitaScope
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
};

/**
 * GET /api/patients/:id
 */
export const getPatientController = async (
  req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = patientIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "ID del paciente inválido",
        });
      }

      const patient = await getPatientById(validation.data.id);

      return res.status(200).json({
        success: true,
        data: {
          patient,
        },
      });
    } catch (error) {
      next(error);
    }
};

/**
 * GET /api/patients/dni/:dni
 */
export const getPatientByDniController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validation = patientDniSchema.safeParse(req.params);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "DNI del paciente inválido",
      });
    }

    const patient = await getPatientByDni(validation.data.dni);

    return res.status(200).json({
      success: true,
      data: {
        patient,
      },
    });
  } catch (error) {
    next(error);
  }
};
