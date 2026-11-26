import { useEffect, useId, useState } from 'react';
import { getZonas } from '../../services/configuracion.service';
import type { Barrio } from '../../types/barrio.types';
import type { Zona } from '../../types/configuracion.types';

interface Props {
  barrios: Barrio[];
  value: string;
  onChange: (idBarrio: string) => void;
  disabled?: boolean;
  zonas?: Zona[];
  selectedZone?: string;
  onZoneChange?: (idZona: string) => void;
  autoSelectSingleZone?: boolean;
}

export default function ZonaBarrioSelect({
  barrios,
  value,
  onChange,
  disabled = false,
  zonas: externalZonas,
  selectedZone: controlledZone,
  onZoneChange,
  autoSelectSingleZone = true,
}: Props) {
  const id = useId();
  const [internalZonas, setInternalZonas] = useState<Zona[]>([]);
  const [internalSelectedZone, setInternalSelectedZone] = useState('');
  const [loading, setLoading] = useState(!externalZonas);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  const hasExternalZonas = Array.isArray(externalZonas);
  const zonas = hasExternalZonas ? externalZonas : internalZonas;

  useEffect(() => {
    if (hasExternalZonas) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);
    void getZonas()
      .then((data) => {
        if (active) setInternalZonas(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [revision, hasExternalZonas]);

  // Si hay una única zona disponible y está habilitada la auto-selección
  useEffect(() => {
    if (autoSelectSingleZone && zonas.length === 1) {
      const singleZoneId = zonas[0].id_zona;
      if (internalSelectedZone !== singleZoneId) {
        setInternalSelectedZone(singleZoneId);
        onZoneChange?.(singleZoneId);
      }
    }
  }, [zonas, autoSelectSingleZone, internalSelectedZone, onZoneChange]);

  // Conserva la zona del barrio guardado al abrir un registro para editar o usa la seleccionada.
  const explicitZone = controlledZone !== undefined ? controlledZone : internalSelectedZone;
  const singleZoneFallback = (autoSelectSingleZone && zonas.length === 1) ? zonas[0].id_zona : '';
  const zone = barrios.find((barrio) => barrio.id_barrio === value)?.id_zona
    ?? (explicitZone || singleZoneFallback);

  const availableBarrios = barrios.filter((barrio) => barrio.id_zona === zone);

  const handleZoneSelect = (newZone: string) => {
    setInternalSelectedZone(newZone);
    onZoneChange?.(newZone);
    onChange('');
  };

  return (
    <div className="row g-2">
      <div className="col-sm-6">
        <label className="form-label" htmlFor={`${id}-zona`}>Zona</label>
        <select
          id={`${id}-zona`}
          className="form-select"
          value={zone}
          disabled={disabled || loading || error || (hasExternalZonas && zonas.length === 1)}
          required
          onChange={(event) => handleZoneSelect(event.target.value)}
        >
          {zonas.length !== 1 && (
            <option value="">{loading ? 'Cargando zonas...' : 'Seleccionar zona'}</option>
          )}
          {zonas.map((z) => (
            <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>
          ))}
        </select>
        {hasExternalZonas && zonas.length === 1 && (
          <small className="text-muted d-block mt-1">
            Zona única autorizada para esta salita
          </small>
        )}
      </div>
      <div className="col-sm-6">
        <label className="form-label" htmlFor={`${id}-barrio`}>Barrio</label>
        <select
          id={`${id}-barrio`}
          className="form-select"
          value={value}
          disabled={disabled || loading || error || !zone}
          required
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">
            {!zone ? 'Seleccionar primero una zona'
              : availableBarrios.length ? 'Seleccionar barrio' : 'No hay barrios autorizados en esta zona'}
          </option>
          {availableBarrios.map((barrio) => (
            <option key={barrio.id_barrio} value={barrio.id_barrio}>{barrio.nombre}</option>
          ))}
        </select>
        {hasExternalZonas && zone && availableBarrios.length > 0 && (
          <small className="text-muted d-block mt-1">
            {availableBarrios.length} barrio{availableBarrios.length === 1 ? '' : 's'} con cobertura
          </small>
        )}
      </div>
      {error && !hasExternalZonas && (
        <div className="col-12" role="alert">
          No se pudieron cargar las zonas.{' '}
          <button type="button" className="btn btn-link p-0" disabled={disabled}
            onClick={() => setRevision((current) => current + 1)}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
