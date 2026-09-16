import { supabase } from "../config/supabase.js";

/**
 * Cuenta los usuarios registrados.
 * No descarga datos sensibles como password_hash.
 */
export const countUsers = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("usuarios")
    .select("id_usuario", {
      count: "exact",
      head: true
    });

  // Si Supabase devuelve un error, detenemos la operación.
  if (error) {
    throw new Error(
      `Error consultando usuarios: ${error.message}`
    );
  }

  return count ?? 0;
};

/**
 * Cuenta los roles existentes.
 * La base inicial debería contener 5 roles.
 */
export const countRoles = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("roles")
    .select("id_rol", {
      count: "exact",
      head: true
    });

  if (error) {
    throw new Error(
      `Error consultando roles: ${error.message}`
    );
  }

  return count ?? 0;
};

/**
 * Datos básicos de un usuario devuelto
 * por la base de datos.
 */
export interface UserAccount {
  id_usuario: string;
  nombre_usuario: string;
  email: string;
  email_verificado: boolean;
  activo: boolean;
  fecha_creacion: string;
}

/**
 * Datos necesarios para insertar una cuenta.
 */
export interface CreateUserData {
  id_rol: string;
  nombre_usuario: string;
  email: string;
  password_hash: string;
}

/**
 * Busca un usuario por correo.
 *
 * Utilizamos ilike para comparar sin distinguir
 * mayúsculas de minúsculas.
 */
export const findUserByEmail = async (
  email: string
) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id_usuario, email")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando usuario por email: ${error.message}`
    );
  }

  return data;
};

/**
 * Busca una cuenta por nombre de usuario.
 */
export const findUserByUsername = async (
  nombreUsuario: string
) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id_usuario, nombre_usuario")
    .ilike("nombre_usuario", nombreUsuario)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando nombre de usuario: ${error.message}`
    );
  }

  return data;
};

/**
 * Busca un rol activo mediante su código.
 */
export const findRoleByCode = async (
  codigo: string
) => {
  const { data, error } = await supabase
    .from("roles")
    .select("id_rol, codigo, nombre")
    .eq("codigo", codigo)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando rol: ${error.message}`
    );
  }

  return data;
};

/**
 * Inserta una nueva cuenta.
 *
 * Importante:
 * password_hash se envía a PostgreSQL,
 * pero nunca se devuelve al cliente.
 */
export const createUser = async (
  userData: CreateUserData
): Promise<UserAccount> => {
  const { data, error } = await supabase
    .from("usuarios")
    .insert({
      id_rol: userData.id_rol,
      nombre_usuario: userData.nombre_usuario,
      email: userData.email,
      password_hash: userData.password_hash
    })
    .select(`
      id_usuario,
      nombre_usuario,
      email,
      email_verificado,
      activo,
      fecha_creacion
    `)
    .single();

  if (error) {
    throw new Error(
      `Error creando usuario: ${error.message}`
    );
  }

  

  return data;
};

/**
 * Busca al usuario para iniciar sesión.
 *
 * Aquí sí necesitamos password_hash,
 * pero exclusivamente dentro del backend.
 */
export const findUserForLogin = async (
  identifier: string
) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select(`
      id_usuario,
      id_rol,
      nombre_usuario,
      email,
      password_hash,
      email_verificado,
      intentos_fallidos,
      bloqueado_hasta,
      activo
    `)
    .or(
      `email.ilike.${identifier},nombre_usuario.ilike.${identifier}`
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando usuario: ${error.message}`
    );
  }

  return data;
};

/**
 * Obtiene un rol mediante su UUID.
 */
export const findRoleById = async (
  idRol: string
) => {
  const { data, error } = await supabase
    .from("roles")
    .select("id_rol, codigo, nombre, activo")
    .eq("id_rol", idRol)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error obteniendo rol: ${error.message}`
    );
  }

  return data;
};

/**
 * Obtiene información actual del usuario.
 *
 * Será utilizado por el middleware JWT.
 */
export const findUserById = async (
  idUsuario: string
) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select(`
      id_usuario,
      id_rol,
      nombre_usuario,
      email,
      activo
    `)
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando usuario: ${error.message}`
    );
  }

  return data;
};

/**
 * Reinicia intentos fallidos y registra
 * el último acceso exitoso.
 */
export const registerSuccessfulLogin = async (
  idUsuario: string
) => {
  const { error } = await supabase
    .from("usuarios")
    .update({
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      ultimo_acceso: new Date().toISOString()
    })
    .eq("id_usuario", idUsuario);

  if (error) {
    throw new Error(
      `Error actualizando acceso: ${error.message}`
    );
  }
};

/**
 * Comprueba que una salita exista y esté activa.
 */
export const findActiveSalitaById = async (
  idSalita: string
) => {
  const { data, error } = await supabase
    .from("salitas")
    .select("id_salita, nombre, activo")
    .eq("id_salita", idSalita)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando salita: ${error.message}`
    );
  }

  return data;
};

/**
 * Vincula un administrador con su salita.
 */
export const assignUserToSalita = async (
  idUsuario: string,
  idSalita: string
) => {
  const { error } = await supabase
    .from("usuario_salita")
    .insert({
      id_usuario: idUsuario,
      id_salita: idSalita,
      es_principal: true,
      activo: true
    });

  if (error) {
    throw new Error(
      `Error asignando usuario a salita: ${error.message}`
    );
  }
};

/**
 * Registra un intento fallido de inicio de sesión.
 *
 * También puede establecer la fecha hasta
 * la cual la cuenta queda bloqueada.
 */
export const registerFailedLogin = async (
  idUsuario: string,
  attempts: number,
  blockedUntil: string | null
) => {
  const { error } = await supabase
    .from("usuarios")
    .update({
      intentos_fallidos: attempts,
      bloqueado_hasta: blockedUntil
    })
    .eq("id_usuario", idUsuario);

  if (error) {
    throw new Error(
      `Error registrando intento fallido: ${error.message}`
    );
  }
};

/**
 * Limpia un bloqueo que ya venció.
 *
 * El usuario vuelve a comenzar desde
 * cero intentos fallidos.
 */
export const clearExpiredLoginLock = async (
  idUsuario: string
) => {
  const { error } = await supabase
    .from("usuarios")
    .update({
      intentos_fallidos: 0,
      bloqueado_hasta: null
    })
    .eq("id_usuario", idUsuario);

  if (error) {
    throw new Error(
      `Error limpiando bloqueo: ${error.message}`
    );
  }
};

/**
 * Marca una cuenta como email verificado.
 *
 * Se utiliza para cuentas internas creadas
 * mediante procesos de confianza.
 */
export const verifyUserEmailDirectly = async (
  idUsuario: string
) => {
  const { error } = await supabase
    .from("usuarios")
    .update({
      email_verificado: true
    })
    .eq("id_usuario", idUsuario);

  if (error) {
    throw new Error(
      `Error verificando email del usuario: ${error.message}`
    );
  }
};