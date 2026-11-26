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
 * Formatea el nombre y denominación del profesional de manera consistente en todo CORA.
 * - Utiliza la denominación/título únicamente si existe en los datos reales.
 * - No inventa títulos como "Dr.", "Dra." ni "Dr./Dra." cuando no hay información suficiente.
 * - Mantiene el formato estándar "Apellidos, Nombres" (o "Nombres Apellidos" según la opción).
 */
export const formatProfesionalName = (
  prof?: ProfesionalInput | ProfesionalPersonaInput | null,
  options?: {
    order?: ProfesionalFormatOrder;
    includeMatricula?: boolean;
    matriculaPrefix?: 'Matrícula' | 'Mat.';
  }
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

  const nombreConDenominacion = denominacion
    ? `${denominacion} ${baseNombre}`
    : baseNombre;

  if (options?.includeMatricula && anyProf.matricula) {
    const prefix = options.matriculaPrefix ?? 'Matrícula';
    return `${nombreConDenominacion} · ${prefix} ${anyProf.matricula}`;
  }

  return nombreConDenominacion;
};
