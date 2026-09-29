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
  patient: Patient;
  coverage: ReturnType<typeof usePatientCoverage>;
}) {
  // Obtiene los datos necesarios de cobertura.
  const {
    barrios,
    clinics,
    zones,
    relations,
    loading,
    error,
    retry,
  } = coverage;

  // ========================================
  // DATOS DEL PACIENTE Y SU COBERTURA
  // ========================================

  // Busca el barrio actual del paciente.
  const barrio = barrios.find(
    (b) =>
      b.id_barrio === patient.id_barrio
  );

  // Busca la salita actualmente asignada.
  const clinic = clinics.find(
    (c) =>
      c.id_salita ===
      patient.id_salita_asignada
  );

  // Obtiene las salitas con cobertura
  // para el barrio del paciente.
  const covered = coveredClinics(
    patient.id_barrio,
    clinics,
    relations
  );

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <section className="patient-section h-100">
      {/* Título de la sección. */}
      <h2 className="h5 mb-3">
        <i
          className="bi bi-hospital me-2"
          aria-hidden="true"
        />
        Mi cobertura
      </h2>

      {loading ? (
        // Estado de carga.
        <p role="status">
          Cargando cobertura…
        </p>
      ) : error ? (
        // Error al obtener la cobertura.
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}{' '}

          <button
            className="btn btn-outline-danger"
            onClick={retry}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Información de cobertura del paciente. */}
          <dl className="mb-0">
            <dt>
              Barrio
            </dt>

            <dd>
              {barrio?.nombre ??
                'Sin información disponible'}
            </dd>

            <dt>
              Zona
            </dt>

            <dd>
              {zones.find(
                (z) =>
                  z.id_zona ===
                  barrio?.id_zona
              )?.nombre ??
                'Sin información disponible'}
            </dd>

            <dt>
              Salita asignada
            </dt>

            <dd>
              {clinic?.nombre ??
                'Sin información disponible'}
            </dd>

            <dt>
              Dirección de la salita
            </dt>

            <dd>
              {clinic?.direccion ||
                'Sin informar'}
            </dd>

            <dt>
              Teléfono
            </dt>

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

            <dt>
              Horario institucional
            </dt>

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

          {/* Advierte si la salita asignada ya
              no posee cobertura vigente. */}
          {!covered.some(
            (c) =>
              c.id_salita ===
              patient.id_salita_asignada
          ) && (
            <div className="alert alert-warning mb-0">
              Tu asignación no tiene cobertura
              vigente. Contactá a administración
              para revisarla.
            </div>
          )}

          {/* Informa otras salitas que también
              poseen cobertura para el barrio. */}
          {covered.length > 1 && (
            <p className="small text-muted mb-0">
              Salitas que cubren tu barrio:{' '}
              {covered
                .map(
                  (c) => c.nombre
                )
                .join(', ')}
              . Para reservar se utiliza tu salita
              asignada.
            </p>
          )}
        </>
      )}
    </section>
  );
}