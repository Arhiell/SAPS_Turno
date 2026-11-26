import { useRef } from 'react';
import { Link } from 'react-router-dom';
import AgendaImpactPanel from '../../components/turnos/AgendaImpactPanel';
import AbsenceForm from '../../components/turnos/AbsenceForm';
import AbsenceList from '../../components/turnos/AbsenceList';
import useAbsenceForm from '../../components/turnos/useAbsenceForm';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import {
  useAutoDismiss,
  SUCCESS_MESSAGE_TIMEOUT_MS,
  RECOVERABLE_ERROR_TIMEOUT_MS,
} from '../../utils/useAutoDismiss';

export default function BloqueosPage() {
  const s = useAbsenceForm();
  const formRef = useRef<HTMLFormElement>(null);

  useAutoDismiss(
    s.success,
    () => s.setSuccess(''),
    SUCCESS_MESSAGE_TIMEOUT_MS,
    Boolean(s.success)
  );

  useAutoDismiss(
    s.error,
    () => s.setError(''),
    RECOVERABLE_ERROR_TIMEOUT_MS,
    Boolean(s.error)
  );

  return (
    <div>
      <div className="dashboard-header mb-3">
        <h1 className="h3">Ausencias y reprogramación de turnos</h1>
        <p className="text-muted mb-0">
          Registrá ausencias de profesionales o cierres puntuales, identificá turnos afectados y gestioná las reprogramaciones correspondientes.
        </p>
      </div>

      <div className="alert alert-light border small text-muted mb-4 d-flex align-items-center gap-2">
        <i className="bi bi-info-circle text-saps fs-5" />
        <span>
          Las ausencias se aplican exclusivamente en las fechas y horarios indicados.
          {s.user?.rol !== 'RECEPCION' && (
            <>
              {' '}Para modificar los días habituales y permanentes de atención de cada profesional, utilizá{' '}
              <Link
                to={`/configuracion/horarios${
                  s.form.id_profesional ? `?profesional=${s.form.id_profesional}` : ''
                }`}
                className="text-saps fw-semibold"
              >
                Horarios habituales
              </Link>.
            </>
          )}
        </span>
      </div>

      {s.error && (
        <FloatingFeedbackToast
          variant="error"
          message={s.error}
          onDismiss={() => s.setError('')}
        />
      )}

      {s.success && (
        <FloatingFeedbackToast
          variant="success"
          message={s.success}
          onDismiss={() => s.setSuccess('')}
        />
      )}

      {s.impact && (
        <AgendaImpactPanel
          cambio={s.impact}
          context={s.context}
          onClose={s.close}
          onSaved={s.saved}
        />
      )}

      <AbsenceForm state={s} formRef={formRef} />

      <AbsenceList
        state={s}
        onEdit={(row) => {
          s.edit(row);
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
    </div>
  );
}
