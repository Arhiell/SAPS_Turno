import { useMemo, useState } from 'react';
import ValidatedInput from '../ui/ValidatedInput';
import { agendaDate } from '../../utils/agenda-display';
import type useAbsenceForm from './useAbsenceForm';
import type { Bloqueo } from '../../types/configuracion.types';

export default function AbsenceList({
  state: s,
  onEdit,
}: {
  state: ReturnType<typeof useAbsenceForm>;
  onEdit: (row: Bloqueo) => void;
}) {
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => {
    return s.rows.filter((r) => {
      if (filterDate && r.fecha !== filterDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const p = s.professionals.find((prof) => prof.id_profesional === r.id_profesional);
        const profName = p ? `${p.persona.apellidos} ${p.persona.nombres}`.toLowerCase() : '';
        const salitaName = s.clinics.find((c) => c.id_salita === r.id_salita)?.nombre.toLowerCase() ?? '';
        const espName = s.specialties.find((e) => e.id_especialidad === r.id_especialidad)?.nombre.toLowerCase() ?? '';
        const motivo = r.motivo.toLowerCase();

        return (
          profName.includes(q) ||
          salitaName.includes(q) ||
          espName.includes(q) ||
          motivo.includes(q)
        );
      }
      return true;
    });
  }, [s.rows, filterDate, searchQuery, s.professionals, s.clinics, s.specialties]);

  return (
    <section className="dashboard-panel shadow-sm">
      <div className="p-4 border-bottom bg-light-subtle">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <h2 className="h5 mb-0 fw-bold">
              <i className="bi bi-calendar-check me-2 text-saps" />
              Ausencias y cierres programados
            </h2>
            <span className="badge text-bg-light border text-secondary">
              {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label
              className="form-label small fw-semibold text-secondary mb-1"
              htmlFor="filter-absence-date"
            >
              Filtrar por fecha
            </label>
            <ValidatedInput
              id="filter-absence-date"
              type="date"
              className="form-control"
              style={{ minHeight: '40px', height: '40px' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-5">
            <label
              className="form-label small fw-semibold text-secondary mb-1"
              htmlFor="filter-absence-search"
            >
              Buscar por profesional, motivo o salita
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                id="filter-absence-search"
                type="text"
                className="form-control"
                placeholder="Nombre, motivo o salita…"
                style={{ minHeight: '40px', height: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {(filterDate || searchQuery) && (
            <div className="col-12 col-md-3">
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-1 w-100 justify-content-center"
                style={{ minHeight: '40px', height: '40px' }}
                onClick={() => {
                  setFilterDate('');
                  setSearchQuery('');
                }}
              >
                <i className="bi bi-x-circle" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {s.loading ? (
        <div className="text-center py-5 text-muted" role="status">
          <div className="spinner-border text-saps mb-2" role="status" />
          <p className="mb-0">Cargando ausencias registradas…</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table saps-responsive-table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Fecha y franja</th>
                <th scope="col">Alcance institucional</th>
                <th scope="col">Motivo interno</th>
                <th scope="col">Estado</th>
                <th scope="col" className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = s.professionals.find((prof) => prof.id_profesional === r.id_profesional);
                const salita = s.clinics.find((c) => c.id_salita === r.id_salita);
                const esp = s.specialties.find((e) => e.id_especialidad === r.id_especialidad);

                return (
                  <tr key={r.id_bloqueo}>
                    <td data-label="Fecha y franja">
                      <span className="fw-semibold d-block text-dark">
                        {agendaDate(r.fecha)}
                      </span>
                      <span
                        className={`badge ${
                          r.dia_completo
                            ? 'text-bg-primary'
                            : 'text-bg-info text-dark'
                        }`}
                      >
                        {r.dia_completo
                          ? 'Día completo'
                          : `${r.hora_inicio?.slice(0, 5)} a ${r.hora_fin?.slice(0, 5)} hs`}
                      </span>
                    </td>

                    <td data-label="Alcance institucional">
                      <div className="fw-semibold small text-dark">
                        <i className="bi bi-hospital me-1 text-secondary" />
                        {salita?.nombre ?? 'Salita no disponible'}
                      </div>
                      <div className="text-secondary small">
                        <i className="bi bi-person me-1 text-secondary" />
                        {r.id_profesional
                          ? p
                            ? `${p.persona.apellidos}, ${p.persona.nombres}`
                            : 'Profesional no disponible'
                          : 'Todos los profesionales'}
                      </div>
                      <div className="text-muted small">
                        <i className="bi bi-tag me-1 text-secondary" />
                        {r.id_especialidad
                          ? esp?.nombre ?? 'Especialidad no disponible'
                          : 'Todas las especialidades'}
                      </div>
                    </td>

                    <td data-label="Motivo interno" className="text-break small">
                      {r.motivo}
                    </td>

                    <td data-label="Estado">
                      <span
                        className={`badge ${
                          r.activo ? 'text-bg-success' : 'text-bg-secondary'
                        }`}
                      >
                        {r.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td data-label="Acciones" className="text-end">
                      <button
                        className="btn btn-outline-saps btn-sm d-inline-flex align-items-center gap-1"
                        disabled={Boolean(s.impact)}
                        onClick={() => onEdit(r)}
                        title="Modificar ausencia o franja horaria"
                      >
                        <i className="bi bi-pencil-square" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!rows.length && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2 text-secondary" />
              <p className="mb-0 fw-medium">
                {filterDate || searchQuery
                  ? 'No se encontraron ausencias con los filtros aplicados.'
                  : 'No hay ausencias ni cierres registrados en el sistema.'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
