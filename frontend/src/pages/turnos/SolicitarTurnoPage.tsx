import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import usePatientCoverage, {
  coveredClinics,
} from '../../context/usePatientCoverage';

import PatientCoverageCard from '../../components/ui/PatientCoverageCard';
import PatientBookingForm from '../../components/ui/PatientBookingForm';

export default function SolicitarTurnoPage() {
  // Obtiene el perfil del paciente autenticado.
  const {
    patient,
  } = useAuth();

  // Obtiene barrios, salitas y relaciones
  // necesarias para validar la cobertura.
  const coverage = usePatientCoverage();

  // ========================================
  // PERFIL INCOMPLETO
  // ========================================

  // Si todavía no completó su perfil,
  // debe hacerlo antes de solicitar un turno.
  if (!patient) {
    return (
      <section className="patient-section">
        <h1 className="h3">
          Solicitar turno
        </h1>

        <p>
          Completá tu perfil para conocer tu cobertura.
        </p>

        <Link
          className="btn btn-saps"
          to="/completar-perfil"
        >
          Completar perfil
        </Link>
      </section>
    );
  }

  // ========================================
  // VALIDACIÓN DE COBERTURA
  // ========================================

  // Verifica que la salita asignada al paciente
  // tenga cobertura vigente para su barrio.
  const valid = coveredClinics(
    patient.id_barrio,
    coverage.clinics,
    coverage.relations
  ).some(
    (c) =>
      c.id_salita ===
      patient.id_salita_asignada
  );

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <section>
      <h1 className="h3">
        Solicitar turno
      </h1>

      <p className="text-muted mb-4">
        Elegí una fecha, especialidad y profesional
        de tu salita.
      </p>

      <div className="row g-4">
        {/* Información de cobertura del paciente. */}
        <div className="col-12 col-lg-5">
          <PatientCoverageCard
            patient={patient}
            coverage={coverage}
          />
        </div>

        {/* =====================================
            RESERVA DEL TURNO
            ===================================== */}

        <div className="col-12 col-lg-7">
          {/* Si la cobertura es válida,
              permite solicitar el turno. */}
          {!coverage.loading &&
            !coverage.error &&
            valid && (
              <PatientBookingForm
                clinic={
                  patient.id_salita_asignada
                }
              />
            )}

          {/* Si la salita asignada no tiene
              cobertura vigente, bloquea la reserva. */}
          {!coverage.loading &&
            !coverage.error &&
            !valid && (
              <div className="patient-section">
                <p>
                  Necesitamos revisar tu cobertura
                  antes de reservar. Actualizá tu
                  barrio o contactá a tu salita.
                </p>

                <Link
                  className="btn btn-outline-success"
                  to="/mi-perfil"
                >
                  Revisar mi perfil
                </Link>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}