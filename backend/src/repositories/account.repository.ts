import {
  supabase,
} from '../config/supabase.js';

// Busca las credenciales y el estado de seguridad de una cuenta.
export const findAccountCredentials = async (
  id: string
) => {
  const {
    data,
    error,
  } = await supabase
    .from('usuarios')
    .select(
      'password_hash, activo, email_verificado, intentos_fallidos, bloqueado_hasta'
    )
    .eq('id_usuario', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Actualiza el nombre de usuario de una cuenta activa.
export const updateUsername = async (
  id: string,
  username: string
) => {
  const {
    data,
    error,
  } = await supabase
    .from('usuarios')
    .update({
      nombre_usuario: username,
    })
    .eq('id_usuario', id)
    .eq('activo', true)
    .select('id_usuario')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Reemplaza la contraseña solamente si el hash anterior coincide.
// Esto evita sobrescribir un cambio de contraseña concurrente.
export const replacePassword = async (
  id: string,
  previousHash: string,
  newHash: string
) => {
  const {
    data,
    error,
  } = await supabase
    .from('usuarios')
    .update({
      password_hash: newHash,
      intentos_fallidos: 0,
      bloqueado_hasta: null,
    })
    .eq('id_usuario', id)
    .eq('password_hash', previousHash)
    .eq('activo', true)
    .select('id_usuario')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};