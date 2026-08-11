import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_SESIONES, MOCK_ASISTENCIAS } from '../../shared/mocks/mockData';

export function useSesionesEstudiante(idPostulante, idGrupo) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSesiones = useCallback(() => {
    if (!idPostulante || !idGrupo) {
      setSesiones([]);
      return;
    }
    setLoading(true);
    setError(null);

    // TODO: quitar mock - consulta real desactivada para capturas
    // db.select('VW_ASISTENCIAS_POSTULANTE', { ID_POSTULANTE: idPostulante, ID_GRUPO: idGrupo })
    //   .then(data => { ... })

    const sesionesDelGrupo = MOCK_SESIONES.filter(s => s.ID_GRUPO === idGrupo);
    const data = sesionesDelGrupo.map(s => {
      const asistencia = MOCK_ASISTENCIAS[`${idPostulante}_${s.ID_SESION}`] || { ESTADO_ASISTENCIA: '-' };
      return {
        ID_ASISTENCIA: asistencia.ID_ASISTENCIA || 0,
        ID_SESION: s.ID_SESION,
        FECHA: s.FECHA,
        HORA_INICIO: s.HORA_INICIO,
        HORA_FIN: s.HORA_FIN,
        NOMBRE_CURSO: s.NOMBRE_CURSO,
        CODIGO_CURSO: s.CODIGO_CURSO,
        ESTADO_ASISTENCIA: asistencia.ESTADO_ASISTENCIA,
      };
    });

    const sorted = data.sort((a, b) => {
      if (a.FECHA < b.FECHA) return -1;
      if (a.FECHA > b.FECHA) return 1;
      if (a.HORA_INICIO < b.HORA_INICIO) return -1;
      return 1;
    });
    setSesiones(sorted);
    setLoading(false);
  }, [idPostulante, idGrupo]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return { sesiones, loading, error, refetch: fetchSesiones };
}
