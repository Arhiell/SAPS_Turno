import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  addProfessionalClinic,
  addProfessionalSpecialty,
  deleteProfessionalClinic,
  deleteProfessionalSpecialty,
  getProfessionalById,
  getProfessionalClinics,
  getProfessionalSpecialties,
} from '../../services/profesionales.service';

import { getSpecialties } from '../../services/especialidades.service';
import { getSalitas } from '../../services/salitas.service';

import type {
  Professional,
  ProfessionalClinic,
  ProfessionalSpecialty,
  Specialty,
} from '../../types/profesional.types';

import type {
  Salita,
} from '../../types/salita.types';

const ProfesionalDetallePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [professional, setProfessional] =
    useState<Professional | null>(null);

  const [specialties, setSpecialties] =
    useState<ProfessionalSpecialty[]>([]);

  const [clinics, setClinics] =
    useState<ProfessionalClinic[]>([]);

  const [availableSpecialties, setAvailableSpecialties] =
    useState<Specialty[]>([]);

  const [availableClinics, setAvailableClinics] =
    useState<Salita[]>([]);

  const [selectedSpecialty, setSelectedSpecialty] =
    useState('');

  const [selectedClinic, setSelectedClinic] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const loadData = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [
        professionalResponse,
        specialtiesResponse,
        clinicsResponse,
        allSpecialtiesResponse,
        allClinicsResponse,
      ] = await Promise.all([
        getProfessionalById(id),
        getProfessionalSpecialties(id),
        getProfessionalClinics(id),
        getSpecialties(),
        getSalitas(),
      ]);

      setProfessional(
        professionalResponse.data,
      );

      setSpecialties(
        specialtiesResponse.data,
      );

      setClinics(
        clinicsResponse.data,
      );

      setAvailableSpecialties(
        allSpecialtiesResponse.data.filter(
          (specialty) =>
            specialty.activo &&
            specialty.requiere_profesional,
        ),
      );

      setAvailableClinics(
        allClinicsResponse.data.filter(
          (clinic) => clinic.activo,
        ),
      );
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo cargar la información del profesional.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage('');
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const handleAddSpecialty = async () => {
    if (!id || !selectedSpecialty) {
      return;
    }

    try {
      setError('');

      await addProfessionalSpecialty(
        id,
        {
          id_especialidad:
            selectedSpecialty,
        },
      );

      setSelectedSpecialty('');

      setMessage(
        'Especialidad asignada correctamente.',
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo asignar la especialidad.',
      );
    }
  };

  const handleRemoveSpecialty = async (
    specialty: ProfessionalSpecialty,
  ) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Desea quitar la especialidad "${specialty.especialidad.nombre}" del profesional?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await deleteProfessionalSpecialty(
        id,
        specialty.id_especialidad,
      );

      setMessage(
        'Especialidad quitada correctamente.',
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo quitar la especialidad.',
      );
    }
  };

  const handleAddClinic = async () => {
    if (!id || !selectedClinic) {
      return;
    }

    try {
      setError('');

      await addProfessionalClinic(
        id,
        {
          id_salita: selectedClinic,
        },
      );

      setSelectedClinic('');

      setMessage(
        'Salita asignada correctamente.',
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo asignar la salita.',
      );
    }
  };

  const handleRemoveClinic = async (
    clinic: ProfessionalClinic,
  ) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Desea quitar la asignación de "${clinic.salita.nombre}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await deleteProfessionalClinic(
        id,
        clinic.id_salita,
      );

      setMessage(
        'Asignación de salita quitada correctamente.',
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo quitar la salita.',
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-success"
          role="status"
        >
          <span className="visually-hidden">
            Cargando...
          </span>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div>
        <div className="alert alert-danger">
          {error ||
            'Profesional no encontrado.'}
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate('/profesionales')
          }
        >
          Volver
        </button>
      </div>
    );
  }

  const person = professional.persona;

  const assignedSpecialtyIds =
    new Set(
      specialties.map(
        (item) =>
          item.id_especialidad,
      ),
    );

  const assignedClinicIds =
    new Set(
      clinics.map(
        (item) => item.id_salita,
      ),
    );

  const specialtiesToSelect =
    availableSpecialties.filter(
      (item) =>
        !assignedSpecialtyIds.has(
          item.id_especialidad,
        ),
    );

  const clinicsToSelect =
    availableClinics.filter(
      (item) =>
        !assignedClinicIds.has(
          item.id_salita,
        ),
    );

  return (
    <div className="professional-detail">
      <div className="d-flex justify-content-between align-items-start mb-4 gap-3">
        <div>
          <button
            type="button"
            className="btn btn-link text-decoration-none p-0 mb-3"
            onClick={() =>
              navigate('/profesionales')
            }
          >
            <i className="bi bi-arrow-left me-2" />
            Volver a profesionales
          </button>

          <h2 className="fw-bold mb-1">
            {person.apellidos},{' '}
            {person.nombres}
          </h2>

          <p className="text-muted mb-0">
            Matrícula: {professional.matricula}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() =>
            navigate(
              `/profesionales/${professional.id_profesional}/editar`,
            )
          }
        >
          <i className="bi bi-pencil me-2" />
          Editar
        </button>
      </div>

      {message && (
        <div
          className="alert alert-success"
          role="alert"
        >
          <i className="bi bi-check-circle me-2" />
          {message}
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      <div className="row g-4">
        {/* INFORMACIÓN PERSONAL */}
        <div className="col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-person-vcard me-2 text-success" />
                Información personal
              </h5>
            </div>

            <div className="card-body">
              <div className="professional-detail-avatar">
                <i className="bi bi-person-badge" />
              </div>

              <div className="professional-info-list">
                <div>
                  <span>DNI</span>
                  <strong>
                    {person.dni}
                  </strong>
                </div>

                <div>
                  <span>Matrícula</span>
                  <strong>
                    {professional.matricula}
                  </strong>
                </div>

                <div>
                  <span>
                    Fecha de nacimiento
                  </span>
                  <strong>
                    {person.fecha_nacimiento ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Sexo</span>
                  <strong>
                    {person.sexo ||
                      'No informa'}
                  </strong>
                </div>

                <div>
                  <span>Teléfono</span>
                  <strong>
                    {person.telefono ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {person.email ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Dirección</span>
                  <strong>
                    {person.direccion ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Localidad</span>
                  <strong>
                    {person.localidad ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>
                    {professional.activo ? (
                      <span className="badge bg-success-subtle text-success">
                        Activo
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary">
                        Inactivo
                      </span>
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ASIGNACIONES */}
        <div className="col-xl-7">

          {/* ESPECIALIDADES */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-award me-2 text-success" />
                  Especialidades
                </h5>

                <span className="badge bg-success-subtle text-success">
                  {specialties.length}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="row g-2 mb-4">
                <div className="col">
                  <select
                    className="form-select"
                    value={selectedSpecialty}
                    onChange={(event) =>
                      setSelectedSpecialty(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar especialidad
                    </option>

                    {specialtiesToSelect.map(
                      (specialty) => (
                        <option
                          key={
                            specialty.id_especialidad
                          }
                          value={
                            specialty.id_especialidad
                          }
                        >
                          {specialty.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="col-auto">
                  <button
                    type="button"
                    className="btn btn-saps"
                    disabled={
                      !selectedSpecialty
                    }
                    onClick={() =>
                      void handleAddSpecialty()
                    }
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Asignar
                  </button>
                </div>
              </div>

              {specialties.length === 0 ? (
                <div className="professional-mini-empty">
                  No hay especialidades
                  asignadas.
                </div>
              ) : (
                <div className="professional-assignment-list">
                  {specialties.map(
                    (specialty) => (
                      <div
                        className="professional-assignment"
                        key={
                          specialty.id_especialidad
                        }
                      >
                        <div>
                          <strong>
                            {
                              specialty
                                .especialidad
                                .nombre
                            }
                          </strong>

                          <small>
                            Desde{' '}
                            {
                              specialty.fecha_desde
                            }
                          </small>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Quitar especialidad"
                          onClick={() =>
                            void handleRemoveSpecialty(
                              specialty,
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SALITAS */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-hospital me-2 text-success" />
                  Salitas
                </h5>

                <span className="badge bg-success-subtle text-success">
                  {clinics.length}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="row g-2 mb-4">
                <div className="col">
                  <select
                    className="form-select"
                    value={selectedClinic}
                    onChange={(event) =>
                      setSelectedClinic(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar salita
                    </option>

                    {clinicsToSelect.map(
                      (clinic) => (
                        <option
                          key={
                            clinic.id_salita
                          }
                          value={
                            clinic.id_salita
                          }
                        >
                          {clinic.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="col-auto">
                  <button
                    type="button"
                    className="btn btn-saps"
                    disabled={
                      !selectedClinic
                    }
                    onClick={() =>
                      void handleAddClinic()
                    }
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Asignar
                  </button>
                </div>
              </div>

              {clinics.length === 0 ? (
                <div className="professional-mini-empty">
                  No hay salitas asignadas.
                </div>
              ) : (
                <div className="professional-assignment-list">
                  {clinics.map(
                    (clinic) => (
                      <div
                        className="professional-assignment"
                        key={
                          clinic.id_salita
                        }
                      >
                        <div>
                          <strong>
                            {clinic.salita.nombre}
                          </strong>

                          <small>
                            {clinic.salita.direccion}
                          </small>

                          <small>
                            Desde{' '}
                            {clinic.fecha_desde}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Quitar salita"
                          onClick={() =>
                            void handleRemoveClinic(
                              clinic,
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfesionalDetallePage;