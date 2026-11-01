import { useEffect, useState } from 'react';
import { getTurnos } from '../../services/turnos.service';
import { authError } from '../../utils/auth-errors';

const dateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(date);

export default function ProfessionalCalendar({ revision, selected, onSelect }: {
  revision: number; selected: string; onSelect: (day: string) => void;
}) {
  const [month, setMonth] = useState(() => dateKey(new Date()).slice(0, 7));
  const [days, setDays] = useState<Record<string, Record<string, { name: string; count: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, number] = month.split('-').map(Number);
  const count = new Date(Date.UTC(year!, number!, 0)).getUTCDate();
  const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDays({});
    void (async () => {
      const result: typeof days = {};
      for (let page = 1; ; page++) {
        const response = await getTurnos({ fecha_desde: `${month}-01`,
          fecha_hasta: `${month}-${count}`, page, limit: 100 });
        if (!active) return;
        for (const turno of response.data.turnos) {
          const key = dateKey(new Date(turno.fecha_hora_inicio));
          const day = result[key] ??= {};
          const status = day[turno.estado.codigo] ??= { name: turno.estado.nombre, count: 0 };
          status.count++;
        }
        if (page >= response.data.pagination.totalPages) break;
      }
      if (active) setDays(result);
    })().catch(cause => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, count, revision]);

  const move = (delta: number) => {
    const date = new Date(Date.UTC(year!, number! - 1 + delta, 1, 12));
    setMonth(date.toISOString().slice(0, 7));
  };

  return <section className="professional-calendar my-3" aria-label="Calendario de actividad">
    <div className="professional-calendar__header">
      <h2 className="h6 mb-2">Días con actividad</h2>
      <div className="professional-calendar__navigation">
        <button type="button" className="btn btn-outline-secondary" onClick={() => move(-1)} aria-label="Mes anterior">‹</button>
        <label><span className="visually-hidden">Mes de actividad</span>
          <input type="month" className="form-control" value={month} onChange={event => {
            if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value);
          }} /></label>
        <button type="button" className="btn btn-outline-secondary" onClick={() => move(1)} aria-label="Mes siguiente">›</button>
      </div>
    </div>
    <p className="small text-muted my-2">En verde: días con turnos.</p>
    {loading && <p role="status">Cargando actividad del mes…</p>}
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    <div className="professional-calendar__grid" aria-busy={loading}>
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <strong key={day} className="text-center small">{day}</strong>)}
      {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
      {Array.from({ length: count }, (_, i) => {
        const key = `${month}-${String(i + 1).padStart(2, '0')}`;
        const states = Object.entries(days[key] ?? {});
        const summary = states.map(([, status]) => `${status.name}: ${status.count}`).join(', ');
        return <button key={key} type="button" disabled={loading || !!error}
          className={`professional-calendar__day${states.length ? ' has-activity' : ''}`}
          aria-pressed={selected === key} aria-label={`${key}: ${summary || 'Sin turnos'}`}
          title={`${key}: ${summary || 'Sin turnos'}`}
          aria-current={key === dateKey(new Date()) ? 'date' : undefined}
          onClick={() => onSelect(key)}>
          <strong>{i + 1}</strong>
        </button>;
      })}
    </div>
  </section>;
}
