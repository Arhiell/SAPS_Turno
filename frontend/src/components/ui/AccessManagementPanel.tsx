import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { CompletePersonInput, PersonProfile } from '../../types/auth.types';
import { correctManagedPerson, getManagedAccounts, setManagedAccountStatus,
  type ManagedAccount } from '../../services/access-management.service';
import type { Salita } from '../../types/salita.types';
import { authError } from '../../utils/auth-errors';
import PersonProfileFields from './PersonProfileFields';
import ConfirmationModal from './ConfirmationModal';

export default function AccessManagementPanel({ revision, salitas }: { revision: number; salitas: Salita[] }) {
  const { user, reloadProfile } = useAuth();
  const [role, setRole] = useState('');
  const [clinic, setClinic] = useState('');
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<PersonProfile | null>(null);
  const [draft, setDraft] = useState<CompletePersonInput>({ dni: '', nombres: '', apellidos: '' });
  const [statusTarget, setStatusTarget] = useState<ManagedAccount | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const editor = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        const result = await getManagedAccounts(page, search, role, clinic);
        if (!active) return;
        setAccounts(result.items); setTotal(result.total); setPages(result.totalPages);
      } catch (cause) { if (active) setError(authError(cause)); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [page, revision, refresh, search, role, clinic]);

  const edit = (person: PersonProfile) => {
    setTarget(person);
    setDraft({ dni: person.dni, nombres: person.nombres, apellidos: person.apellidos,
      fecha_nacimiento: person.fecha_nacimiento, sexo: person.sexo,
      telefono: person.telefono ?? '', direccion: person.direccion ?? '',
      localidad: person.localidad ?? '', provincia: person.provincia ?? '',
      codigo_postal: person.codigo_postal ?? '' });
    setError(''); setMessage('');
  };

  useEffect(() => { if (target) editor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [target]);

  const savePerson = async () => {
    if (!target || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await correctManagedPerson(target.id_persona, { ...draft,
        direccion: draft.direccion?.trim() || null,
      });
      if (target.id_persona === user?.id_persona) await reloadProfile();
      setTarget(null); setMessage('Datos personales actualizados.'); setRefresh((value) => value + 1);
    } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); setConfirmSave(false); }
  };

  const changeStatus = async () => {
    if (!statusTarget || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await setManagedAccountStatus(statusTarget.id_usuario, !statusTarget.activo);
      setMessage(statusTarget.activo ? 'Cuenta dada de baja. Ya no puede ingresar.' : 'Cuenta reactivada.');
      setRefresh((value) => value + 1);
    } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); setStatusTarget(null); }
  };

  return (
    <section id="administrar-accesos" className="mt-4 border-top pt-4" style={{ scrollMarginTop: '6rem' }}>
      <h2 className="h5">Administradores</h2>
      <p className="text-muted">
        {user?.rol === 'SUPER_ADMIN'
          ? 'Administrá las cuentas de superadministradores y administradores de salas.'
          : 'Consultá los administradores de tus salas con asignación vigente.'}
      </p>
      <div className="row g-3 mb-3">
        <label className="form-label col-12 col-md-6">Cargo
          <select className="form-select" value={role} disabled={busy}
            onChange={(event) => {
              setRole(event.target.value);
              if (event.target.value === 'SUPER_ADMIN') setClinic('');
              setPage(1);
            }}>
            <option value="">{user?.rol === 'SUPER_ADMIN' ? 'Todos los cargos administrativos' : 'Administradores de sala'}</option>
            {user?.rol === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Superadministrador</option>}
            <option value="ADMIN_SALITA">Administrador de sala</option>
          </select>
        </label>
        <label className="form-label col-12 col-md-6">Sala
          <select className="form-select" value={clinic} disabled={busy || role === 'SUPER_ADMIN'}
            onChange={(event) => { setClinic(event.target.value); setPage(1); }}>
            <option value="">{user?.rol === 'SUPER_ADMIN' ? 'Todas las salas' : 'Todas mis salas'}</option>
            {salitas.map((salita) => <option key={salita.id_salita} value={salita.id_salita}>{salita.nombre}</option>)}
          </select>
        </label>
      </div>
      <form className="d-flex flex-wrap align-items-end gap-2 mb-3" onSubmit={(event) => {
        event.preventDefault(); setSearch(searchInput.trim()); setPage(1); setRefresh((value) => value + 1);
      }}>
        <label className="form-label flex-grow-1 mb-0">
          Buscar por usuario o correo
          <input className="form-control" type="search" maxLength={100} value={searchInput}
            disabled={busy} onChange={(event) => setSearchInput(event.target.value)} />
        </label>
        <button type="submit" className="btn btn-outline-success" disabled={busy || loading}>Buscar</button>
      </form>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {message && <p className="alert alert-success" role="status">{message}</p>}
      {target && (
        <form ref={editor} className="border rounded p-3 mb-3" onSubmit={(event) => { event.preventDefault(); setConfirmSave(true); }}>
          <h3 className="h6">Corregir datos de {target.nombres} {target.apellidos}</h3>
          <fieldset disabled={busy}>
            <PersonProfileFields value={draft} onChange={setDraft} />
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn btn-success" type="submit">Guardar cambios</button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setTarget(null)}>Cancelar</button>
            </div>
          </fieldset>
        </form>
      )}
      {loading ? <p role="status">Cargando registros…</p> : !error && (
        <>
          <p className="small text-muted">{total} registros</p>
          <div className="row g-3">
            {accounts.map((account) => (
              <div className="col-12 col-xl-6" key={account.id_usuario}>
                <article className="border rounded p-3 h-100 text-break">
                  <h3 className="h6">{account.nombre_usuario}</h3>
                  <p className="mb-1">{account.rol.nombre} · {account.activo ? 'Activa' : 'Inactiva'}</p>
                  <p className="mb-1">{account.email}</p>
                  <p className="small text-muted">{account.persona
                    ? `${account.persona.nombres} ${account.persona.apellidos} · DNI ${account.persona.dni}`
                    : 'Datos personales pendientes: la cuenta debe completar su perfil al ingresar.'}</p>
                  <p className="small text-muted">{account.rol.codigo === 'SUPER_ADMIN'
                    ? 'Alcance global'
                    : account.asignaciones.map((assignment) => assignment.salita?.nombre).filter(Boolean).join(', ') || 'Sin sala vigente'}</p>
                  {user?.rol === 'SUPER_ADMIN' && <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline-success" disabled={busy || !account.persona}
                      onClick={() => account.persona && edit(account.persona)}>Editar datos personales</button>
                    <button type="button" className={`btn ${account.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      disabled={busy || account.id_usuario === user?.id_usuario}
                      onClick={() => setStatusTarget(account)}>{account.activo ? 'Dar de baja' : 'Reactivar'}</button>
                  </div>}
                  {user?.rol === 'SUPER_ADMIN' && account.id_usuario === user?.id_usuario && <p className="small text-muted mt-2 mb-0">Tu cuenta: podés corregir tus datos, pero no darte de baja.</p>}
                </article>
              </div>
            ))}
          </div>
          {total === 0 && <p>No hay registros disponibles en tu alcance.</p>}
        </>
      )}
      <nav className="d-flex flex-wrap gap-3 align-items-center justify-content-center mt-3" aria-label="Páginas de administración de accesos">
        <button type="button" className="btn btn-outline-secondary" disabled={loading || busy || page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
        <span>Página {page} de {Math.max(1, pages)}</span>
        <button type="button" className="btn btn-outline-secondary" disabled={loading || busy || page >= pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
      </nav>
      <ConfirmationModal open={!!statusTarget} title={statusTarget?.activo ? 'Dar de baja la cuenta' : 'Reactivar cuenta'}
        message={`${statusTarget?.nombre_usuario ?? ''}: ${statusTarget?.activo ? 'se impedirá el acceso y se revocarán sus sesiones. Sus datos se conservarán.' : 'podrá volver a ingresar.'}`}
        confirmText="Confirmar" loading={busy} onClose={() => { if (!busy) setStatusTarget(null); }} onConfirm={() => void changeStatus()} />
      <ConfirmationModal open={confirmSave} title="Guardar datos personales" message="Confirmá la corrección de los datos de esta persona."
        confirmText="Guardar" loading={busy} onClose={() => { if (!busy) setConfirmSave(false); }} onConfirm={() => void savePerson()} />
    </section>
  );
}
