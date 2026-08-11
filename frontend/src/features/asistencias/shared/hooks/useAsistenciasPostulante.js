import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_ESTUDIANTES, MOCK_SESIONES, MOCK_ASISTENCIAS } from '../mocks/mockData';

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

    // TODO: quitar mock - consulta real desactivada para capturas
    // db.select('VW_ASISTENCIAS_POSTULANTE', { ID_SESION: idSesion })
    //   .then(data => setPostulantes(data || []))

    const sesion = MOCK_SESIONES.find(s => s.ID_SESION === idSesion);
    const estudiantes = MOCK_ESTUDIANTES.filter(e => e.ID_GRUPO === (sesion?.ID_GRUPO || 0));
    const data = estudiantes.map(e => {
      const key = `${e.ID_POSTULANTE}_${idSesion}`;
      const asistencia = MOCK_ASISTENCIAS[key] || { ESTADO_ASISTENCIA: '-' };
      return {
        ID_POSTULANTE: e.ID_POSTULANTE,
        NOMBRES: e.NOMBRES,
        APELLIDOS: e.APELLIDOS,
        ID_SESION: idSesion,
        ESTADO_ASISTENCIA: asistencia.ESTADO_ASISTENCIA,
      };
    });

    setPostulantes(data);
    setLoading(false);
  }, [idSesion]);

  useEffect(() => {
    fetchPostulantes();
  }, [fetchPostulantes]);

  return { postulantes, loading, error, refetch: fetchPostulantes };
}
