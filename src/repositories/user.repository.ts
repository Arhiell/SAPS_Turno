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