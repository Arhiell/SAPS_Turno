import { supabase } from '../config/supabase.js';

import type {
  CreatePersonInput,
} from '../validators/person.validator.js';

import { personSelect } from './person-read.repository.js';

// Crea una persona y devuelve sus datos.
export const createPerson = async (
  input: CreatePersonInput
) => {
  const { data, error } = await supabase
    .from('personas')
    .insert(input)
    .select(personSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Crea la persona y la vincula al administrador en una transacción.
export const createPersonForAdmin = async (
  idUsuario: string,
  input: Omit<CreatePersonInput, 'email'>,
  ip: string | null
) => {
  const { data, error } = await supabase.rpc(
    'completar_perfil_administrativo',
    {
      p_usuario: idUsuario,
      p_persona: input,
      p_ip: ip,
    }
  );

  if (error) {
    throw error;
  }

  return data as string;
};