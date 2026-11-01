import { useEffect, useState } from 'react';
import api from '../../services/api';
import { authError } from '../../utils/auth-errors';

type Tutor = { id_tutor: string; nombres: string; apellidos: string; dni: string;
  parentesco: string; puede_gestionar_turnos: boolean; fecha_desde: string; fecha_hasta: string | null;
  identidad_verificada: boolean; documentacion_verificada: boolean; autorizacion_verificada: boolean;
  fecha_modificacion: string | null; modificado_por: { nombre_usuario: string } | null;
  historial: { id_historial: number; accion: 'INSERT' | 'UPDATE' | 'DELETE'; fecha: string;
    actor: { nombre_usuario: string; persona: { nombres: string; apellidos: string } | null } | null }[] };

const authorizationStatus = (tutor: Tutor) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  if (!tutor.puede_gestionar_turnos) return 'Autorización revocada';
  if (tutor.fecha_desde > today) return 'Autorización aún no vigente';
  if (tutor.fecha_hasta && tutor.fecha_hasta < today) return 'Autorización vencida';
  return 'Gestión de turnos autorizada';
};

export default function PatientTutorsPanel({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<Tutor[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedPatientId, setLoadedPatientId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const url = `/patients/${patientId}/tutors`;
  const isLoading = loading || loadedPatientId !== patientId;

  useEffect(() => {
    let active = true;
    void api.get<{ data: { tutors: Tutor[] } }>(url)
      .then(response => {
        if (active) {
          setItems(response.data.data.tutors);
          setError('');
        }
      })
      .catch(cause => {
        if (active) {
          setItems([]);
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoadedPatientId(patientId);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [url, patientId, revision]);

  const revoke = async (tutor: Tutor) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.patch(`${url}/${tutor.id_tutor}/end`, {});
      setSuccess('La autorización se revocó correctamente.');
      setLoading(true);
      setRevision(value => value + 1);
    } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); }
  };

  return <section className="card border-0 shadow-sm mb-4">
    <div className="card-header bg-white py-3"><h3 className="h5 mb-0">Tutores y responsables</h3></div>
    <div className="card-body">
      <p className="text-muted">Consultá las autorizaciones de este paciente y revocá las que ya no correspondan.</p>
      <div className="alert alert-info">
        El paciente a cargo puede ser menor o adulto y no necesita correo ni cuenta propia.
        Las altas y renovaciones se tramitan mediante una solicitud iniciada desde una cuenta de paciente y aprobada por la salita tras verificar presencialmente la identidad, documentación y autorización.
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      {isLoading ? <p>Cargando responsables…</p> : items.length === 0 ? <p>No hay responsables registrados.</p> :
        <ul className="list-group mb-3">{items.map(tutor => <li key={tutor.id_tutor} className="list-group-item d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div><strong>{tutor.apellidos}, {tutor.nombres}</strong><div className="small">DNI {tutor.dni} · {tutor.parentesco}</div>
            <div className="small">{authorizationStatus(tutor)}
              {tutor.fecha_hasta ? ` · Hasta ${tutor.fecha_hasta.split('-').reverse().join('/')}` : ''}
            </div>
            <div className="small text-muted">Verificación presencial:
              {` identidad ${tutor.identidad_verificada ? 'sí' : 'no registrada'}`}
              {`, documentación ${tutor.documentacion_verificada ? 'sí' : 'no registrada'}`}
              {`, autorización ${tutor.autorizacion_verificada ? 'sí' : 'no registrada'}`}
            </div>
            {tutor.fecha_modificacion && <div className="small text-muted">
              Última modificación: {new Date(tutor.fecha_modificacion).toLocaleString('es-AR')}
              {tutor.modificado_por?.nombre_usuario ? ` · ${tutor.modificado_por.nombre_usuario}` : ''}
            </div>}</div>
          {!!tutor.historial.length && <details className="w-100">
            <summary className="small">Ver historial de cambios</summary>
            <ul className="small mb-0 mt-2">{tutor.historial.map(entry => <li key={entry.id_historial}>
              {new Date(entry.fecha).toLocaleString('es-AR')} · {entry.accion === 'INSERT' ? 'Vínculo registrado' : entry.accion === 'DELETE' ? 'Vínculo eliminado' : 'Vínculo actualizado'}
              {entry.actor ? ` por ${entry.actor.persona ? `${entry.actor.persona.apellidos}, ${entry.actor.persona.nombres}` : entry.actor.nombre_usuario}` : ' · actor previo no registrado'}
            </li>)}</ul>
          </details>}
          {authorizationStatus(tutor) === 'Gestión de turnos autorizada' &&
            <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
              onClick={() => { if (window.confirm(`¿Revocar la autorización de ${tutor.nombres} ${tutor.apellidos}? No podrá realizar nuevas gestiones.`)) void revoke(tutor); }}>
              Revocar autorización</button>}
        </li>)}</ul>}
    </div>
  </section>;
}
