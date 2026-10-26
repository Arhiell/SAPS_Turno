import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { authError } from '../../utils/auth-errors';
import type { Patient } from '../../types/patient.types';
import AccountSummary from './AccountSummary';

export default function PatientAccountPanel({ patient, onLinked }: { patient: Patient; onLinked: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [linked, setLinked] = useState(false);
  const canLink = user && ['SUPER_ADMIN', 'ADMIN_SALITA'].includes(user.rol);
  return <section className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <h3 className="h5">Cuenta propia y gestión de turnos</h3>
      <p>La ficha del paciente no requiere correo, cuenta ni verificación de email para recibir atención o tener un tutor. El responsable ingresa con su propia cuenta.</p>
      <AccountSummary account={patient.cuenta} />
      {!patient.cuenta && !linked && canLink && <details>
        <summary className="text-success">Vincular una cuenta para gestionar sus propios turnos</summary>
        <p className="small mt-2">Cuando la persona decida gestionar sus turnos, debe registrar y verificar su propia cuenta. Luego administración verifica su identidad y la vincula aquí, conservando la ficha y todos sus turnos. No ingreses el correo del tutor.</p>
        <form onSubmit={async event => {
          event.preventDefault(); if (!confirmed || busy) return;
          setBusy(true); setError('');
          try {
            await api.patch(`/patients/${patient.id_paciente}/account`, { email: email.trim(), identidad_verificada: true });
            setLinked(true); onLinked();
          } catch (cause) { setError(authError(cause)); }
          finally { setBusy(false); }
        }}>
          <fieldset disabled={busy}>
            <label className="form-label" htmlFor="patient-account-email">Correo de la cuenta propia del paciente</label>
            <input id="patient-account-email" className="form-control" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
            <div className="form-check my-3"><input id="patient-account-identity" type="checkbox" className="form-check-input" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
              <label className="form-check-label" htmlFor="patient-account-identity">Verifiqué la identidad y la solicitud de gestión propia del paciente.</label></div>
            <button className="btn btn-saps" disabled={!confirmed} type="submit">Vincular cuenta propia</button>
          </fieldset>
          {error && <p className="alert alert-danger mt-2" role="alert">{error}</p>}
        </form>
      </details>}
      {linked && <p className="alert alert-success" role="status">Cuenta vinculada. La persona puede volver a ingresar con su cuenta.</p>}
      <p className="small text-muted mt-3 mb-0">Tener cuenta propia no elimina automáticamente los responsables. Para cambiar de tutor o dejar de delegar la gestión, revisá y retirales el permiso en Tutores y responsables.</p>
    </div>
  </section>;
}
