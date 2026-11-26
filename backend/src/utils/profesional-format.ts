export interface ProfesionalPersonaInput {
  nombres?: string | null;
  apellidos?: string | null;
  titulo?: string | null;
  denominacion?: string | null;
  tratamiento?: string | null;
}

export interface ProfesionalInput {
  id_profesional?: string;
  matricula?: string | null;
  titulo?: string | null;
  denominacion?: string | null;
  tratamiento?: string | null;
  persona?: ProfesionalPersonaInput | null;
  nombres?: string | null;
  apellidos?: string | null;
}

export type ProfesionalFormatOrder = 'apellidos-primero' | 'nombres-primero';

/**
 * Formatea el nombre y denominación del profesional de forma centralizada en el backend.
 * - Si existe un campo específico de título/tratamiento/denominación en los datos reales, se utiliza como fuente única.
 * - Si no existe información suficiente de denominación, devuelve únicamente nombre y apellido, sin inventar títulos como "Dr." o "Dr./Dra.".
 */
export const formatProfesionalNombre = (
  prof?: ProfesionalInput | ProfesionalPersonaInput | null,
  options?: { order?: ProfesionalFormatOrder }
): string => {
  if (!prof) return 'Profesional sin asignar';

  const anyProf = prof as Record<string, any>;
  const rawPersona = anyProf.persona ?? anyProf;
  const persona = Array.isArray(rawPersona) ? rawPersona[0] : rawPersona;

  const nombres = (persona?.nombres || anyProf.nombres || '').trim();
  const apellidos = (persona?.apellidos || anyProf.apellidos || '').trim();

  const denominacion = (
    anyProf.denominacion ||
    anyProf.titulo ||
    anyProf.tratamiento ||
    persona?.denominacion ||
    persona?.titulo ||
    persona?.tratamiento
  )?.trim();

  if (!nombres && !apellidos) {
    return 'Profesional sin datos';
  }

  const order = options?.order ?? 'apellidos-primero';
  const baseNombre = order === 'nombres-primero'
    ? `${nombres} ${apellidos}`.trim()
    : (apellidos && nombres ? `${apellidos}, ${nombres}` : apellidos || nombres);

  if (denominacion) {
    return `${denominacion} ${baseNombre}`;
  }

  return baseNombre;
};
