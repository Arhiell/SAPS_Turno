import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import ProfesionalForm, {
  type ProfessionalFormData,
} from '../../components/profesionales/ProfesionalForm';

import {
  getProfessionalById,
  updateProfessional,
} from '../../services/profesionales.service';

import type {
  Professional,
} from '../../types/profesional.types';

const EditarProfesionalPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [professional, setProfessional] =
    useState<Professional | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!id) {
      setError(
        'No se especificó el profesional.',
      );
      setLoading(false);
      return;
    }

    const loadProfessional = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getProfessionalById(id);

        setProfessional(response.data);
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo cargar el profesional.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfessional();
  }, [id]);

  const handleSubmit = async (
    data: ProfessionalFormData,
  ) => {
    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateProfessional(id, {
        dni: data.dni,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento:
          data.fecha_nacimiento || null,
        sexo: data.sexo,
        telefono:
          data.telefono || null,
        email:
          data.email || null,
        direccion:
          data.direccion || null,
        localidad: data.localidad,
        provincia: data.provincia,
        codigo_postal:
          data.codigo_postal || null,
        matricula: data.matricula,
      });

      navigate(
        `/profesionales/${id}`,
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(error);

      setError(
        'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
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

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-link text-decoration-none p-0 mb-3"
          onClick={() =>
            navigate(
              `/profesionales/${id}`,
            )
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver al profesional
        </button>

        <h2 className="fw-bold mb-1">
          Editar profesional
        </h2>

        <p className="text-muted mb-0">
          Modificar los datos del profesional.
        </p>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      <ProfesionalForm
        professional={professional}
        loading={saving}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/profesionales/${id}`,
          )
        }
      />
    </div>
  );
};

export default EditarProfesionalPage;