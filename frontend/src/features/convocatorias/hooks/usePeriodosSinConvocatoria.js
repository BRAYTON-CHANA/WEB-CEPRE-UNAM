import { useState, useEffect, useCallback } from 'react';
import { getPeriodosSinConvocatoria } from '@/features/convocatorias/services/convocatoriasService';

/**
 * usePeriodosSinConvocatoria — carga periodos activos sin convocatoria.
 * Usado en el formulario de creación de convocatoria (paso 1).
 */
export function usePeriodosSinConvocatoria() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeriodosSinConvocatoria();
      setPeriodos(data || []);
    } catch (err) {
      console.error('Error cargando periodos sin convocatoria:', err);
      setError(err);
      setPeriodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    periodos,
    loading,
    error,
    refresh: load,
  };
}
