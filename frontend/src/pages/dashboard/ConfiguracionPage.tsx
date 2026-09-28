import { useAuth } from '../../context/AuthContext';
import { roleLabels } from '../../components/layout/sidebar-menu';

export default function ConfiguracionPage() {
  const { user } = useAuth();
  return <section className="dashboard-panel">
    <div className="dashboard-panel-header"><h1 className="h3 mb-0">Configuración</h1></div>
    <div className="p-4">
      <dl><dt>Cuenta</dt><dd>{user?.email}</dd><dt>Rol</dt><dd>{roleLabels[user?.rol ?? '']}</dd></dl>
      <p className="text-muted mb-0">Todavía no hay ajustes editables disponibles en esta sección.</p>
    </div>
  </section>;
}
