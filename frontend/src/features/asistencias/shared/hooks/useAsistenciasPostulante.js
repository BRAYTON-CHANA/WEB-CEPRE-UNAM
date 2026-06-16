import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

export function useAsistenciasPostulante(idSesion) {
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPostulantes = useCallback(() => {
    if (!idSesion) {
      setPostulantes([]);
      return;
    }

    setLoading(true);
    setError(null);
    db.select('VW_ASISTENCIAS_POSTULANTE', { ID_SESION: idSesion })
      .then(data => setPostulantes(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idSesion]);

  useEffect(() => {
    fetchPostulantes();
  }, [fetchPostulantes]);

  return { postulantes, loading, error, refetch: fetchPostulantes };
}
