import { useState } from 'react';
import ValidatedInput from '../ui/ValidatedInput';
import { agendaDate } from '../../utils/agenda-display';
import type useAbsenceForm from './useAbsenceForm';
import type { Bloqueo } from '../../types/configuracion.types';

export default function AbsenceList({ state: s, onEdit }: { state: ReturnType<typeof useAbsenceForm>; onEdit: (row: Bloqueo) => void }) {
  const [filter, setFilter] = useState('');
  const rows = s.rows.filter(r => !filter || r.fecha === filter);
  return <section className="dashboard-panel">
    <div className="p-3">
      <h2 className="h5">Ausencias y cierres registrados</h2>
      <label className="form-label w-100">Filtrar fecha
        <ValidatedInput type="date" className="form-control" value={filter} onChange={e => setFilter(e.target.value)} />
      </label>
      <button className="btn btn-outline-secondary" onClick={() => setFilter('')}>Todas las fechas</button>
    </div>
    {s.loading ? <p className="p-3" role="status">Cargando ausencias…</p> : <div className="table-responsive">
      <table className="table saps-responsive-table">
        <thead><tr>{['Fecha y franja', 'Alcance', 'Motivo', 'Estado', 'Acciones'].map(t => <th scope="col" key={t}>{t}</th>)}</tr></thead>
        <tbody>{rows.map(r => {
          const p = s.professionals.find(p => p.id_profesional === r.id_profesional);
          return <tr key={r.id_bloqueo}>
            <td data-label="Fecha y franja">{agendaDate(r.fecha)}<br />{r.dia_completo ? 'Día completo' : `${r.hora_inicio?.slice(0, 5)}–${r.hora_fin?.slice(0, 5)}`}</td>
            <td data-label="Alcance">{s.clinics.find(c => c.id_salita === r.id_salita)?.nombre ?? 'Salita no disponible'}<br />
              {r.id_profesional ? p ? `${p.persona.apellidos}, ${p.persona.nombres}` : 'Profesional no disponible' : 'Todos los profesionales'}<br />
              {r.id_especialidad ? s.specialties.find(e => e.id_especialidad === r.id_especialidad)?.nombre ?? 'Especialidad no disponible' : 'Todas las especialidades'}
            </td>
            <td data-label="Motivo" className="text-break">{r.motivo}</td>
            <td data-label="Estado"><span className={`badge ${r.activo ? 'text-bg-success' : 'text-bg-secondary'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td data-label="Acciones"><button className="btn btn-outline-success" disabled={Boolean(s.impact)} onClick={() => onEdit(r)}>Editar / desactivar</button></td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="p-3 text-muted">No hay ausencias registradas para este filtro.</p>}
    </div>}
  </section>;
}
