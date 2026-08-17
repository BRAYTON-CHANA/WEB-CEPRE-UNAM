import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { createPostulacion, cargarTodosLosDocentes } from '../services/postulacionesService';

/**
 * Hook para cargar postulaciones por convocatoria_curso.
 * Acepta un objeto `convocatoriaCurso` con ID_CONVOCATORIA_CURSO,
 * o retrocompat con `plaza` (deriva ID_CONVOCATORIA_CURSO desde la plaza).
 */
export function usePostulacionesPlaza(convocatoriaCurso) {
  const idConvocatoriaCurso = convocatoriaCurso?.ID_CONVOCATORIA_CURSO;

  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idConvocatoriaCurso) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_POSTULACIONES_PLAZA', { ID_CONVOCATORIA_CURSO: idConvocatoriaCurso });
      setPostulaciones(data || []);
    } catch (err) {
      setError(err);
      console.error('Error cargando postulaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [idConvocatoriaCurso]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    cacheService.invalidateAll();
    load();
  }, [load]);

  const create = useCallback(async (data, formData) => {
    const result = await createPostulacion(data, formData);
    refresh();
    return result;
  }, [refresh]);

  const loadAllDocentes = useCallback(async () => {
    if (!idConvocatoriaCurso) return;
    setBulkLoading(true);
    try {
      const result = await cargarTodosLosDocentes(idConvocatoriaCurso);
      refresh();
      return result;
    } finally {
      setBulkLoading(false);
    }
  }, [idConvocatoriaCurso, refresh]);

  return {
    postulaciones,
    loading,
    error,
    bulkLoading,
    refresh,
    create,
    loadAllDocentes,
  };
}
