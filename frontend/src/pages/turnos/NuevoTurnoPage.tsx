import ValidatedInput from '../../components/ui/ValidatedInput';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';

import {
  getPatients,
} from '../../services/patients.service';

import {
  getProfessionals,
  getProfessionalClinics,
  getProfessionalSpecialties,
} from '../../services/profesionales.service';

import {
  createTurno,
  getDisponibilidad,
} from '../../services/turnos.service';

import type {
  Patient,
} from '../../types/patient.types';

import type {
  Professional,
  ProfessionalClinic,
  ProfessionalSpecialty,
} from '../../types/profesional.types';

import type {
  DisponibilidadResponse,
  DisponibilidadSlot,
} from '../../types/turno.types';

const getToday = () => {
  const date =
    new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      date.getDate(),
    ).padStart(2, '0'),
  ].join('-');
};

const NuevoTurnoPage = () => {
  const navigate =
    useNavigate();

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  const [professionalSpecialties, setProfessionalSpecialties] =
    useState<ProfessionalSpecialty[]>([]);

  const [professionalClinics, setProfessionalClinics] =
    useState<ProfessionalClinic[]>([]);

  const [selectedPatient, setSelectedPatient] =
    useState('');

  const [selectedProfessional, setSelectedProfessional] =
    useState('');

  const [selectedSpecialty, setSelectedSpecialty] =
    useState('');

  const [selectedSalita, setSelectedSalita] =
    useState('');

  const [fecha, setFecha] =
    useState(getToday());

  const [selectedSlot, setSelectedSlot] =
    useState<DisponibilidadSlot | null>(
      null,
    );

  const [motivoConsulta, setMotivoConsulta] =
    useState('');

  const [observaciones, setObservaciones] =
    useState('');

  const [availability, setAvailability] =
    useState<DisponibilidadResponse | null>(
      null,
    );

  const [loadingInitial, setLoadingInitial] =
    useState(true);

  const [loadingRelations, setLoadingRelations] =
    useState(false);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  useEffect(() => {
    const loadInitialData =
      async () => {
        try {
          setLoadingInitial(true);
          setError('');

          const [
            patientsResponse,
            professionalsResponse,
          ] = await Promise.all([
            getPatients(1, 100),
            getProfessionals(),
          ]);

          setPatients(
            patientsResponse.data.patients.filter(
              (item) =>
                item.activo,
            ),
          );

          setProfessionals(
            professionalsResponse.data.filter(
              (item) =>
                item.activo,
            ),
          );
        } catch (error) {
          console.error(error);

          setError(
            'No se pudieron cargar los datos necesarios para crear el turno.',
          );
        } finally {
          setLoadingInitial(false);
        }
      };

    void loadInitialData();
  }, []);

  useEffect(() => {
    setSelectedSpecialty('');
    setSelectedSalita('');
    setSelectedSlot(null);
    setAvailability(null);
    setProfessionalSpecialties([]);
    setProfessionalClinics([]);

    if (!selectedProfessional) {
      return;
    }

    const loadProfessionalRelations =
      async () => {
        try {
          setLoadingRelations(true);
          setError('');

          const [
            specialtiesResponse,
            clinicsResponse,
          ] = await Promise.all([
            getProfessionalSpecialties(
              selectedProfessional,
            ),
            getProfessionalClinics(
              selectedProfessional,
            ),
          ]);

          setProfessionalSpecialties(
            specialtiesResponse.data.filter(
              (item) =>
                item.activo &&
                item.especialidad
                  .activo,
            ),
          );

          setProfessionalClinics(
            clinicsResponse.data.filter(
              (item) =>
                item.activo &&
                item.salita
                  .activo,
            ),
          );
        } catch (error) {
          console.error(error);

          setError(
            'No se pudieron cargar las especialidades y salitas del profesional.',
          );
        } finally {
          setLoadingRelations(false);
        }
      };

    void loadProfessionalRelations();
  }, [selectedProfessional]);

  useEffect(() => {
    setSelectedSlot(null);
    setAvailability(null);

    if (
      !fecha ||
      !selectedProfessional ||
      !selectedSpecialty ||
      !selectedSalita
    ) {
      return;
    }

    const loadAvailability =
      async () => {
        try {
          setLoadingAvailability(
            true,
          );
          setError('');

          const response =
            await getDisponibilidad(
              fecha,
              selectedProfessional,
              selectedSpecialty,
              selectedSalita,
            );

          setAvailability(
            response,
          );
        } catch (error) {
          console.error(error);

          setError(
            'No se pudo consultar la disponibilidad.',
          );
        } finally {
          setLoadingAvailability(
            false,
          );
        }
      };

    void loadAvailability();
  }, [
    fecha,
    selectedProfessional,
    selectedSpecialty,
    selectedSalita,
  ]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setMessage('');
        },
        3500,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [message]);

  const availableSlots =
    useMemo(
      () =>
        availability?.slots.filter(
          (slot) =>
            slot.estado ===
            'DISPONIBLE',
        ) ?? [],
      [availability],
    );

  const handleSubmit =
    async (
      event?: React.FormEvent<HTMLFormElement>,
    ) => {
      event?.preventDefault();

      if (
        !selectedPatient ||
        !selectedProfessional ||
        !selectedSpecialty ||
        !selectedSalita ||
        !fecha ||
        !selectedSlot
      ) {
        setError(
          'Complete todos los datos obligatorios y seleccione un horario disponible.',
        );
        return;
      }

      try {
        setSaving(true);
        setError('');

        const fechaHoraInicio =
          `${fecha}T${selectedSlot.hora_inicio}:00-03:00`;

        await createTurno({
          id_paciente:
            selectedPatient,
          id_profesional:
            selectedProfessional,
          id_especialidad:
            selectedSpecialty,
          id_salita:
            selectedSalita,
          fecha_hora_inicio:
            fechaHoraInicio,
          motivo_consulta:
            motivoConsulta.trim() ||
            null,
          observaciones:
            observaciones.trim() ||
            null,
        });

        setMessage(
          'Turno creado correctamente.',
        );

        setTimeout(() => {
          navigate(
            '/turnos',
            {
              replace: true,
            },
          );
        }, 500);
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo crear el turno. El horario puede haber sido ocupado o no cumplir las reglas de agenda.',
        );
      } finally {
        setSaving(false);
      }
    };

  if (loadingInitial) {
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

  return (
    <div className="turnos-page">
      <ConfirmationModal
        open={confirmOpen}
        title="Confirmar turno"
        message="¿Querés registrar este turno?"
        detail={
          <>
            <div className="fw-semibold">
              {patients.find((patient) => patient.id_paciente === selectedPatient)?.apellidos}, {patients.find((patient) => patient.id_paciente === selectedPatient)?.nombres}
            </div>
            <div className="text-muted small mt-1">
              {fecha} · {selectedSlot?.hora_inicio} - {selectedSlot?.hora_fin}
            </div>
            <div className="text-muted small">
              {professionals.find((professional) => professional.id_profesional === selectedProfessional)?.persona.apellidos}, {professionals.find((professional) => professional.id_profesional === selectedProfessional)?.persona.nombres}
              {' · '}{professionalSpecialties.find((item) => item.id_especialidad === selectedSpecialty)?.especialidad.nombre}
              {' · '}{professionalClinics.find((item) => item.id_salita === selectedSalita)?.salita.nombre}
            </div>
          </>
        }
        confirmText="Crear turno"
        variant="primary"
        icon="bi-calendar-check"
        loading={saving}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleSubmit();
        }}
      />

      <div className="mb-4">
        <button
          type="button"
          className="btn btn-link text-decoration-none p-0 mb-3"
          onClick={() =>
            navigate('/turnos')
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver a turnos
        </button>

        <h2 className="fw-bold mb-1">
          Nuevo turno
        </h2>

        <p className="text-muted mb-0">
          Seleccione paciente, profesional,
          especialidad, salita y horario.
        </p>
      </div>

      {message && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2" />
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <div className="row g-4">
          <div className="col-xl-7">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-calendar-check me-2 text-success" />
                  Datos del turno
                </h5>
              </div>

              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">
                      Paciente *
                    </label>

                    <select
                      className="form-select"
                      value={
                        selectedPatient
                      }
                      onChange={(event) =>
                        setSelectedPatient(
                          event.target
                            .value,
                        )
                      }
                      required
                    >
                      <option value="">
                        Seleccionar paciente
                      </option>

                      {patients.map(
                        (patient) => (
                          <option
                            key={
                              patient.id_paciente
                            }
                            value={
                              patient.id_paciente
                            }
                          >
                            {
                              patient
                                .apellidos
                            }
                            ,{' '}
                            {
                              patient
                                .nombres
                            }{' '}
                            — DNI{' '}
                            {
                              patient.dni
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Profesional *
                    </label>

                    <select
                      className="form-select"
                      value={
                        selectedProfessional
                      }
                      onChange={(event) =>
                        setSelectedProfessional(
                          event.target
                            .value,
                        )
                      }
                      required
                    >
                      <option value="">
                        Seleccionar profesional
                      </option>

                      {professionals.map(
                        (
                          professional,
                        ) => (
                          <option
                            key={
                              professional.id_profesional
                            }
                            value={
                              professional.id_profesional
                            }
                          >
                            {
                              professional
                                .persona
                                .apellidos
                            }
                            ,{' '}
                            {
                              professional
                                .persona
                                .nombres
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Especialidad *
                    </label>

                    <select
                      className="form-select"
                      value={
                        selectedSpecialty
                      }
                      onChange={(event) =>
                        setSelectedSpecialty(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        !selectedProfessional ||
                        loadingRelations
                      }
                      required
                    >
                      <option value="">
                        {loadingRelations
                          ? 'Cargando...'
                          : 'Seleccionar especialidad'}
                      </option>

                      {professionalSpecialties.map(
                        (item) => (
                          <option
                            key={
                              item.id_especialidad
                            }
                            value={
                              item.id_especialidad
                            }
                          >
                            {
                              item
                                .especialidad
                                .nombre
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Salita *
                    </label>

                    <select
                      className="form-select"
                      value={
                        selectedSalita
                      }
                      onChange={(event) =>
                        setSelectedSalita(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        !selectedProfessional ||
                        loadingRelations
                      }
                      required
                    >
                      <option value="">
                        {loadingRelations
                          ? 'Cargando...'
                          : 'Seleccionar salita'}
                      </option>

                      {professionalClinics.map(
                        (item) => (
                          <option
                            key={
                              item.id_salita
                            }
                            value={
                              item.id_salita
                            }
                          >
                            {
                              item
                                .salita
                                .nombre
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Fecha *
                    </label>

                    <ValidatedInput
                      type="date"
                      className="form-control"
                      value={fecha}
                      min={getToday()}
                      onChange={(event) =>
                        setFecha(
                          event.target
                            .value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Motivo de consulta
                    </label>

                    <textarea
                      className="form-control"
                      rows={3}
                      maxLength={2000}
                      value={
                        motivoConsulta
                      }
                      onChange={(event) =>
                        setMotivoConsulta(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Indique el motivo de la consulta..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Observaciones
                    </label>

                    <textarea
                      className="form-control"
                      rows={3}
                      maxLength={4000}
                      value={
                        observaciones
                      }
                      onChange={(event) =>
                        setObservaciones(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-5">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-clock me-2 text-success" />
                  Horarios disponibles
                </h5>
              </div>

              <div className="card-body">
                {!selectedProfessional ||
                !selectedSpecialty ||
                !selectedSalita ||
                !fecha ? (
                  <div className="turno-availability-empty">
                    <i className="bi bi-calendar2-week" />

                    <p className="mb-0">
                      Complete profesional,
                      especialidad, salita y
                      fecha para consultar
                      disponibilidad.
                    </p>
                  </div>
                ) : loadingAvailability ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-success"
                      role="status"
                    >
                      <span className="visually-hidden">
                        Consultando...
                      </span>
                    </div>

                    <p className="text-muted mt-3 mb-0">
                      Consultando
                      disponibilidad...
                    </p>
                  </div>
                ) : availableSlots.length ===
                  0 ? (
                  <div className="turno-availability-empty">
                    <i className="bi bi-calendar-x" />

                    <h6>
                      Sin horarios disponibles
                    </h6>

                    <p className="text-muted mb-0">
                      No hay horarios
                      disponibles para los
                      datos seleccionados.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="turno-availability-summary mb-3">
                      <div>
                        <strong>
                          {
                            availability
                              ?.resumen
                              .disponibles
                          }
                        </strong>

                        <span>
                          disponibles
                        </span>
                      </div>

                      <div>
                        <strong>
                          {
                            availability
                              ?.resumen
                              .ocupados
                          }
                        </strong>

                        <span>
                          ocupados
                        </span>
                      </div>

                      <div>
                        <strong>
                          {
                            availability
                              ?.resumen
                              .bloqueados
                          }
                        </strong>

                        <span>
                          bloqueados
                        </span>
                      </div>
                    </div>

                    <div className="turno-slots">
                      {availableSlots.map(
                        (
                          slot,
                        ) => {
                          const selected =
                            selectedSlot?.hora_inicio ===
                              slot.hora_inicio &&
                            selectedSlot?.hora_fin ===
                              slot.hora_fin;

                          return (
                            <button
                              key={`${slot.hora_inicio}-${slot.hora_fin}`}
                              type="button"
                              className={`turno-slot ${
                                selected
                                  ? 'turno-slot-selected'
                                  : ''
                              }`}
                              onClick={() =>
                                setSelectedSlot(
                                  slot,
                                )
                              }
                            >
                              <i className="bi bi-clock me-2" />

                              <strong>
                                {
                                  slot.hora_inicio
                                }
                              </strong>

                              <span>
                                a{' '}
                                {
                                  slot.hora_fin
                                }
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>

                    {selectedSlot && (
                      <div className="turno-selected-slot mt-3">
                        <i className="bi bi-check-circle-fill me-2" />

                        Horario seleccionado:{' '}
                        <strong>
                          {
                            selectedSlot.hora_inicio
                          }{' '}
                          -{' '}
                          {
                            selectedSlot.hora_fin
                          }
                        </strong>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="card-footer bg-white border-0">
                <button
                  type="submit"
                  className="btn btn-saps w-100"
                  disabled={
                    saving ||
                    !selectedSlot
                  }
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />

                      Creando turno...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-calendar-check me-2" />
                      Confirmar turno
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NuevoTurnoPage;