import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAdminSalitas } from '../../../services/salitas.service';
import {
  getMetricasInasistencias,
  type MetricasInasistencias,
} from '../../../services/inasistencias.service';
import type { Salita } from '../../../types/salita.types';

import { JustificacionesPendientesTab } from './tabs/JustificacionesPendientesTab';
import { HistorialJustificacionesTab } from './tabs/HistorialJustificacionesTab';
import { CancelacionesTab } from './tabs/CancelacionesTab';
import { InasistenciasRegistradasTab } from './tabs/InasistenciasRegistradasTab';
import { RectificacionesTab } from './tabs/RectificacionesTab';
import { AdvertenciasRestriccionesTab } from './tabs/AdvertenciasRestriccionesTab';

type TabKey =
  | 'pendientes'
  | 'historial'
  | 'cancelaciones'
  | 'inasistencias'
  | 'rectificaciones'
  | 'advertencias';

const VALID_TABS: TabKey[] = [
  'pendientes',
  'historial',
  'cancelaciones',
  'inasistencias',
  'rectificaciones',
  'advertencias',
];

export default function GestionInasistenciasPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'pendientes'
  );
  const [salitas, setSalitas] = useState<Salita[]>([]);
  const [idSalitaSeleccionada, setIdSalitaSeleccionada] = useState<string>('');
  const [metricas, setMetricas] = useState<MetricasInasistencias>({
    justificaciones_pendientes: 0,
    inasistencias_registradas: 0,
    advertencias_vigentes: 0,
  });

  // Sincroniza la pestaña activa si cambia el parámetro de URL
  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null;
    if (t && VALID_TABS.includes(t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const cargarMetricas = useCallback(async () => {
    try {
      const data = await getMetricasInasistencias();
      setMetricas(data);
    } catch {
      // Ignorar fallas silenciosas en la recarga de métricas
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getAdminSalitas(true)
      .then((res) => {
        if (active) {
          setSalitas(res.data);
          // Si el usuario administra solo una salita, preseleccionarla
          if (res.data.length === 1 && res.data[0]) {
            setIdSalitaSeleccionada(res.data[0].id_salita);
          }
        }
      })
      .catch(() => {});

    void cargarMetricas();

    return () => {
      active = false;
    };
  }, [cargarMetricas]);

  return (
    <div className="container-fluid py-4 px-lg-4">
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">
            <i className="bi bi-calendar-x text-primary me-2"></i>
            Gestión de Inasistencias
          </h1>
          <p className="text-muted mb-0 small">
            Supervisión y resolución de justificaciones, cancelaciones, inasistencias y política progresiva.
          </p>
        </div>

        {/* Selector de Salita (Multi-tenancy / Scope) */}
        {salitas.length > 1 && (
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small fw-semibold text-muted text-nowrap">
              <i className="bi bi-hospital me-1"></i>
              Filtrar por salita:
            </label>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '220px' }}
              value={idSalitaSeleccionada}
              onChange={(e) => setIdSalitaSeleccionada(e.target.value)}
            >
              {user?.rol === 'SUPER_ADMIN' && <option value="">Todas las salitas</option>}
              {salitas.map((s) => (
                <option key={s.id_salita} value={s.id_salita}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <ul className="nav nav-tabs nav-justified inasistencias-tabs shadow-sm" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pendientes' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'pendientes'}
            onClick={() => handleTabChange('pendientes')}
          >
            <i className="bi bi-inbox tab-icon" aria-hidden="true"></i>
            <span className="tab-label">
              Justificaciones <span className="text-nowrap">pendientes
                {metricas.justificaciones_pendientes > 0 && (
                  <span className="badge rounded-pill bg-danger tab-badge">
                    {metricas.justificaciones_pendientes}
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'historial' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'historial'}
            onClick={() => handleTabChange('historial')}
          >
            <i className="bi bi-clock-history tab-icon" aria-hidden="true"></i>
            <span className="tab-label">Historial de justificaciones</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'cancelaciones' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelaciones'}
            onClick={() => handleTabChange('cancelaciones')}
          >
            <i className="bi bi-slash-circle tab-icon" aria-hidden="true"></i>
            <span className="tab-label">Cancelaciones</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'inasistencias' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'inasistencias'}
            onClick={() => handleTabChange('inasistencias')}
          >
            <i className="bi bi-calendar2-x tab-icon" aria-hidden="true"></i>
            <span className="tab-label">
              Inasistencias <span className="text-nowrap">registradas
                {metricas.inasistencias_registradas > 0 && (
                  <span className="badge rounded-pill bg-secondary tab-badge">
                    {metricas.inasistencias_registradas}
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'rectificaciones' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'rectificaciones'}
            onClick={() => handleTabChange('rectificaciones')}
          >
            <i className="bi bi-check2-circle tab-icon" aria-hidden="true"></i>
            <span className="tab-label">Rectificaciones</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'advertencias' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'advertencias'}
            onClick={() => handleTabChange('advertencias')}
          >
            <i className="bi bi-shield-exclamation tab-icon" aria-hidden="true"></i>
            <span className="tab-label">
              Advertencias y <span className="text-nowrap">restricciones
                {metricas.advertencias_vigentes > 0 && (
                  <span className="badge rounded-pill bg-warning text-dark tab-badge">
                    {metricas.advertencias_vigentes}
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
      </ul>

      {/* Contenido de la pestaña activa */}
      <div className="tab-content">
        {activeTab === 'pendientes' && (
          <JustificacionesPendientesTab
            idSalitaFiltro={idSalitaSeleccionada}
            onActualizado={cargarMetricas}
          />
        )}
        {activeTab === 'historial' && (
          <HistorialJustificacionesTab idSalitaFiltro={idSalitaSeleccionada} />
        )}
        {activeTab === 'cancelaciones' && (
          <CancelacionesTab idSalitaFiltro={idSalitaSeleccionada} />
        )}
        {activeTab === 'inasistencias' && (
          <InasistenciasRegistradasTab
            idSalitaFiltro={idSalitaSeleccionada}
            onActualizado={cargarMetricas}
          />
        )}
        {activeTab === 'rectificaciones' && (
          <RectificacionesTab idSalitaFiltro={idSalitaSeleccionada} />
        )}
        {activeTab === 'advertencias' && (
          <AdvertenciasRestriccionesTab
            idSalitaFiltro={idSalitaSeleccionada}
            onActualizado={cargarMetricas}
          />
        )}
      </div>
    </div>
  );
}
