import { supabase } from '../config/supabase.js';
import { literalLikePattern } from '../utils/like-pattern.js';

// Busca una cuenta asociada a una persona.
export const findAccountByPersonId = async (
  idPerson: string
) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, email, activo, email_verificado, id_persona')
    .eq('id_persona', idPerson)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Sincroniza el correo de la cuenta de usuario vinculada a una persona y reinicia su verificación.
export const syncAccountEmailForPerson = async (
  idPerson: string,
  previousEmail: string | null,
  nextEmail: string
) => {
  let account = await findAccountByPersonId(idPerson);

  if (!account && previousEmail) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, email, activo, email_verificado, id_persona')
      .ilike('email', literalLikePattern(previousEmail))
      .is('id_persona', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    account = data;
  }

  if (!account) {
    return null;
  }

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({
      email: nextEmail,
      email_verificado: false,
      id_persona: idPerson,
    })
    .eq('id_usuario', account.id_usuario);

  if (updateError) {
    throw updateError;
  }

  // Limpia tokens pendientes anteriores para permitir emitir el nuevo código sin bloqueo de 60s.
  await supabase
    .from('tokens_verificacion_email')
    .delete()
    .eq('id_usuario', account.id_usuario)
    .is('fecha_uso', null);

  return {
    id_usuario: account.id_usuario,
    email: nextEmail,
  };
};

// Obtiene las credenciales y el estado de seguridad de una cuenta.
export const findAccountCredentials = async (
  id: string
) => {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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

// Reemplaza la contraseña si el hash anterior coincide.
export const replacePassword = async (
  id: string,
  previousHash: string,
  newHash: string
) => {
  const { data, error } = await supabase
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