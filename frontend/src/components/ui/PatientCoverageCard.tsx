
import { useState } from 'react';

import type {
  Patient,
} from '../../types/patient.types';

import usePatientCoverage, {
  coveredClinics,
} from '../../context/usePatientCoverage';

export default function PatientCoverageCard({
  patient,
  coverage,
}: {
  patient: Pick<Patient, 'id_barrio' | 'id_salita_asignada'>;
  coverage: ReturnType<typeof usePatientCoverage>;
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    barrios,
    clinics,
    zones,
    relations,
    loading,
    error,
    retry,
  } = coverage;

  // Busca el barrio actual del paciente.
  const barrio = barrios.find(
    (b) => b.id_barrio === patient.id_barrio
  );

  // Busca la salita asignada.
  const clinic = clinics.find(
    (c) => c.id_salita === patient.id_salita_asignada
  );

  // Obtiene las salitas que cubren el barrio.
  const covered = coveredClinics(
    patient.id_barrio,
    clinics,
    relations
  );

  const zoneName = zones.find(
    (z) => z.id_zona === barrio?.id_zona
  )?.nombre;

  const hasCoverage = covered.some(
    (c) => c.id_salita === patient.id_salita_asignada
  );

  return (
    <section className="patient-section h-100 patient-coverage-card">

      {/* Resumen de cobertura para celulares. */}
      <button
        type="button"
        className="patient-coverage-summary"
        aria-expanded={expanded}
        onClick={() => setExpanded((previous) => !previous)}
      >
        <span className="patient-coverage-summary-icon">
          <i
            className="bi bi-hospital"
            aria-hidden="true"
          />
        </span>

        <span className="patient-coverage-summary-text">
          <strong>Mi cobertura</strong>

          <span>
            {loading
              ? 'Cargando información…'
              : clinic?.nombre ?? 'Salita no disponible'}
          </span>

          {!loading && (
            <small>
              {barrio?.nombre ?? 'Barrio sin informar'}
              {zoneName ? ` · ${zoneName}` : ''}
            </small>
          )}
        </span>

        <i
          className={`bi ${
            expanded ? 'bi-chevron-up' : 'bi-chevron-down'
          } patient-coverage-chevron`}
          aria-hidden="true"
        />
      </button>

      {/* Información completa de cobertura. */}
      <div
        className={`patient-coverage-content ${
          expanded ? 'is-expanded' : ''
        }`}
      >
        <h2 className="h5 mb-3 patient-coverage-content-title">
          <i
            className="bi bi-hospital me-2"
            aria-hidden="true"
          />
          Mi cobertura
        </h2>

        {loading ? (
          <p role="status">
            Cargando cobertura…
          </p>
        ) : error ? (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {error}{' '}

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={retry}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <dl className="mb-0">
              <dt>Barrio</dt>

              <dd>
                {barrio?.nombre ??
                  'Sin información disponible'}
              </dd>

              <dt>Zona</dt>

              <dd>
                {zoneName ??
                  'Sin información disponible'}
              </dd>

              <dt>Salita asignada</dt>

              <dd>
                {clinic?.nombre ??
                  'Sin información disponible'}
              </dd>

              <dt>Dirección de la salita</dt>

              <dd>
                {clinic?.direccion ||
                  'Sin informar'}
              </dd>

              <dt>Teléfono</dt>

              <dd>
                {clinic?.telefono ? (
                  <a
                    href={`tel:${clinic.telefono.replace(
                      /[^+\d]/g,
                      ''
                    )}`}
                  >
                    {clinic.telefono}
                  </a>
                ) : (
                  'Sin informar'
                )}
              </dd>

              <dt>Horario institucional</dt>

              <dd>
                {clinic?.horario_apertura &&
                clinic.horario_cierre
                  ? `${clinic.horario_apertura.slice(
                      0,
                      5
                    )} a ${clinic.horario_cierre.slice(
                      0,
                      5
                    )}`
                  : 'Consultá los horarios en tu salita'}
              </dd>
            </dl>

            {/* Advierte si no existe cobertura vigente. */}
            {!hasCoverage && (
              <div className="alert alert-warning mb-0">
                Tu asignación no tiene cobertura
                vigente. Contactá a administración
                para revisarla.
              </div>
            )}

            {/* Informa otras salitas que cubren el barrio. */}
            {covered.length > 1 && (
              <p className="small text-muted mb-0 mt-3">
                Salitas que cubren tu barrio:{' '}
                {covered
                  .map((c) => c.nombre)
                  .join(', ')}
                . Para reservar se utiliza tu salita
                asignada.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
