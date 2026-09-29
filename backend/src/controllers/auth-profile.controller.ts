import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  getOwnProfile,
  completeOwnProfile,
} from '../services/auth-profile.service.js';

import {
  ownPatientUpdateSchema,
} from '../validators/patient-update.validator.js';

import {
  editOwnPatient,
} from '../services/patient-update.service.js';

// Actualiza los datos del perfil del paciente autenticado.
export const updateOwnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Valida los datos enviados antes de actualizar.
    const input = ownPatientUpdateSchema.parse(
      req.body
    );

    await editOwnPatient(
      input,
      req.user!
    );

    // Devuelve el perfil actualizado.
    res.json({
      success: true,
      data: await getOwnProfile(req.user!),
    });
  } catch (error) {
    next(error);
  }
};

// Obtiene el perfil del usuario autenticado.
export const ownProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      success: true,
      data: await getOwnProfile(req.user!),
    });
  } catch (error) {
    next(error);
  }
};

// Completa por primera vez el perfil del paciente autenticado.
export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await completeOwnProfile(
      req.body,
      req.user!
    );

    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};