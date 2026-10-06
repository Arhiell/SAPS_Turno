import type {
  AuthenticatedUser,
} from '../types/auth.types.js';

// Define los datos de cuenta visibles en operaciones administrativas.
export const accountDisplaySelect =
  'id_usuario, nombre_usuario, email, email_verificado, activo, rol:roles!inner(codigo)';

// Incluye la cuenta asociada a una persona usando una proyección segura.
export const personAccountSelect =
  `cuenta:usuarios!usuarios_id_persona_fkey(${accountDisplaySelect})`;

// Determina si el usuario puede visualizar datos de cuentas.
export const canViewAccount = (
  user: AuthenticatedUser
) =>
  user.rol ===
    'SUPER_ADMIN' ||
  user.rol ===
    'ADMIN_SALITA';

// Representa los datos administrativos visibles de una cuenta.
export interface AccountDisplay {
  id_usuario: string;
  nombre_usuario: string;
  email: string;
  email_verificado: boolean;
  activo: boolean;
  rol: {
    codigo: string;
  };
}