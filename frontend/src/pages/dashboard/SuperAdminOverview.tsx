import { useEffect, useState } from 'react';
import { getDashboardSummary, type DashboardSummary } from '../../services/dashboard.service';
import { authError } from '../../utils/auth-errors';

const timeZone = 'America/Argentina/Buenos_Aires';
const formatDateTime = (value: string) => new Date(value).toLocaleString('es-AR', { timeZone });
const actions: Record<string, string> = { INSERT: 'Alta', UPDATE: 'Modificación', DELETE: 'Baja' };
const entities: Record<string, string> = {
  personas: 'personas', usuarios: 'cuentas', salitas: 'salitas', pacientes: 'pacientes',
  profesionales: 'profesionales', turnos: 'turnos', horarios_atencion: 'horarios',
  bloqueos_agenda: 'bloqueos de agenda', sanciones: 'sanciones', tutores: 'tutores',
  paciente_tutores: 'vínculos de tutores',
};

export default function SuperAdminOverview({ revision, onRefresh }: { revision: number; onRefresh: () => void }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void getDashboardSummary().then(result => {
      if (active) setData(result);
    }).catch(cause => {
      if (active) setError(authError(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [revision]);

  const available = !loading && !error && data;
  const totals = [
    { label: 'Salitas', value: data?.salitas, icon: 'bi-hospital' },
    { label: 'Administradores de salita', value: data?.administradores, icon: 'bi-person-gear' },
    { label: 'Superadministradores', value: data?.superadministradores, icon: 'bi-shield-check' },
    { label: 'Profesionales', value: data?.profesionales, icon: 'bi-person-badge' },
    { label: 'Pacientes', value: data?.pacientes, icon: 'bi-people' },
  ];
  const states = data?.turnos.por_estado;
  const daily = [
    { label: 'Turnos registrados hoy', value: data?.turnos.registrados_hoy, description: 'Reservas creadas hoy, para cualquier fecha', icon: 'bi-calendar-plus' },
    { label: 'Turnos programados para hoy', value: data?.turnos.programados_hoy, description: 'Citas con fecha de atención de hoy', icon: 'bi-calendar-check' },
    { label: 'Pendientes de atención', value: data?.turnos.pendientes, description: available ? `${states?.SOLICITADO} solicitados · ${states?.CONFIRMADO} confirmados · ${states?.EN_ESPERA} en espera` : '', icon: 'bi-clock' },
    { label: 'Atendidos hoy', value: states?.ATENDIDO, description: 'Citas programadas para hoy', icon: 'bi-check2-circle' },
    { label: 'Cancelados', value: states?.CANCELADO, description: 'Citas programadas para hoy', icon: 'bi-calendar-x' },
    { label: 'Inasistencias hoy', value: states?.NO_ASISTIO, description: 'Citas programadas para hoy', icon: 'bi-person-x' },
    { label: 'Reprogramados', value: states?.REPROGRAMADO, description: 'Citas originales programadas para hoy', icon: 'bi-arrow-repeat' },
  ];

  return (
    <div className="mb-4" aria-busy={loading}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="h5 mb-1">Estado general del sistema</h2>
          <small className="text-muted">
            {loading ? 'Cargando indicadores…' : error ? 'Indicadores no disponibles' : data ? `Última actualización: ${formatDateTime(data.actualizado_en)} · Hora de Argentina` : ''}
          </small>
        </div>
        <button className="btn btn-outline-success" disabled={loading} onClick={onRefresh}>
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />Actualizar
        </button>
      </div>
      {loading && <p role="status">Cargando resumen del sistema…</p>}
      {error && <div className="alert alert-danger" role="alert">No se pudo cargar el resumen. {error} Usá Actualizar para reintentar.</div>}
      <div className="row g-3 mb-4">
        {totals.map(item => (
          <div className="col-12 col-sm-6 col-xl-4" key={item.label}>
            <div className="dashboard-stat-card h-100">
              <div className="dashboard-stat-top">
                <i className={`dashboard-stat-icon bi ${item.icon}`} aria-hidden="true" />
                <span className="dashboard-stat-label">{item.label}</span>
              </div>
              <div className="dashboard-stat-value">{available ? item.value?.total : '—'}</div>
              <small>{available ? `${item.value?.activos} activos · ${item.value?.inactivos} inactivos` : loading ? 'Cargando' : 'No disponible'}</small>
            </div>
          </div>
        ))}
      </div>
      <h2 className="h5 mb-3">Turnos del día{available ? ` · ${data.fecha.split('-').reverse().join('/')}` : ''}</h2>
      <div className="row g-3 mb-4">
        {daily.map(item => (
          <div className="col-12 col-sm-6 col-xl-3" key={item.label}>
            <div className="dashboard-stat-card h-100">
              <div className="dashboard-stat-top">
                <i className={`dashboard-stat-icon bi ${item.icon}`} aria-hidden="true" />
                <span className="dashboard-stat-label">{item.label}</span>
              </div>
              <div className="dashboard-stat-value">{available ? item.value : '—'}</div>
              <small>{available ? item.description : loading ? 'Cargando' : 'No disponible'}</small>
            </div>
          </div>
        ))}
      </div>
      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2>Actividad reciente</h2></div>
        {available && (data.actividad.disponible ? (
          data.actividad.data.length ? <ul className="list-group list-group-flush">
            {data.actividad.data.map(item => <li className="list-group-item d-flex flex-wrap justify-content-between gap-2" key={item.id_auditoria}>
              <span>{actions[item.accion] ?? item.accion} en {entities[item.entidad] ?? item.entidad}</span>
              <small className="text-muted">{formatDateTime(item.fecha)}</small>
            </li>)}
          </ul> : <p className="p-3 mb-0">No hay actividad registrada.</p>
        ) : <p className="p-3 mb-0 text-danger" role="alert">No se pudo consultar la actividad reciente. Usá Actualizar para reintentar.</p>)}
        {!available && <p className="p-3 mb-0">{loading ? 'Cargando actividad reciente…' : 'Actividad no disponible.'}</p>}
      </section>
    </div>
  );
}
