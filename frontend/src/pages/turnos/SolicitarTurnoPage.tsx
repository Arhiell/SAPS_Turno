import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSalitaById } from '../../services/salitas.service';
import type { Salita } from '../../types/salita.types';
import { authError } from '../../utils/auth-errors';

export default function SolicitarTurnoPage() {
  const { patient } = useAuth();
  const [clinic, setClinic] = useState<Salita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setClinic(null); setError(''); setLoading(true);
    if (!patient?.id_salita_asignada) { setLoading(false); return; }
    // Muestra el contacto real de la salita asignada, sin simular una reserva.
    void getSalitaById(patient.id_salita_asignada).then((response) => { if (active) setClinic(response.data); })
      .catch((cause) => { if (active) setError(authError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [patient?.id_salita_asignada, revision]);
  return <section className="dashboard-panel">
    <div className="dashboard-panel-header"><h1 className="h3 mb-0">Solicitar turno</h1></div>
    <div className="p-4">
      <p>Para solicitar un turno, contactá a tu salita o acercate a recepción.</p>
      <p className="text-muted">Tené a mano tu DNI e indicá la especialidad que necesitás. La solicitud en línea todavía no está disponible.</p>
      {loading && <p role="status">Cargando tu salita…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}<button className="btn btn-outline-danger ms-2" onClick={() => setRevision((v) => v + 1)}>Reintentar</button></div>}
      {clinic && <div className="turno-preview mb-4">
        <h2 className="h5"><i className="bi bi-hospital me-2 text-success" />{clinic.nombre}</h2>
        <p>{clinic.direccion}</p>
        {!clinic.activo && <p className="text-muted">Esta salita figura inactiva. Consultá con administración para actualizar tu asignación.</p>}
        {clinic.horario_apertura && clinic.horario_cierre && <p>Horario institucional: {clinic.horario_apertura.slice(0, 5)} a {clinic.horario_cierre.slice(0, 5)}</p>}
        <div className="d-flex flex-wrap gap-2">
          {clinic.telefono && <a className="btn btn-saps" href={`tel:${clinic.telefono.replace(/[^+\d]/g, '')}`}><i className="bi bi-telephone me-2" />{clinic.telefono}</a>}
          {clinic.email && <a className="btn btn-outline-success" href={`mailto:${clinic.email}`}><i className="bi bi-envelope me-2" />Enviar correo</a>}
        </div>
        {!clinic.telefono && !clinic.email && <p className="text-muted mb-0">No hay teléfono ni correo registrados. Acercate a recepción.</p>}
      </div>}
      {!loading && !error && !clinic && <p className="text-muted">No hay una salita asignada disponible en tu perfil. Consultá con administración.</p>}
      <Link className="btn btn-saps" to="/mis-turnos">Ver mis turnos</Link>
    </div>
  </section>;
}
