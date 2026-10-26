import api from './api';
import type { Patient } from '../types/patient.types';

export type ManagedPatient = Pick<Patient, 'id_paciente' | 'id_barrio' | 'id_salita_asignada' | 'nombres' | 'apellidos' | 'dni' | 'fecha_nacimiento'> & {
  parentesco: string; fecha_hasta: string | null;
};
export const getManagedPatients = async () =>
  (await api.get<{ data: ManagedPatient[] }>('/patients/personas-a-cargo')).data.data;