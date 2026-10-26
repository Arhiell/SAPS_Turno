import { useEffect, useState } from 'react';
import api from '../../services/api';
import { authError } from '../../utils/auth-errors';
import ValidatedInput from './ValidatedInput';

type Tutor = { id_tutor: string; nombres: string; apellidos: string; dni: string;
  parentesco: string; puede_gestionar_turnos: boolean; fecha_hasta: string | null };

export default function PatientTutorsPanel({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<Tutor[]>([]);
  const [dni, setDni] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const url = `/patients/${patientId}/tutors`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);
    void api.get<{ data: { tutors: Tutor[] } }>(url)
      .then(response => { if (active) setItems(response.data.data.tutors); })
      .catch(cause => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url, revision]);

  const save = async (tutor?: Tutor) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      if (tutor) {
        await api.patch(`${url}/${tutor.id_tutor}`, { puede_gestionar_turnos: !tutor.puede_gestionar_turnos });
      } else {
        await api.post(`${url}/by-dni`, { dni, parentesco, puede_gestionar_turnos: true });
        setDni(''); setParentesco(''); setAuthorized(false);
      }
      setSuccess('La autorización se actualizó correctamente.');
      setRevision(value => value + 1);
    } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); }
  };

  return <section className="card border-0 shadow-sm mb-4">
    <div className="card-header bg-white py-3"><h3 className="h5 mb-0">Tutores y responsables</h3></div>
    <div className="card-body">
      <p className="text-muted">Autorizá a una persona registrada para solicitar, consultar y cancelar los turnos de este paciente desde su propia cuenta. Verificá el vínculo y la autorización antes de registrarlos.</p>
      <div className="alert alert-info">
        El paciente a cargo puede ser menor o adulto y no necesita correo ni cuenta propia.
        La verificación del vínculo la realiza el personal de la salita; no se envía un código al paciente.
        Para cambiar de responsable, registrá al nuevo y retirale el permiso al anterior.
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      {loading ? <p>Cargando responsables…</p> : items.length === 0 ? <p>No hay responsables vigentes.</p> :
        <ul className="list-group mb-3">{items.map(tutor => <li key={tutor.id_tutor} className="list-group-item d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div><strong>{tutor.apellidos}, {tutor.nombres}</strong><div className="small">DNI {tutor.dni} · {tutor.parentesco}</div>
            <div className="small">{tutor.puede_gestionar_turnos ? 'Gestión de turnos autorizada' : 'Sin permiso para gestionar turnos'}</div></div>
          <button type="button" className={`btn btn-sm ${tutor.puede_gestionar_turnos ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={busy}
            onClick={() => { if (window.confirm(`${tutor.puede_gestionar_turnos ? '¿Retirar' : '¿Autorizar'} el acceso a los turnos de este paciente para ${tutor.nombres} ${tutor.apellidos}?`)) void save(tutor); }}>
            {tutor.puede_gestionar_turnos ? 'Retirar permiso' : 'Autorizar gestión'}</button>
        </li>)}</ul>}
      <form onSubmit={event => { event.preventDefault(); if (authorized) void save(); }}>
        <fieldset disabled={busy || loading}>
          <div className="row g-3">
            <div className="col-12 col-md-5"><label className="form-label" htmlFor="tutor-dni">DNI del responsable</label>
              <ValidatedInput id="tutor-dni" field="dni" className="form-control" inputMode="numeric" required value={dni} onChange={event => setDni(event.target.value)} /></div>
            <div className="col-12 col-md-7"><label className="form-label" htmlFor="tutor-parentesco">Vínculo del responsable con el paciente</label>
              <input id="tutor-parentesco" className="form-control" placeholder="Madre, padre, hijo/a, cuidador/a…" required maxLength={50} value={parentesco} onChange={event => setParentesco(event.target.value)} /></div>
          </div>
          <div className="form-check my-3"><input id="tutor-authorized" className="form-check-input" type="checkbox" required checked={authorized} onChange={event => setAuthorized(event.target.checked)} />
            <label htmlFor="tutor-authorized" className="form-check-label">Verifiqué el vínculo y la autorización para gestionar turnos.</label></div>
          <button className="btn btn-saps" type="submit" disabled={!authorized}>Registrar responsable</button>
          <p className="small text-muted mt-2 mb-0">Si el responsable aún no está registrado, creá primero su ficha en Pacientes. Para ingresar necesita una cuenta de paciente activa.</p>
        </fieldset>
      </form>
    </div>
  </section>;
}
