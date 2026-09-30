import { 
  useEffect, 
  useState, 
  type FormEvent 
} from 'react';

import { 
  Navigate, 
  useNavigate 
} from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';

import {
   useAuth 
  } from '../../context/AuthContext';

import { 
  completePatientProfile 
} from '../../services/auth.service';

import { 
  getBarrios 
} from '../../services/barrios.service';

import { 
  getSalitas 
} from '../../services/salitas.service';

import type { 
  CompletePatientProfileInput 
} from '../../types/auth.types';

import type { Barrio } from '../../types/barrio.types';
import type { Salita } from '../../types/salita.types';
import { authError } from '../../utils/auth-errors';

export default function CompletePatientProfilePage() {
  const { patient, reloadProfile, user } = useAuth();
  const navigate = useNavigate();
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [salitas, setSalitas] = useState<Salita[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const [form, setForm] = useState<CompletePatientProfileInput>(
    { dni: '', 
      nombres: '', 
      apellidos: '', 
      fecha_nacimiento: '', 
      sexo: 'NO_INFORMA', 
      telefono: '', 
      direccion: '', 
      id_barrio: '', 
      id_salita_asignada: '' 
    }
  );
  const salitasDisponibles = salitas.filter(
    (salita) => salita.id_barrio === form.id_barrio,
  );

  useEffect(() => {
    let active = true;
    
    void Promise.all([getBarrios(), getSalitas()]).then(([b, s]) => {
      if (active) { setBarrios(b.data.barrios); setSalitas(s.data.filter(item => item.activo)); }
    }).catch(cause => { 
      if (active) setError(authError(cause)); 
    }).finally(() => { 
      if (active) setLoading(false); });
    return () => { active = false; };
  }, []
);

  if (patient) return <Navigate to="/mi-perfil" replace />;
  
  const submit = async (event?: FormEvent) => {
    event?.preventDefault(); if (busy) return;
    
    setBusy(true); setError('');
    
    try { 
      await completePatientProfile(form);
      await reloadProfile(); 
      navigate('/mi-perfil', 
        { replace: true }); 
      }
    catch (cause) { 
      setError(authError(cause)); 
    } finally { setBusy(false); }
  };

  const fields = [
    ['dni', 'DNI', 'text', true], ['nombres', 'Nombres', 'text', true], ['apellidos', 'Apellidos', 'text', true],
    ['fecha_nacimiento', 'Fecha de nacimiento', 'date', true], ['telefono', 'Teléfono', 'tel', false],
    ['direccion', 'Dirección', 'text', true], ['localidad', 'Localidad', 'text', false], ['provincia', 'Provincia', 'text', false],
    ['codigo_postal', 'Código postal', 'text', false], ['obra_social', 'Obra social', 'text', false],
    ['numero_afiliado', 'Número de afiliado', 'text', false], ['contacto_emergencia_nombre', 'Contacto de emergencia', 'text', false],
    ['contacto_emergencia_telefono', 'Teléfono de emergencia', 'tel', false],
  ] as const;

return (
  <div className="card shadow-sm">
    <ConfirmationModal
      open={confirmOpen}
      title="Guardar perfil"
      message="¿Querés completar tu perfil con estos datos?"
      detail={
        <>
          <div className="fw-semibold">{form.apellidos}, {form.nombres}</div>
          <div className="text-muted small mt-1">
            {barrios.find((barrio) => barrio.id_barrio === form.id_barrio)?.nombre || 'Barrio no seleccionado'}
          </div>
        </>
      }
      confirmText="Guardar perfil"
      variant="primary"
      icon="bi-person-check"
      loading={busy}
      onClose={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false);
        void submit();
      }}
    />

    <div className="card-body p-4">
      <h1 className="h3">Completar mi perfil</h1>

      <p>Tu cuenta: {user?.email}</p>

      <form onSubmit={(event) => {
        event.preventDefault();
        setConfirmOpen(true);
      }}>
        <fieldset disabled={busy || loading}>
          <div className="row">
            {fields.map(([key, label, type, required]) => (
              <div className="col-md-6 mb-3" key={key}>
                <label className="form-label w-100">
                  {label}

                  <input
                    className="form-control"
                    type={type}
                    required={required}
                    value={form[key] ?? ''}
                    pattern={key === 'dni' ? '[0-9]{7,15}' : undefined}
                    max={
                      type === 'date'
                        ? new Date().toLocaleDateString('en-CA')
                        : undefined
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ))}

            <label className="col-md-6 mb-3">
              Sexo
              <select
                className="form-select"
                value={form.sexo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sexo: e.target
                      .value as CompletePatientProfileInput['sexo'],
                  })
                }
              >
                <option value="NO_INFORMA">Prefiero no informar</option>
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
                <option value="X">X</option>
              </select>
            </label>

            <label className="col-md-6 mb-3">
              Barrio
              <select
                className="form-select"
                required
                value={form.id_barrio}
                onChange={(e) => setForm((current) => ({
                  ...current,
                  id_barrio: e.target.value,
                  id_salita_asignada: '',
                }))}
              >
                <option value="">Seleccioná un barrio</option>

                {barrios.map((b) => (
                  <option key={b.id_barrio} value={b.id_barrio}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-md-6 mb-3">
              Salita asignada
              <select
                className="form-select"
                required
                disabled={!form.id_barrio || salitasDisponibles.length === 0}
                value={form.id_salita_asignada}
                onChange={(e) =>
                  setForm({
                    ...form,
                    id_salita_asignada: e.target.value,
                  })
                }
              >
                <option value="">
                  {!form.id_barrio
                    ? 'Primero seleccioná un barrio'
                    : salitasDisponibles.length === 0
                      ? 'No hay salitas para este barrio'
                      : 'Seleccioná una salita'}
                </option>

                {salitasDisponibles.map((s) => (
                  <option key={s.id_salita} value={s.id_salita}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary">
            {loading
              ? 'Cargando…'
              : busy
                ? 'Guardando…'
                : 'Guardar perfil'}
          </button>
        </fieldset>
      </form>
    </div>
  </div>
);
}
