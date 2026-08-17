import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * usePlazasFilters — lógica de filtros para página 2 (Plazas).
 * Solo filtro por convocatoria. Acepta initialConvocatoriaId pre-seleccionado.
 */
export function usePlazasFilters(initialConvocatoriaId = null) {
  const [convocatorias, setConvocatorias] = useState([]);
  const [selectedIdConvocatoria, setSelectedIdConvocatoria] = useState(initialConvocatoriaId || '');
  const [loadingFilters, setLoadingFilters] = useState(false);

  const loadConvocatorias = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const data = await db.select('VW_CONVOCATORIAS', {});
      setConvocatorias(data || []);
    } catch (err) {
      console.error('Error cargando convocatorias:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  // Cargar convocatorias al montar
  useEffect(() => {
    loadConvocatorias();
  }, [loadConvocatorias]);

  const selectedConvocatoriaRow = convocatorias.find(
    c => String(c.ID_CONVOCATORIA) === String(selectedIdConvocatoria)
  ) || null;

  const handleConvocatoriaChange = (e) => {
    setSelectedIdConvocatoria(e.target.value);
  };

  const clearConvocatoria = () => {
    setSelectedIdConvocatoria('');
  };

  return {
    convocatorias,
    selectedIdConvocatoria,
    selectedConvocatoriaRow,
    loadingFilters,
    handleConvocatoriaChange,
    clearConvocatoria,
    refreshConvocatorias: loadConvocatorias,
  };
}
