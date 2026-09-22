import { supabase } from "../config/supabase.js";
import type { CreatePersonInput } from "../validators/person.validator.js";
import { personSelect } from "./person-read.repository.js";

export const createPerson = async (input: CreatePersonInput) => {
  const { data, error } = await supabase.from("personas").insert(input)
    .select(personSelect).single();
  if (error) throw error;
  return data;
};