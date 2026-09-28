import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMenuForRole } from '../../components/layout/sidebar-menu';
import TurnoCard from '../../components/ui/TurnoCard';
import { getTurnos } from '../../services/turnos.service';
import { getPatients } from '../../services/patients.service';
import { getProfessionals } from '../../services/profesionales.service';
import { getSalitas } from '../../services/salitas.service';
import type { Turno } from '../../types/turno.types';
import { authError } from '../../utils/auth-errors';

export default function Dashboard() {
  const { user } = useAuth();
  const patient = user?.rol === 'PACIENTE';
  const professional = user?.rol === 'PROFESIONAL';
  const global = user?.rol === 'SUPER_ADMIN';
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [totals, setTotals] = useState<{ label: string; value: number | null; icon: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setTurnos([]); setTotals([]);
    // Recorre la paginación para no confundir una página con el total del día.
    const load = async () => {
      const result: Turno[] = [];
      let page = 1;
      let pages = 1;
      do {
        const response = await getTurnos({ ...(patient ? {} : { fecha }), page, limit: 100 });
        if (!active) return;
        result.push(...response.data.turnos);
        pages = response.data.pagination.totalPages;
        page += 1;
      } while (page <= pages);
      if (active) setTurnos(result);
    };
    void load().catch((cause) => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    // Los totales globales no se muestran en la gestión de una salita.
    if (global) void Promise.allSettled([getPatients(1, 1), getProfessionals(), getSalitas()]).then(([p, pr, s]) => {
      if (active) setTotals([
        { label: 'Pacientes registrados', value: p.status === 'fulfilled' ? p.value.data.pagination.total : null, icon: 'bi-people' },
        { label: 'Profesionales activos', value: pr.status === 'fulfilled' ? pr.value.data.filter((item) => item.activo).length : null, icon: 'bi-person-badge' },
        { label: 'Salitas activas', value: s.status === 'fulfilled' ? s.value.data.filter((item) => item.activo).length : null, icon: 'bi-hospital' },
      ]);
    });
    return () => { active = false; };
  }, [user?.id_usuario, patient, global, fecha, revision]);

  const upcoming = turnos.filter((t) => !t.estado.es_estado_final && new Date(t.fecha_hora_inicio).getTime() >= Date.now())
    .sort((a, b) => Date.parse(a.fecha_hora_inicio) - Date.parse(b.fecha_hora_inicio));
  const stats = [
    { label: 'Turnos de hoy', value: turnos.length, icon: 'bi-calendar-check' },
    { label: 'Atendidos hoy', value: turnos.filter((t) => t.estado.codigo === 'ATENDIDO').length, icon: 'bi-check2-circle' },
    { label: 'Inasistencias hoy', value: turnos.filter((t) => t.estado.codigo === 'NO_ASISTIO').length, icon: 'bi-person-x' },
    { label: 'En espera', value: turnos.filter((t) => t.estado.codigo === 'EN_ESPERA').length, icon: 'bi-clock' },
  ];
  if (professional) stats[0] = {
    label: 'Pacientes del día', value: new Set(turnos.map((t) => t.id_paciente)).size, icon: 'bi-people',
  };
  const links = getMenuForRole(user?.rol).filter((item) => item.path !== '/');
  return <div>
    <div className="dashboard-header">
      <p className="text-capitalize mb-2">{new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <h1>¡Hola, {user?.nombre_usuario}!</h1>
      <p>{patient ? 'Tus turnos y tu próxima visita, en un solo lugar.' : professional ? 'Tu agenda y la atención de hoy.' : global ? 'Resumen de la actividad del sistema.' : 'Resumen de la actividad de tu salita.'}</p>
    </div>
    {error && <div className="alert alert-danger" role="alert">{error} <button className="btn btn-outline-danger" onClick={() => setRevision((v) => v + 1)}>Reintentar</button></div>}
    {loading && <p role="status">Cargando actividad…</p>}
    {!patient && <div className="row g-3 mb-4">
      {stats.map((stat) => <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
        <div className="dashboard-stat-card"><div className="dashboard-stat-top"><i className={`dashboard-stat-icon bi ${stat.icon}`} aria-hidden="true" /><span className="dashboard-stat-label">{stat.label}</span></div>
          <div className="dashboard-stat-value">{loading || error ? '—' : stat.value}</div><small>{loading ? 'Cargando' : error ? 'No disponible' : 'Actividad del día'}</small>
        </div>
      </div>)}
      {totals.map((stat) => <div className="col-12 col-sm-6 col-xl-4" key={stat.label}><div className="dashboard-stat-card">
        <div className="dashboard-stat-top"><i className={`dashboard-stat-icon bi ${stat.icon}`} aria-hidden="true" /><span className="dashboard-stat-label">{stat.label}</span></div>
        <div className="dashboard-stat-value">{stat.value ?? '—'}</div><small>{stat.value === null ? 'No disponible' : 'Total del sistema'}</small>
      </div></div>)}
    </div>}
    <div className="row g-4">
      <div className="col-xl-8"><section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2>{patient ? 'Próximo turno' : 'Próximos turnos de hoy'}</h2>
          <Link className="btn btn-outline-success" to={patient ? '/mis-turnos' : professional ? '/mi-agenda' : '/turnos'}>Ver {professional ? 'mi agenda' : 'turnos'}</Link>
        </div>
        {!loading && !error && (upcoming.length ? <div className="p-3 d-grid gap-3">{upcoming.slice(0, patient ? 1 : 4).map((t) => <TurnoCard key={t.id_turno} turno={t} patient={patient} />)}</div> :
          <div className="dashboard-empty"><i className="bi bi-calendar2-check dashboard-empty-icon" aria-hidden="true" /><h3>{patient ? 'No tenés próximos turnos' : 'No hay próximos turnos para hoy'}</h3><p>Podés consultar el listado completo desde tus turnos.</p></div>)}
        {patient && <div className="p-3"><Link className="btn btn-saps" to="/solicitar-turno"><i className="bi bi-calendar-plus me-2" aria-hidden="true" />Solicitar turno</Link></div>}
      </section></div>
      <div className="col-xl-4"><section className="dashboard-panel"><div className="dashboard-panel-header"><h2>Accesos rápidos</h2></div>
        <div className="dashboard-actions">{links.map((item) => <Link className="dashboard-action text-decoration-none" key={item.path} to={item.path}><span className="dashboard-action-icon"><i className={`bi ${item.icon}`} aria-hidden="true" /></span><span className="dashboard-action-content"><strong>{item.label}</strong></span><i className="bi bi-chevron-right" aria-hidden="true" /></Link>)}</div>
      </section></div>
    </div>
  </div>;
}
