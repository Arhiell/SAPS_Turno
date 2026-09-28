import { Link } from 'react-router-dom';

export default function SolicitarTurnoPage() {
  return <section className="dashboard-panel">
    <div className="dashboard-panel-header"><h1 className="h3 mb-0">Solicitar turno</h1></div>
    <div className="p-4">
      <p>Para solicitar un turno, contactá a tu salita o acercate a recepción.</p>
      <p className="text-muted">Tené a mano tu DNI e indicá la especialidad que necesitás. La solicitud en línea todavía no está disponible.</p>
      <Link className="btn btn-saps" to="/mis-turnos">Ver mis turnos</Link>
    </div>
  </section>;
}
