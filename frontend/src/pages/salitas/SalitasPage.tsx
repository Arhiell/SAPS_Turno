import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSalitas } from '../../services/salitas.service';

import type { Salita } from '../../types/salita.types';

const SalitasPage = () => {
  const navigate = useNavigate();

  const [salitas, setSalitas] = useState<Salita[]>([]);
  const [filteredSalitas, setFilteredSalitas] =
    useState<Salita[]>([]);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSalitas = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getSalitas();

      const activeSalitas =
        response.data.filter(
          (salita) => salita.activo,
        );

      setSalitas(activeSalitas);
      setFilteredSalitas(activeSalitas);
    } catch (error) {
      console.error(error);

      setError(
        'No se pudieron cargar las salitas.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSalitas();
  }, []);

  useEffect(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      setFilteredSalitas(salitas);
      return;
    }

    const result = salitas.filter((salita) =>
      [
        salita.codigo,
        salita.nombre,
        salita.direccion,
      ]
        .filter(Boolean)
        .some((field) =>
          field
            .toLowerCase()
            .includes(value),
        ),
    );

    setFilteredSalitas(result);
  }, [search, salitas]);

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Salitas
          </h2>

          <p className="text-muted mb-0">
            Administración de las salitas municipales.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate('/salitas/nueva')
          }
        >
          <i className="bi bi-plus-lg me-2" />
          Nueva salita
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-10">
              <div className="position-relative">
                <i
                  className="bi bi-search position-absolute"
                  style={{
                    left: '14px',
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                    color:
                      'var(--saps-texto-secundario)',
                  }}
                />

                <input
                  type="text"
                  className="form-control"
                  style={{
                    paddingLeft: '40px',
                  }}
                  placeholder="Buscar por código, nombre o dirección"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => setSearch('')}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* LISTADO */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1">
                Salitas registradas
              </h5>

              <small className="text-muted">
                {filteredSalitas.length}{' '}
                {filteredSalitas.length === 1
                  ? 'salita'
                  : 'salitas'}
              </small>
            </div>

            <span className="badge text-bg-success">
              Activas
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-success"
                role="status"
              >
                <span className="visually-hidden">
                  Cargando...
                </span>
              </div>

              <p className="text-muted mt-3 mb-0">
                Cargando salitas...
              </p>
            </div>
          ) : filteredSalitas.length === 0 ? (
            <div className="text-center py-5">
              <div className="dashboard-empty-icon mx-auto">
                <i className="bi bi-hospital" />
              </div>

              <h5 className="fw-bold">
                No hay salitas para mostrar
              </h5>

              <p className="text-muted mb-0">
                No encontramos salitas con esos
                criterios.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table saps-responsive-table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Salita</th>
                    <th scope="col">Dirección</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSalitas.map(
                    (salita) => (
                      <tr
                        key={salita.id_salita}
                      >
                        <td data-label="Código">
                          <span className="fw-semibold">
                            {salita.codigo}
                          </span>
                        </td>

                        <td data-label="Salita">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="dashboard-stat-icon"
                              style={{
                                width: '40px',
                                height: '40px',
                                fontSize: '17px',
                              }}
                            >
                              <i className="bi bi-hospital" />
                            </div>

                            <strong>
                              {salita.nombre}
                            </strong>
                          </div>
                        </td>

                        <td data-label="Dirección">
                          {salita.direccion ||
                            '-'}
                        </td>

                        <td data-label="Teléfono">
                          {salita.telefono ||
                            '-'}
                        </td>

                        <td data-label="Estado">
                          <span className="badge text-bg-success">
                            Activa
                          </span>
                        </td>

                        <td data-label="Acciones" className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Ver salita"
                              onClick={() =>
                                navigate(
                                  `/salitas/${salita.id_salita}`,
                                )
                              }
                            >
                              <i className="bi bi-eye" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              title="Editar salita"
                              onClick={() =>
                                navigate(
                                  `/salitas/${salita.id_salita}/editar`,
                                )
                              }
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalitasPage;
