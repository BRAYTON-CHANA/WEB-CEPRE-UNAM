import { useCallback } from 'react';
import { transformToCustomBlocks, transformToEvents } from '../utils/transformers';
import cacheService from '@/shared/services/cacheService';

/**
 * Custom hook para manejar las operaciones de asignación de horario
 */
export const useAsignacionHorarioHandlers = (
  setSelectedIdGrupo,
  setSelectedGrupoNombre,
  setLoadingCalendar,
  setCustomBlocks,
  setCalendarStartHour,
  setCalendarFinalHour,
  setAsignacionHorarioData,
  setEvents,
  setIdHorario,
  setSelectedBlocks,
  setSelectionMode,
  setSelectedCurso,
  setShowConfirmModal,
  setConfirmModalData,
  selectedBlocks,
  selectedCurso,
  idHorario,
  selectedGrupoNombre,
  setDeleteMode = null
) => {
  /**
   * Cargar el horario de un grupo
   */
  const handleViewHorario = useCallback(async (row) => {
    const idGrupo = row.ID_GRUPO;
    const idTurno = row.ID_TURNO;
    const nombreGrupo = row.NOMBRE_GRUPO;

    setSelectedIdGrupo(idGrupo);
    setSelectedGrupoNombre(nombreGrupo);
    setLoadingCalendar(true);

    try {
      // Paso 1: Obtener ID_HORARIO del turno
      const turnoFilters = JSON.stringify([{ field: 'ID_TURNO', op: '=', value: idTurno }]);
      const turnoResponse = await fetch(`http://localhost:3001/api/tables/TURNOS?filters=${encodeURIComponent(turnoFilters)}`);
      const turnoData = await turnoResponse.json();

      if (!turnoData?.data?.records || turnoData.data.records.length === 0) {
        console.error('No se encontró el turno');
        setLoadingCalendar(false);
        return;
      }

      const idHorario = turnoData.data.records[0].ID_HORARIO;
      setIdHorario(idHorario);

      // Paso 2: Obtener bloques del horario
      const bloquesFilters = JSON.stringify([{ field: 'ID_HORARIO', op: '=', value: idHorario }]);
      const bloquesResponse = await fetch(`http://localhost:3001/api/tables/VW_HORARIO_BLOQUES?filters=${encodeURIComponent(bloquesFilters)}`);
      const bloquesData = await bloquesResponse.json();

      // Transformar bloques
      const transformedBlocks = transformToCustomBlocks(bloquesData);
      setCustomBlocks(transformedBlocks);

      // Extraer horas de jornada
      if (bloquesData?.data?.records?.length > 0) {
        const firstRecord = bloquesData.data.records[0];
        const startTimeParts = firstRecord.HORA_INICIO_JORNADA.split(':');
        const finalTimeParts = firstRecord.HORA_FIN_JORNADA.split(':');
        const startHour = parseInt(startTimeParts[0]) + parseInt(startTimeParts[1]) / 60;
        const finalHour = parseInt(finalTimeParts[0]) + parseInt(finalTimeParts[1]) / 60;
        setCalendarStartHour(startHour);
        setCalendarFinalHour(finalHour);
      }

      console.log('Bloques del horario:', transformedBlocks);

      // Paso 3: Obtener datos de VW_ASIGNACION_HORARIO filtrado por grupo
      try {
        const asignacionFilters = JSON.stringify([{ field: 'ID_GRUPO', op: '=', value: idGrupo }]);
        const asignacionResponse = await fetch(`http://localhost:3001/api/tables/VW_ASIGNACION_HORARIO?filters=${encodeURIComponent(asignacionFilters)}`);
        const asignacionData = await asignacionResponse.json();
        setAsignacionHorarioData(asignacionData);
        console.log('Datos de VW_ASIGNACION_HORARIO:', asignacionData);

        // Transformar a eventos del Calendar
        const transformedEvents = transformToEvents(asignacionData);
        setEvents(transformedEvents);
        console.log('Eventos transformados:', transformedEvents);
      } catch (error) {
        console.error('Error al cargar VW_ASIGNACION_HORARIO:', error);
      }
    } catch (error) {
      console.error('Error al cargar horario:', error);
    } finally {
      setLoadingCalendar(false);
    }
  }, [
    setSelectedIdGrupo,
    setSelectedGrupoNombre,
    setLoadingCalendar,
    setCustomBlocks,
    setCalendarStartHour,
    setCalendarFinalHour,
    setAsignacionHorarioData,
    setEvents,
    setIdHorario
  ]);

  /**
   * Cargar horario solo con ID_GRUPO: fetch VW_GRUPOS para ID_TURNO + NOMBRE_GRUPO
   * y delegar en handleViewHorario.
   */
  const loadHorarioByGrupoId = useCallback(async (idGrupo) => {
    if (!idGrupo) return;
    try {
      const filters = JSON.stringify([{ field: 'ID_GRUPO', op: '=', value: idGrupo }]);
      const response = await fetch(`http://localhost:3001/api/tables/VW_GRUPOS?filters=${encodeURIComponent(filters)}`);
      const data = await response.json();
      const record = data?.data?.records?.[0];
      if (!record) {
        console.error('No se encontró el grupo con ID', idGrupo);
        return;
      }
      await handleViewHorario({
        ID_GRUPO: record.ID_GRUPO,
        ID_TURNO: record.ID_TURNO,
        NOMBRE_GRUPO: record.NOMBRE_GRUPO
      });
    } catch (error) {
      console.error('Error al cargar grupo:', error);
    }
  }, [handleViewHorario]);

  /**
   * Reset de la vista de horario (al cambiar Periodo/Sede o limpiar Grupo)
   */
  const resetHorario = useCallback(() => {
    setSelectedIdGrupo(null);
    setSelectedGrupoNombre(null);
    setCustomBlocks(null);
    setAsignacionHorarioData(null);
    setEvents(null);
    setSelectedBlocks([]);
    setSelectionMode(false);
    setIdHorario(null);
    setSelectedCurso(null);
    setShowConfirmModal(false);
    setConfirmModalData(null);
  }, [
    setSelectedIdGrupo,
    setSelectedGrupoNombre,
    setCustomBlocks,
    setAsignacionHorarioData,
    setEvents,
    setSelectedBlocks,
    setSelectionMode,
    setIdHorario,
    setSelectedCurso,
    setShowConfirmModal,
    setConfirmModalData
  ]);

  /**
   * Toggle del modo de selección
   */
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) {
        setSelectedBlocks([]);
        setSelectedCurso(null);
        setShowConfirmModal(false);
        setConfirmModalData(null);
        return false;
      } else {
        setDeleteMode?.(false);
        return true;
      }
    });
  }, [setSelectedBlocks, setSelectedCurso, setShowConfirmModal, setConfirmModalData, setSelectionMode, setDeleteMode]);

  /**
   * Confirmar asignación de bloques
   */
  const handleConfirm = useCallback(async () => {
    if (!selectedCurso || !idHorario || selectedBlocks.length === 0) {
      return;
    }

    try {
      // Obtener todos los bloques del horario con horas calculadas
      const bloquesFilters = JSON.stringify([{ field: 'ID_HORARIO', op: '=', value: idHorario }]);
      const bloquesResponse = await fetch(`http://localhost:3001/api/tables/VW_HORARIO_BLOQUES?filters=${encodeURIComponent(bloquesFilters)}`);
      const bloquesData = await bloquesResponse.json();

      if (!bloquesData?.data?.records) {
        console.error('No se encontraron bloques del horario');
        return;
      }

      // Crear mapa ORDEN -> datos del bloque
      const ordenToBloqueMap = {};
      bloquesData.data.records.forEach(record => {
        ordenToBloqueMap[record.ORDEN] = {
          ID_BLOQUE: record.ID_BLOQUE,
          HORA_INICIO_CALCULADA: record.HORA_INICIO_CALCULADA,
          HORA_FIN_CALCULADA: record.HORA_FIN_CALCULADA,
          HORA_INICIO_MINUTOS: record.HORA_INICIO_MINUTOS
        };
      });

      // Obtener nombre del curso usando la vista VW_GRUPO_PLAN_CURSO
      let nombreCurso = 'Curso no encontrado';
      try {
        const cursoFilters = JSON.stringify([{ field: 'ID_GRUPO_PLAN_CURSO', op: '=', value: selectedCurso }]);
        const cursoResponse = await fetch(`http://localhost:3001/api/tables/VW_GRUPO_PLAN_CURSO?filters=${encodeURIComponent(cursoFilters)}`);
        const cursoData = await cursoResponse.json();
        if (cursoData?.data?.records?.length > 0) {
          nombreCurso = cursoData.data.records[0].NOMBRE_CURSO || 'Curso sin nombre';
        }
      } catch (error) {
        console.error('Error al obtener nombre del curso:', error);
      }

      // Generar array de asignaciones con datos de VW_HORARIO_BLOQUES
      const asignaciones = selectedBlocks.map(block => {
        const orden = block.blockIndex + 1;
        const bloqueData = ordenToBloqueMap[orden];

        // Formatear fecha a DD/MM/YYYY para BD
        const day = String(block.date.getDate()).padStart(2, '0');
        const month = String(block.date.getMonth() + 1).padStart(2, '0');
        const year = block.date.getFullYear();
        const fechaSql = `${day}/${month}/${year}`;

        return {
          ID_GRUPO_PLAN_CURSO: selectedCurso,
          ID_HORARIO_BLOQUE: bloqueData.ID_BLOQUE,
          FECHA: fechaSql,
          FECHA_DATE: block.date, // Objeto Date para el modal
          ORDEN: orden,
          HORA_INICIO_CALCULADA: bloqueData.HORA_INICIO_CALCULADA,
          HORA_FIN_CALCULADA: bloqueData.HORA_FIN_CALCULADA,
          HORA_INICIO_MINUTOS: bloqueData.HORA_INICIO_MINUTOS
        };
      });

      // Mostrar modal de confirmación
      setConfirmModalData({
        asignaciones,
        nombreCurso,
        nombreGrupo: selectedGrupoNombre
      });
      setShowConfirmModal(true);
      console.log('Asignaciones generadas:', asignaciones);
    } catch (error) {
      console.error('Error al generar asignaciones:', error);
    }
  }, [selectedCurso, idHorario, selectedBlocks, setConfirmModalData, setShowConfirmModal, selectedGrupoNombre]);

  /**
   * Insertar asignaciones en la base de datos
   */
  const handleInsertAsignaciones = useCallback(async (asignaciones) => {
    try {
      const results = [];
      for (const asignacion of asignaciones) {
        const response = await fetch('http://localhost:3001/api/tables/ASIGNACION_HORARIO', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ID_GRUPO_PLAN_CURSO: asignacion.ID_GRUPO_PLAN_CURSO,
            ID_HORARIO_BLOQUE: asignacion.ID_HORARIO_BLOQUE,
            FECHA: asignacion.FECHA
          })
        });
        const result = await response.json();
        results.push(result);
      }
      console.log('Asignaciones insertadas:', results);
      // Invalidar cache para que selects/calendarios dependientes se refresquen
      cacheService.invalidateAll();
      return results;
    } catch (error) {
      console.error('Error al insertar asignaciones:', error);
      throw error;
    }
  }, []);

  /**
   * Eliminar una asignación individual por ID
   */
  const handleDeleteAsignacion = useCallback(async (eventId) => {
    if (!eventId) return;

    const match = eventId.match(/asignacion-(\d+)/);
    if (!match) {
      console.error('ID de evento inválido:', eventId);
      return;
    }

    const asignacionId = parseInt(match[1]);

    try {
      const response = await fetch(`http://localhost:3001/api/tables/ASIGNACION_HORARIO/${asignacionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Error al eliminar asignación');
      }
      console.log('Asignación eliminada:', asignacionId);
      cacheService.invalidateAll();
      return asignacionId;
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      throw error;
    }
  }, []);

  /**
   * Limpiar todas las asignaciones de un grupo
   */
  const handleClearAsignaciones = useCallback(async (idGrupo) => {
    if (!idGrupo) return;

    try {
      const filters = JSON.stringify([{ field: 'ID_GRUPO', op: '=', value: idGrupo }]);
      const response = await fetch(`http://localhost:3001/api/tables/VW_ASIGNACION_HORARIO?filters=${encodeURIComponent(filters)}`);
      const data = await response.json();

      if (!data?.data?.records || data.data.records.length === 0) {
        console.log('No hay asignaciones para limpiar');
        return 0;
      }

      const asignacionIds = data.data.records.map(r => r.ID_ASIGNACION_HORARIO);
      let deletedCount = 0;

      for (const id of asignacionIds) {
        const deleteResponse = await fetch(`http://localhost:3001/api/tables/ASIGNACION_HORARIO/${id}`, {
          method: 'DELETE'
        });
        if (deleteResponse.ok) {
          deletedCount++;
        }
      }

      console.log(`Eliminadas ${deletedCount} asignaciones del grupo ${idGrupo}`);
      cacheService.invalidateAll();
      return deletedCount;
    } catch (error) {
      console.error('Error al limpiar asignaciones:', error);
      throw error;
    }
  }, []);

  return {
    handleViewHorario,
    loadHorarioByGrupoId,
    resetHorario,
    toggleSelectionMode,
    handleConfirm,
    handleInsertAsignaciones,
    handleDeleteAsignacion,
    handleClearAsignaciones
  };
};
