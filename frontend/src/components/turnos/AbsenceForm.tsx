import type { RefObject } from 'react';
import ValidatedInput from '../ui/ValidatedInput';
import AbsenceSchedule from './AbsenceSchedule';
import type useAbsenceForm from './useAbsenceForm';

export default function AbsenceForm({
  state: s,
  formRef,
}: {
  state: ReturnType<typeof useAbsenceForm>;
  formRef: RefObject<HTMLFormElement | null>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isParcial = !s.form.dia_completo;
  const invalidTimeRange =
    isParcial && Boolean(s.form.hora_inicio && s.form.hora_fin && s.form.hora_inicio >= s.form.hora_fin);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        s.review();
      }}
      className="dashboard-panel p-4 mb-4 configuration-form"
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">
          <i className="bi bi-calendar2-x me-2 text-saps" />
          {s.editing ? 'Editar ausencia o bloqueo de agenda' : 'Registrar ausencia de profesional o cierre puntual'}
        </h2>
        {s.editing && (
          <span className="badge text-bg-warning">
            Modo de edición activo
          </span>
        )}
      </div>

      <fieldset disabled={s.loading || !s.ready || Boolean(s.impact)}>
        {/* BLOQUE 1: Alcance de la ausencia */}
        <div className="card mb-3 border-light bg-light-subtle">
          <div className="card-body">
            <h3 className="h6 text-secondary mb-3">
              <i className="bi bi-geo-alt me-1" /> 1. Alcance: Salita, Profesional y Especialidad
            </h3>
            <div className="row g-3">
              {/* Salita */}
              <div className="col-md-4">
                {s.singleClinic && s.assignedClinic ? (
                  <div>
                    <label className="form-label text-muted small fw-semibold mb-1">
                      Salita asignada
                    </label>
                    <div className="p-2 border rounded bg-white d-flex align-items-center gap-2" style={{ minHeight: '42px' }}>
                      <i className="bi bi-hospital text-saps fs-5" />
                      <div className="text-truncate">
                        <strong className="d-block text-truncate">{s.assignedClinic.nombre}</strong>
                        {s.assignedClinic.direccion && (
                          <span className="text-muted small d-block text-truncate">
                            {s.assignedClinic.direccion}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="form-text small text-muted">
                      Asignada a tu perfil de usuario.
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="form-label fw-semibold" htmlFor="absence-salita">
                      Salita <span className="text-danger">*</span>
                    </label>
                    <select
                      id="absence-salita"
                      required
                      className="form-select"
                      style={{ minHeight: '42px' }}
                      value={s.form.id_salita}
                      onChange={(e) => s.change({ id_salita: e.target.value })}
                    >
                      <option value="">Seleccionar salita…</option>
                      {s.clinics.map((c) => (
                        <option key={c.id_salita} value={c.id_salita}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Profesional */}
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="absence-profesional">
                  Profesional
                </label>
                <select
                  id="absence-profesional"
                  className="form-select"
                  style={{ minHeight: '42px' }}
                  value={s.form.id_profesional ?? ''}
                  onChange={(e) => s.change({ id_profesional: e.target.value || null })}
                  disabled={!s.form.id_salita}
                >
                  <option value="">Todos los profesionales de la salita</option>
                  {s.availableProfessionals.map((p) => (
                    <option key={p.id_profesional} value={p.id_profesional}>
                      {p.persona.apellidos}, {p.persona.nombres}
                      {p.matricula ? ` (Mat. ${p.matricula})` : ''}
                    </option>
                  ))}
                </select>
                <span className="form-text small text-muted">
                  {s.form.id_salita
                    ? 'Seleccioná un profesional o dejá todos para un cierre general.'
                    : 'Primero indicá la salita para ver sus profesionales.'}
                </span>
              </div>

              {/* Especialidad vinculada dinámicamente */}
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="absence-especialidad">
                  Especialidad
                </label>
                {!s.form.id_profesional ? (
                  <div>
                    <select
                      id="absence-especialidad"
                      className="form-select text-muted"
                      style={{ minHeight: '42px' }}
                      disabled
                      value=""
                    >
                      <option value="">Aplica a todas las especialidades</option>
                    </select>
                    <span className="form-text small text-muted">
                      Seleccioná un profesional para acotar a una especialidad puntual.
                    </span>
                  </div>
                ) : s.hasNoSpecialties ? (
                  <div>
                    <div className="alert alert-warning py-1 px-2 mb-1 small d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-triangle-fill" />
                      <span>Sin especialidades asignadas activas.</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <select
                      id="absence-especialidad"
                      className="form-select"
                      style={{ minHeight: '42px' }}
                      value={s.form.id_especialidad ?? ''}
                      onChange={(e) => s.change({ id_especialidad: e.target.value || null })}
                      disabled={!s.relationsReady}
                    >
                      {s.availableSpecialties.length > 1 && (
                        <option value="">Todas las especialidades asignadas</option>
                      )}
                      {s.availableSpecialties.map((sp) => (
                        <option key={sp.id_especialidad} value={sp.id_especialidad}>
                          {sp.especialidad.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="form-text small text-muted">
                      {s.availableSpecialties.length === 1
                        ? 'Especialidad única vinculada automáticamente.'
                        : 'Especialidades activas asignadas al profesional.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Horarios habituales y Selección de fecha */}
        {s.form.id_salita && (
          <div className="mb-3">
            <AbsenceSchedule form={s.form} onDate={(fecha) => s.change({ fecha })} />
          </div>
        )}

        {/* BLOQUE 3: Fecha y Tipo de ausencia */}
        <div className="card mb-3 border-light bg-light-subtle">
          <div className="card-body">
            <h3 className="h6 text-secondary mb-3">
              <i className="bi bi-clock-history me-1" /> 2. Fecha y franja horaria de la ausencia
            </h3>
            <div className="row g-3 align-items-start">
              {/* Fecha */}
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="absence-fecha">
                  Fecha de la ausencia <span className="text-danger">*</span>
                </label>
                <ValidatedInput
                  id="absence-fecha"
                  field="fecha"
                  type="date"
                  required
                  min={today}
                  className="form-control"
                  style={{ minHeight: '42px' }}
                  value={s.form.fecha}
                  onChange={(e) => s.change({ fecha: e.target.value })}
                />
              </div>

              {/* Tipo de ausencia (Día completo vs Parcial) */}
              <div className="col-md-8">
                <label className="form-label fw-semibold d-block">
                  Tipo de ausencia <span className="text-danger">*</span>
                </label>
                <div className="d-flex flex-wrap gap-4 align-items-center pt-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipo-ausencia"
                      id="tipo-dia-completo"
                      checked={s.form.dia_completo}
                      onChange={() =>
                        s.change({ dia_completo: true, hora_inicio: null, hora_fin: null })
                      }
                    />
                    <label className="form-check-label fw-medium" htmlFor="tipo-dia-completo">
                      Día completo (no atenderá durante toda la jornada)
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipo-ausencia"
                      id="tipo-parcial"
                      checked={!s.form.dia_completo}
                      onChange={() =>
                        s.change({ dia_completo: false, hora_inicio: '08:00', hora_fin: '12:00' })
                      }
                    />
                    <label className="form-check-label fw-medium" htmlFor="tipo-parcial">
                      Franja horaria específica (ausencia parcial)
                    </label>
                  </div>
                </div>
              </div>

              {/* Franja horaria para ausencia parcial */}
              {isParcial && (
                <div className="col-12 mt-2">
                  <div className="p-3 border rounded bg-white">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="absence-hora-inicio">
                          No atenderá desde <span className="text-danger">*</span>
                        </label>
                        <ValidatedInput
                          id="absence-hora-inicio"
                          field="hora_inicio"
                          type="time"
                          required
                          className="form-control"
                          value={s.form.hora_inicio ?? ''}
                          onChange={(e) => s.change({ hora_inicio: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="absence-hora-fin">
                          Reanuda la atención a las <span className="text-danger">*</span>
                        </label>
                        <ValidatedInput
                          id="absence-hora-fin"
                          field="hora_fin"
                          type="time"
                          required
                          className="form-control"
                          value={s.form.hora_fin ?? ''}
                          onChange={(e) => s.change({ hora_fin: e.target.value })}
                        />
                      </div>
                    </div>
                    {invalidTimeRange && (
                      <p className="text-danger small mt-2 mb-0" role="alert">
                        <i className="bi bi-exclamation-circle me-1" />
                        La hora de inicio debe ser estrictamente anterior a la hora de finalización.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOQUE 4: Motivo y Bloqueo */}
        <div className="card mb-3 border-light bg-light-subtle">
          <div className="card-body">
            <h3 className="h6 text-secondary mb-3">
              <i className="bi bi-chat-left-text me-1" /> 3. Motivo interno y bloqueo de turnos
            </h3>
            <div className="row g-3">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label fw-semibold" htmlFor="absence-motivo">
                    Motivo interno de la ausencia <span className="text-danger">*</span>
                  </label>
                  <span className="small text-muted">
                    {s.form.motivo.length} / 500 caracteres
                  </span>
                </div>
                <textarea
                  id="absence-motivo"
                  required
                  maxLength={500}
                  rows={2}
                  className="form-control"
                  placeholder="Ej: Licencia médica, capacitación institucional, fuerza mayor..."
                  value={s.form.motivo}
                  onChange={(e) => s.change({ motivo: e.target.value })}
                />
                <span className="form-text small text-muted">
                  Uso administrativo interno. Si se envían notificaciones a pacientes, se utiliza un aviso institucional de reprogramación.
                </span>
              </div>

              <div className="col-12">
                <div className="form-check form-switch pt-1">
                  <input
                    type="checkbox"
                    role="switch"
                    id="absence-activo"
                    className="form-check-input"
                    checked={s.form.activo}
                    onChange={(e) => s.change({ activo: e.target.checked })}
                  />
                  <label className="form-check-label fw-medium" htmlFor="absence-activo">
                    Aplicar bloqueo en agenda (impide que se reserven nuevos turnos en esta fecha y horario)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="d-flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            className="btn btn-saps d-inline-flex align-items-center gap-2 px-4 py-2"
            disabled={!s.relationsReady || invalidTimeRange}
          >
            {!s.relationsReady && <span className="spinner-border spinner-border-sm" role="status" />}
            <i className="bi bi-arrow-right-circle" />
            <span>Revisar turnos afectados</span>
          </button>
          {s.editing && (
            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3"
              onClick={s.reset}
            >
              <i className="bi bi-x-circle" />
              <span>Cancelar edición</span>
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
