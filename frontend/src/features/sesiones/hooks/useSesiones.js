import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * Todas las sesiones del período (vista admin).
 * Trae VW_SESIONES_COMPLETA completa — los filtros se aplican en cliente.
 */
export function useSesiones(idPeriodo) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!idPeriodo) {
      setSesiones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await db.select('VW_SESIONES_COMPLETA', { ID_PERIODO: idPeriodo }) || [];
      data.sort((a, b) =>
        (a.FECHA || '').localeCompare(b.FECHA || '') ||
        (a.CODIGO_GRUPO || '').localeCompare(b.CODIGO_GRUPO || '') ||
        (a.HORA_INICIO || '').localeCompare(b.HORA_INICIO || '')
      );
      setSesiones(data);
    } catch (err) {
      setError(err.message || 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [idPeriodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sesiones, loading, error, refetch: fetchData };
}
