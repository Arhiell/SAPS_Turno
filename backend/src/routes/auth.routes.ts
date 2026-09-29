import {
  Router,
} from 'express';

import {
  changeUsername,
  changePassword,
} from '../controllers/account.controller.js';

import {
  authenticate,
} from '../middlewares/auth.middleware.js';

import {
  requireRole,
} from '../middlewares/role.middleware.js';

import {
  ownProfile,
  completeProfile,
  updateOwnProfile,
} from '../controllers/auth-profile.controller.js';

import {
  login,
  logout,
  refresh,
  register,
} from '../controllers/auth.controller.js';

// Crea el router para las rutas de autenticación y cuenta.
const router = Router();

// ========================================
// CUENTA DEL PACIENTE
// ========================================

// Permite al paciente cambiar su nombre de usuario.
router.patch(
  '/username',
  authenticate,
  requireRole('PACIENTE'),
  changeUsername
);

// Permite al paciente cambiar su contraseña.
router.patch(
  '/password',
  authenticate,
  requireRole('PACIENTE'),
  changePassword
);

// ========================================
// PERFIL DEL USUARIO
// ========================================

// Obtiene el perfil del usuario autenticado.
router.get(
  '/me',
  authenticate,
  ownProfile
);

// Actualiza el perfil del paciente autenticado.
router.patch(
  '/profile',
  authenticate,
  requireRole('PACIENTE'),
  updateOwnProfile
);

// Completa el perfil del paciente autenticado.
router.post(
  '/profile',
  authenticate,
  requireRole('PACIENTE'),
  completeProfile
);

// ========================================
// AUTENTICACIÓN
// ========================================

// Registro público.
router.post(
  '/register',
  register
);

// Inicio de sesión.
router.post(
  '/login',
  login
);

// Renovación de tokens.
router.post(
  '/refresh',
  refresh
);

// Cierre de sesión.
router.post(
  '/logout',
  logout
);

export default router;