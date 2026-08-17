import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Hook para cargar VW_CONVOCATORIAS (nivel 1).
 * Los children (VW_CONVOCATORIAS_CURSO) se cargan on-demand via useMultiLevelFetch.
 */
export function useConvocatorias() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_CONVOCATORIAS', {});
      setConvocatorias(data || []);
    } catch (err) {
      setError(err);
      console.error('Error cargando convocatorias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    cacheService.invalidateAll();
    load();
  }, [load]);

  return { convocatorias, loading, error, refresh };
}
