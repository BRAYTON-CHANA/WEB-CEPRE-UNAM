import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * usePostulantesSesion — estudiantes de una sesión con su estado de asistencia
 * (VW_SESION_ESTUDIANTES_ASISTENCIA), ordenados por apellidos.
 */
export function usePostulantesSesion(idSesion) {
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    if (!idSesion) {
      setPostulantes([]);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return db.select('VW_SESION_ESTUDIANTES_ASISTENCIA', { ID_SESION: idSesion })
      .then(data => {
        const lista = (data || []).slice().sort((a, b) =>
          (a.NOMBRE_COMPLETO || '').localeCompare(b.NOMBRE_COMPLETO || '')
        );
        setPostulantes(lista);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idSesion]);

  useEffect(() => { cargar(); }, [cargar]);

  return { postulantes, loading, error, refetch: cargar };
}
