import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_ESTUDIANTES, MOCK_SESIONES, MOCK_ASISTENCIAS } from '../mocks/mockData';

export function useAsistenciasPorDia(fecha, idGrupo) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    if (!fecha || !idGrupo) {
      setEstudiantes([]);
      setSesiones([]);
      setAsistencias({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: quitar mock - consultas reales desactivadas para capturas
      // const estudiantesData = await db.select(...);
      // const sesionesData = await db.select(...);
      // const asistenciasData = await db.select(...);

      // 1. Cargar estudiantes del grupo
      const estudiantesOrdenados = MOCK_ESTUDIANTES
        .filter(e => e.ID_GRUPO === idGrupo)
        .map(e => ({
          ID_POSTULANTE: e.ID_POSTULANTE,
          NOMBRES: e.NOMBRES,
          APELLIDOS: e.APELLIDOS,
        }))
        .sort((a, b) => a.APELLIDOS?.localeCompare(b.APELLIDOS || '') || 0);

      // 2. Cargar sesiones del día para el grupo
      const sesionesDelGrupo = MOCK_SESIONES
        .filter(s => s.FECHA === fecha && s.ID_GRUPO === idGrupo)
        .map(s => ({
          ID_SESION: s.ID_SESION,
          ID_GRUPO_PLAN_CURSO: s.ID_GRUPO_PLAN_CURSO || s.ID_SESION,
          NOMBRE_CURSO: s.NOMBRE_CURSO || 'Curso',
          CODIGO_CURSO: s.CODIGO_CURSO,
          HORA_INICIO: s.HORA_INICIO,
          HORA_FIN: s.HORA_FIN,
        }))
        .sort((a, b) => a.HORA_INICIO?.localeCompare(b.HORA_INICIO || '') || 0);

      // 3. Cargar asistencias existentes para estas sesiones
      const asistenciasMap = {};
      if (sesionesDelGrupo.length > 0) {
        Object.entries(MOCK_ASISTENCIAS).forEach(([key, a]) => {
          const sesion = sesionesDelGrupo.find(s => s.ID_SESION === a.ID_SESION);
          const estudiante = estudiantesOrdenados.find(e => e.ID_POSTULANTE === a.ID_POSTULANTE);
          if (sesion && estudiante) {
            asistenciasMap[key] = {
              ID_ASISTENCIA: a.ID_ASISTENCIA,
              ESTADO_ASISTENCIA: a.ESTADO_ASISTENCIA,
              ID_POSTULANTE: a.ID_POSTULANTE,
              ID_SESION: a.ID_SESION,
            };
          }
        });
      }

      setEstudiantes(estudiantesOrdenados);
      setSesiones(sesionesDelGrupo);
      setAsistencias(asistenciasMap);
    } catch (err) {
      console.error('Error cargando datos de asistencia por día:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [fecha, idGrupo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Función para obtener asistencia de un estudiante en una sesión
  const getAsistencia = useCallback((idPostulante, idSesion) => {
    const key = `${idPostulante}_${idSesion}`;
    return asistencias[key] || null;
  }, [asistencias]);

  // Función para actualizar asistencia localmente
  const updateAsistencia = useCallback((idPostulante, idSesion, estado, idAsistencia = null) => {
    const key = `${idPostulante}_${idSesion}`;
    setAsistencias(prev => ({
      ...prev,
      [key]: {
        ID_ASISTENCIA: idAsistencia || prev[key]?.ID_ASISTENCIA || null,
        ESTADO_ASISTENCIA: estado,
        ID_POSTULANTE: idPostulante,
        ID_SESION: idSesion,
        _modified: true, // flag para saber qué cambiar
      }
    }));
  }, []);

  // Función para obtener todas las asistencias modificadas
  const getModifiedAsistencias = useCallback(() => {
    return Object.values(asistencias).filter(a => a._modified);
  }, [asistencias]);

  return {
    estudiantes,
    sesiones,
    asistencias,
    loading,
    error,
    refetch: cargarDatos,
    getAsistencia,
    updateAsistencia,
    getModifiedAsistencias,
  };
}
