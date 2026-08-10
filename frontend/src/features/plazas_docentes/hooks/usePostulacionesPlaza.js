import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { createPostulacion, cargarTodosLosDocentes } from '../services/postulacionesService';

export function usePostulacionesPlaza(plaza) {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    if (!plaza?.ID_PLAZA_DOCENTE) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_POSTULACIONES_PLAZA', { ID_PLAZA_DOCENTE: plaza.ID_PLAZA_DOCENTE });
      setPostulaciones(data || []);
    } catch (err) {
      setError(err);
      console.error('Error cargando postulaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [plaza?.ID_PLAZA_DOCENTE]);

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
    if (!plaza?.ID_PLAZA_DOCENTE) return;
    setBulkLoading(true);
    try {
      const result = await cargarTodosLosDocentes(plaza.ID_PLAZA_DOCENTE);
      refresh();
      return result;
    } finally {
      setBulkLoading(false);
    }
  }, [plaza?.ID_PLAZA_DOCENTE, refresh]);

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
