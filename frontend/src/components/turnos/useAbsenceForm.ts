import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBloqueos, getSalitasConfigurables } from '../../services/configuracion.service';
import { getProfessionals, getProfessionalClinics, getProfessionalSpecialties } from '../../services/profesionales.service';
import { getSpecialties } from '../../services/especialidades.service';
import type { Bloqueo, BloqueoInput } from '../../types/configuracion.types';
import type { Professional, ProfessionalClinic, ProfessionalSpecialty, Specialty } from '../../types/profesional.types';
import type { Salita } from '../../types/salita.types';
import type { AgendaChange } from '../../services/agenda-impacto.service';
import { authError } from '../../utils/auth-errors';

const empty = (id_salita = ''): BloqueoInput => ({
  id_salita,
  id_profesional: null,
  id_especialidad: null,
  fecha: '',
  hora_inicio: null,
  hora_fin: null,
  dia_completo: true,
  motivo: '',
  activo: true,
});

export default function useAbsenceForm() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'SUPER_ADMIN';

  const [rows, setRows] = useState<Bloqueo[]>([]);
  const [clinics, setClinics] = useState<Salita[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [relations, setRelations] = useState<{ clinics: ProfessionalClinic[]; specialties: ProfessionalSpecialty[] }>({
    clinics: [],
    specialties: [],
  });
  const [relationsReady, setRelationsReady] = useState(false);
  const [form, setForm] = useState<BloqueoInput>(() => empty());
  const [editing, setEditing] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [impact, setImpact] = useState<AgendaChange | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  // Determina si el usuario tiene una única salita asignada (ADMIN_SALITA / RECEPCION con 1 salita)
  const singleClinic = !isSuperAdmin && clinics.length === 1;
  const assignedClinic = clinics[0] ?? null;

  // Carga inicial de ausencias, salitas autorizadas, profesionales y especialidades
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReady(false);
    setError('');

    void Promise.all([
      getBloqueos(),
      getSalitasConfigurables(isSuperAdmin),
      getProfessionals(),
      getSpecialties(),
    ])
      .then(([r, c, p, s]) => {
        if (!active) return;
        setRows(r);
        setClinics(c);
        setProfessionals(p.data);
        setSpecialties(s.data);
        setReady(true);

        // Preselección automática de salita si tiene 1 sola asignada o no es superadmin con 1 salita
        if (c.length === 1) {
          setForm((prev) => ({
            ...prev,
            id_salita: c[0].id_salita,
          }));
        }
      })
      .catch((cause) => {
        if (active) setError(authError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [revision, isSuperAdmin]);

  // Profesionales disponibles para la salita seleccionada
  const availableProfessionals = useMemo(() => {
    if (!form.id_salita) return professionals.filter((p) => p.activo);
    return professionals.filter((p) => {
      if (!p.activo) return false;
      if (!p.salitas || p.salitas.length === 0) return true;
      return p.salitas.some((s) => s.id_salita === form.id_salita && s.activo);
    });
  }, [professionals, form.id_salita]);

  // Si cambia la salita y el profesional seleccionado no pertenece a ella, limpiar profesional y especialidad
  useEffect(() => {
    if (!form.id_salita || !form.id_profesional) return;
    const exists = availableProfessionals.some((p) => p.id_profesional === form.id_profesional);
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        id_profesional: null,
        id_especialidad: null,
      }));
    }
  }, [form.id_salita, form.id_profesional, availableProfessionals]);

  // Carga y vincula dinámicamente las especialidades del profesional seleccionado
  useEffect(() => {
    let active = true;
    setRelationsReady(false);
    setRelations({ clinics: [], specialties: [] });

    if (!form.id_profesional) {
      setRelationsReady(true);
      return;
    }

    void Promise.all([
      getProfessionalClinics(form.id_profesional),
      getProfessionalSpecialties(form.id_profesional),
    ])
      .then(([c, s]) => {
        if (!active) return;
        setRelations({ clinics: c.data, specialties: s.data });
        setRelationsReady(true);

        // Especialidades activas del profesional
        const activeSpecs = s.data.filter((sp) => sp.activo);
        // Si el profesional tiene una única especialidad asignada, seleccionarla automáticamente
        if (activeSpecs.length === 1) {
          setForm((prev) => ({
            ...prev,
            id_especialidad: activeSpecs[0].id_especialidad,
          }));
        } else if (activeSpecs.length === 0) {
          setForm((prev) => ({
            ...prev,
            id_especialidad: null,
          }));
        } else {
          // Si tiene múltiples y la actual no es válida, resetear a null
          setForm((prev) => {
            if (prev.id_especialidad && !activeSpecs.some((sp) => sp.id_especialidad === prev.id_especialidad)) {
              return { ...prev, id_especialidad: null };
            }
            return prev;
          });
        }
      })
      .catch((cause) => {
        if (active) setError(authError(cause));
      });

    return () => {
      active = false;
    };
  }, [form.id_profesional, revision]);

  // Especialidades activas asignadas al profesional seleccionado
  const availableSpecialties = useMemo(() => {
    if (!form.id_profesional) return [];
    return relations.specialties.filter((sp) => sp.activo);
  }, [form.id_profesional, relations.specialties]);

  const hasNoSpecialties = Boolean(
    form.id_profesional && relationsReady && availableSpecialties.length === 0
  );

  const change = (patch: Partial<BloqueoInput>) => {
    if ('id_profesional' in patch && patch.id_profesional !== form.id_profesional) {
      setRelationsReady(false);
      // Limpiar especialidad al cambiar de profesional si no viene en el patch
      if (!('id_especialidad' in patch)) {
        patch.id_especialidad = null;
      }
    }
    setForm((value) => ({ ...value, ...patch }));
  };

  const reset = () => {
    setEditing(undefined);
    setForm(empty(singleClinic || clinics.length === 1 ? clinics[0]?.id_salita ?? '' : ''));
  };

  const edit = (row: Bloqueo) => {
    setEditing(row.id_bloqueo);
    setError('');
    setSuccess('');
    change({
      id_salita: row.id_salita,
      id_profesional: row.id_profesional,
      id_especialidad: row.id_especialidad,
      fecha: row.fecha,
      dia_completo: row.dia_completo,
      hora_inicio: row.hora_inicio?.slice(0, 5) ?? null,
      hora_fin: row.hora_fin?.slice(0, 5) ?? null,
      motivo: row.motivo,
      activo: row.activo,
    });
  };

  const review = () => {
    if (impact || !ready || !relationsReady) return;
    setError('');
    setSuccess('');

    if (!form.id_salita) {
      setError('Debés seleccionar una salita.');
      return;
    }

    if (!form.fecha) {
      setError('Indicá la fecha de la ausencia.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!editing && form.fecha < today) {
      setError('La fecha de la ausencia no puede ser anterior al día de hoy.');
      return;
    }

    if (!form.motivo.trim() || form.motivo.trim().length < 3) {
      setError('El motivo interno de la ausencia es obligatorio (mínimo 3 caracteres).');
      return;
    }

    if (!form.dia_completo) {
      if (!form.hora_inicio || !form.hora_fin) {
        setError('Indicá la hora de inicio y la hora de fin para la ausencia parcial.');
        return;
      }
      if (form.hora_inicio >= form.hora_fin) {
        setError('La hora de inicio debe ser anterior a la hora de fin.');
        return;
      }
    }

    const current = (r: { activo: boolean; fecha_desde: string; fecha_hasta: string | null }) =>
      r.activo && r.fecha_desde <= form.fecha && (!r.fecha_hasta || r.fecha_hasta >= form.fecha);

    if (
      form.activo &&
      form.id_profesional &&
      (!relations.clinics.some((r) => r.id_salita === form.id_salita && current(r)) ||
        (form.id_especialidad &&
          !relations.specialties.some((r) => r.id_especialidad === form.id_especialidad && current(r))))
    ) {
      setError('El profesional no tiene asignadas esa salita y especialidad en la fecha seleccionada.');
      return;
    }

    const input: BloqueoInput = {
      ...form,
      motivo: form.motivo.trim(),
      hora_inicio: form.dia_completo ? null : form.hora_inicio,
      hora_fin: form.dia_completo ? null : form.hora_fin,
    };

    // Verificación de solapamiento con ausencias activas existentes
    const overlap = rows.some((r) => {
      if (r.id_bloqueo === editing || !r.activo || !input.activo) return false;
      if (r.id_salita !== input.id_salita) return false;
      if (r.fecha !== input.fecha) return false;

      // Profesional coincidente (o ausencia para todos los profesionales)
      const sameProf =
        !r.id_profesional || !input.id_profesional || r.id_profesional === input.id_profesional;
      if (!sameProf) return false;

      // Especialidad coincidente (o ausencia para todas las especialidades)
      const sameSpec =
        !r.id_especialidad || !input.id_especialidad || r.id_especialidad === input.id_especialidad;
      if (!sameSpec) return false;

      // Verificación de franja horaria
      if (r.dia_completo || input.dia_completo) return true;
      const rStart = r.hora_inicio?.slice(0, 5) ?? '00:00';
      const rEnd = r.hora_fin?.slice(0, 5) ?? '23:59';
      const inStart = input.hora_inicio ?? '00:00';
      const inEnd = input.hora_fin ?? '23:59';
      return rStart < inEnd && rEnd > inStart;
    });

    if (overlap) {
      setError('Ya existe un bloqueo o ausencia activa para este alcance en la misma fecha y franja horaria.');
      return;
    }

    setImpact({ tipo: 'bloqueo', ...(editing ? { id: editing } : {}), datos: input });
  };

  const saved = () => {
    setImpact(null);
    reset();
    setError('');
    setSuccess('La ausencia y los turnos afectados se gestionaron correctamente.');
    setRevision((v) => v + 1);
  };

  const professional = professionals.find((p) => p.id_profesional === form.id_profesional);
  const context = [
    clinics.find((c) => c.id_salita === form.id_salita)?.nombre,
    form.id_profesional
      ? professional
        ? `${professional.persona.apellidos}, ${professional.persona.nombres}`
        : 'Profesional no disponible'
      : 'Todos los profesionales',
    form.id_especialidad
      ? specialties.find((s) => s.id_especialidad === form.id_especialidad)?.nombre
      : 'Todas las especialidades',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    user,
    isSuperAdmin,
    singleClinic,
    assignedClinic,
    rows,
    clinics,
    professionals,
    availableProfessionals,
    specialties,
    availableSpecialties,
    hasNoSpecialties,
    form,
    editing,
    loading,
    ready,
    impact,
    error,
    success,
    relationsReady,
    context,
    change,
    reset,
    edit,
    review,
    saved,
    close: () => setImpact(null),
    reload: () => setRevision((v) => v + 1),
    setError,
    setSuccess,
  };
}
