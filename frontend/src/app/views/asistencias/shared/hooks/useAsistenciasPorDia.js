import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

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
      // 1. Cargar estudiantes del grupo
      const estudiantesData = await db.select('VW_RESUMEN_ASISTENCIAS_POSTULANTE', { ID_GRUPO: idGrupo });
      const estudiantesOrdenados = (estudiantesData || [])
        .map(e => ({
          ID_POSTULANTE: e.ID_POSTULANTE,
          NOMBRES: e.NOMBRES,
          APELLIDOS: e.APELLIDOS,
        }))
        .sort((a, b) => a.APELLIDOS?.localeCompare(b.APELLIDOS || '') || 0);

      // 2. Cargar sesiones del día para el grupo desde VW_SESIONES_COMPLETA
      // Esta vista incluye nombres de cursos y permite filtrar por fecha y grupo
      const sesionesData = await db.select('VW_SESIONES_COMPLETA', { 
        FECHA: fecha, 
        ID_GRUPO: idGrupo 
      });
      const sesionesDelGrupo = (sesionesData || [])
        .map(s => ({
          ID_SESION: s.ID_SESION,
          ID_GRUPO_PLAN_CURSO: s.ID_GRUPO_PLAN_CURSO,
          NOMBRE_CURSO: s.NOMBRE_CURSO || 'Curso',
          CODIGO_CURSO: s.CODIGO_CURSO,
          HORA_INICIO: s.HORA_INICIO,
          HORA_FIN: s.HORA_FIN,
        }))
        .sort((a, b) => a.HORA_INICIO?.localeCompare(b.HORA_INICIO || '') || 0);

      // 3. Cargar asistencias existentes para estas sesiones
      const asistenciasMap = {};
      if (sesionesDelGrupo.length > 0) {
        // Cargar asistencias de todas las sesiones
        const idsSesiones = sesionesDelGrupo.map(s => s.ID_SESION);
        
        // Para cada sesión, cargar sus asistencias
        for (const idSesion of idsSesiones) {
          const asistenciasData = await db.select('ASISTENCIAS_POSTULANTE', { ID_SESION: idSesion });
          (asistenciasData || []).forEach(a => {
            const key = `${a.ID_POSTULANTE}_${a.ID_SESION}`;
            asistenciasMap[key] = {
              ID_ASISTENCIA: a.ID_ASISTENCIA,
              ESTADO_ASISTENCIA: a.ESTADO_ASISTENCIA,
              ID_POSTULANTE: a.ID_POSTULANTE,
              ID_SESION: a.ID_SESION,
            };
          });
        }
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
