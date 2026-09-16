import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/shared/api';
import { transformRecords } from '../config/transformers';

const parseConflict = (message) => {
  const text = message || '';
  const docenteMatch = text.match(/\[SOLAPAMIENTO_DOCENTE\]\s*([^\r\n]+)/);
  const plazaMatch = text.match(/\[SOLAPAMIENTO_PLAZA\]\s*([^\r\n]+)/);
  const parts = (docenteMatch?.[1] || plazaMatch?.[1] || '').split('|');

  if (docenteMatch && parts.length >= 9) {
    return {
      tipo: 'SOLAPAMIENTO_DOCENTE',
      titulo: 'Docente ya asignado',
      docente: { id: parts[0], nombre: parts[1] },
      cursoIntentado: parts[2],
      cursoExistente: parts[3],
      grupo: { nombre: parts[4], codigo: parts[5] },
      diaIdx: parts[6],
      bloqueOrden: parts[7],
      fechas: parts[8]?.split(', ') || [],
      identificador: parts[9] || '',
      horaActual: parts[10] || '',
      horaConflicto: parts[11] || ''
    };
  }

  if (plazaMatch && parts.length >= 8) {
    return {
      tipo: 'SOLAPAMIENTO_PLAZA',
      titulo: 'Plaza ya asignada',
      cursoIntentado: parts[0],
      cursoExistente: parts[1],
      grupo: { nombre: parts[2], codigo: parts[3] },
      docente: { nombres: parts[4], apellidos: parts[5] },
      diaIdx: parts[6],
      bloqueOrden: parts[7],
      fechas: parts[8]?.split(', ') || [],
      horaActual: parts[9] || '',
      horaConflicto: parts[10] || ''
    };
  }

  return null;
};

/**
 * useProgramacionGrupo — adaptado para recibir filtros externos compartidos.
 * Ya no maneja selectorValues internos; los filtros vienen del wrapper de Grupos.
 *
 * Props:
 *   sharedGrupo — ID del grupo seleccionado (string/number). Si está vacío, no carga nada.
 */
export function useProgramacionGrupo({ sharedGrupo } = {}) {
  const [customBlocks, setCustomBlocks] = useState(null);
  const [matrix, setMatrix]             = useState(null);
  const [grupoNombre, setGrupoNombre]   = useState(null);
  const [cellEvents, setCellEvents]     = useState({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [bloqueMap, setBloqueMap]       = useState({});
  const [columnDates, setColumnDates]   = useState([]);

  const [conflictError, setConflictError]  = useState(null);
  const [advertenciaHoras, setAdvertenciaHoras] = useState(null);
  const [deleteMode, setDeleteMode]       = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [draftAssignments, setDraftAssignments] = useState({});
  const [selectedCurso, setSelectedCurso] = useState('');
  const [batchConflict, setBatchConflict] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [coursesVersion, setCoursesVersion] = useState(0);
  const [estadisticasOpen, setEstadisticasOpen] = useState(false);
  const selectedCells = useMemo(() => new Set(Object.keys(draftAssignments)), [draftAssignments]);

  // ===== Estado de activación de grupo (solo lectura, para display) =====
  const [grupoActivo, setGrupoActivo] = useState(null);

  // ===== Estado del turno del grupo =====
  const [turnoNoConfigurado, setTurnoNoConfigurado] = useState(false);
  const [turnoInactivo, setTurnoInactivo] = useState(false);
  const [turnoNombre, setTurnoNombre] = useState(null);

  const resetPlantilla = useCallback(() => {
    setCustomBlocks(null);
    setMatrix(null);
    setGrupoNombre(null);
    setCellEvents({});
    setBloqueMap({});
    setColumnDates([]);
    setDeleteMode(false);
    setSelectionMode(false);
    setDraftAssignments({});
    setSelectedCurso('');
    setConflictError(null);
    setAdvertenciaHoras(null);
    setBatchConflict(null);
    setBatchResult(null);
    setGrupoActivo(null);
    setTurnoNoConfigurado(false);
    setTurnoInactivo(false);
    setTurnoNombre(null);
  }, []);

  const loadPlantilla = useCallback(async (idGrupo) => {
    if (!idGrupo) {
      resetPlantilla();
      return;
    }
    setLoading(true);
    try {
      // 1. Metadata del grupo (VW_GRUPOS incluye ID_TURNO y TURNO_ACTIVO, null-safe)
      const grupoRows = await db.select('VW_GRUPOS', { ID_GRUPO: Number(idGrupo) }).catch(() => []);
      const grupo = Array.isArray(grupoRows) ? grupoRows[0] : null;

      if (!grupo) {
        resetPlantilla();
        return;
      }

      resetPlantilla();
      setGrupoNombre(`${grupo.CODIGO_GRUPO} - ${grupo.NOMBRE_GRUPO}`);
      setGrupoActivo(grupo.GRUPO_ACTIVO === true || grupo.GRUPO_ACTIVO === 'true' || grupo.GRUPO_ACTIVO === 't');

      // 2. Grupo sin turno → estado dedicado, no cargar programación
      if (grupo.ID_TURNO == null) {
        setTurnoNoConfigurado(true);
        return;
      }

      setTurnoNombre(grupo.NOMBRE_TURNO || null);
      setTurnoInactivo(grupo.TURNO_ACTIVO === false || grupo.TURNO_ACTIVO === 'false' || grupo.TURNO_ACTIVO === 'f');

      // 3. Plantilla (SEMANA=fila, DIA=columna de MATRIZ_DIAS). Las fechas por
      // columna se derivan de MATRIZ_DIAS dentro de transformRecords.
      const records = await db.executeFunction('fn_obtener_programacion_grupo', { p_id_grupo: Number(idGrupo) }).catch(() => []);

      if (!records || records.length === 0) {
        return;
      }

      const { blocks, matrix: mat, grupoNombre: nombre, cellEvents: ce, columnDates: colDates } = transformRecords(records);

      const rawMatrizDbg = records[0]?.MATRIZ_DIAS;
      let matDbg = rawMatrizDbg;
      if (typeof matDbg === 'string') { try { matDbg = JSON.parse(matDbg); } catch { matDbg = null; } }
      console.groupCollapsed('[ProgramacionGrupo]', idGrupo);
      console.log('grupo:', { ID_TURNO: grupo.ID_TURNO, NOMBRE_TURNO: grupo.NOMBRE_TURNO, TURNO_ACTIVO: grupo.TURNO_ACTIVO });
      console.log('records.length:', records.length);
      console.log('MATRIZ_DIAS raw:', rawMatrizDbg);
      console.log('MATRIZ_DIAS dims:', Array.isArray(matDbg) ? `${matDbg.length} x ${Array.isArray(matDbg[0]) ? matDbg[0].length : 0}` : 'no es array');
      console.log('columnDates:', colDates);
      console.log('cellEvents keys:', Object.keys(ce));
      console.groupEnd();

      setCustomBlocks(blocks);
      setMatrix(mat);
      setGrupoNombre(nombre);
      setCellEvents(ce);
      setColumnDates(colDates);

      const bMap = {};
      records.forEach(r => { bMap[r.BLOQUE_ORDEN] = r.ID_BLOQUE; });
      setBloqueMap(bMap);
    } catch (err) {
      console.error('Error al cargar programación del grupo:', err);
      resetPlantilla();
    } finally {
      setLoading(false);
    }
  }, [resetPlantilla]);

  // Cargar plantilla cuando cambia sharedGrupo
  useEffect(() => {
    if (sharedGrupo) {
      loadPlantilla(sharedGrupo);
    } else {
      resetPlantilla();
    }
  }, [sharedGrupo, loadPlantilla, resetPlantilla]);

  const handleStartAdd = () => {
    setDeleteMode(false);
    setSelectionMode(true);
    setDraftAssignments({});
    setSelectedCurso('');
  };

  const handleCancelAdd = () => {
    setSelectionMode(false);
    setDraftAssignments({});
    setSelectedCurso('');
  };

  const handleStartDelete = () => {
    setSelectionMode(false);
    setDeleteMode(true);
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
  };

  const handleOpenEstadisticas = () => setEstadisticasOpen(true);
  const handleCloseEstadisticas = () => setEstadisticasOpen(false);

  const handleCellToggle = useCallback((colIdx, bloqueOrden) => {
    if (!selectedCurso) return;
    const key = `${colIdx}-${bloqueOrden}`;
    setDraftAssignments(prev => {
      const next = { ...prev };
      if (String(next[key]) === String(selectedCurso)) delete next[key];
      else next[key] = Number(selectedCurso);
      return next;
    });
  }, [selectedCurso]);

  const buildBatchPayload = useCallback(() => Object.entries(draftAssignments).map(([key, idGrupoCurso]) => {
    const [colIdx, bloqueOrden] = key.split('-').map(Number);
    return { dia: colIdx + 1, bloque_orden: bloqueOrden, id_grupo_curso: Number(idGrupoCurso) };
  }).sort((a, b) =>
    a.id_grupo_curso - b.id_grupo_curso || a.dia - b.dia || a.bloque_orden - b.bloque_orden
  ), [draftAssignments]);

  const saveBatch = useCallback(async (omitirConflictos) => {
    const payload = buildBatchPayload();
    if (!payload.length || !sharedGrupo) return;
    setSaving(true);
    try {
      const result = await db.executeFunction('fn_asignar_cursos_grupo_batch', {
        p_id_grupo: Number(sharedGrupo),
        p_asignaciones: payload,
        p_omitir_conflictos: omitirConflictos
      });
      setBatchConflict(null);
      setBatchResult(omitirConflictos ? {
        ...result,
        errores: (result?.errores || []).map(error => ({
          ...error,
          detalle: parseConflict(error.mensaje)
        }))
      } : null);
      setSelectionMode(false);
      setDraftAssignments({});
      setSelectedCurso('');
      setCoursesVersion(v => v + 1);
      await loadPlantilla(sharedGrupo);
    } catch (err) {
      if (omitirConflictos) setConflictError(err?.message || 'No se pudo guardar el lote');
      else {
        const message = err?.message || 'Se detectó un conflicto';
        setBatchConflict({ message, detail: parseConflict(message), total: payload.length });
      }
    } finally {
      setSaving(false);
    }
  }, [buildBatchPayload, sharedGrupo, loadPlantilla]);

  const handleConfirmAdd = useCallback(() => saveBatch(false), [saveBatch]);
  const handleRetryBatch = useCallback(() => saveBatch(true), [saveBatch]);
  const handleCloseBatchConflict = useCallback(() => setBatchConflict(null), []);
  const handleClearBatchResult = useCallback(() => setBatchResult(null), []);
  const handleClearDraft = useCallback(() => setDraftAssignments({}), []);

  const handleCellDelete = useCallback(async (event) => {
    if (!sharedGrupo || !event?.dia || !event?.idBloque) return;
    setSaving(true);
    try {
      await db.executeFunction('fn_desasignar_curso_grupo', {
        p_id_grupo: Number(sharedGrupo),
        p_dia: Number(event.dia),
        p_id_bloque: Number(event.idBloque)
      });
      await loadPlantilla(sharedGrupo);
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
    } finally {
      setSaving(false);
    }
  }, [sharedGrupo, loadPlantilla]);

  const showTemplate = !!customBlocks && !!matrix;
  const handleClearConflict = useCallback(() => setConflictError(null), []);
  const handleClearAdvertencia = useCallback(() => setAdvertenciaHoras(null), []);

  return {
    customBlocks,
    matrix,
    grupoNombre,
    cellEvents,
    columnDates,
    loading,
    saving,
    selectionMode,
    deleteMode,
    selectedCells,
    selectedCurso,
    draftAssignments,
    showTemplate,
    conflictError,
    batchConflict,
    batchResult,
    coursesVersion,
    advertenciaHoras,
    estadisticasOpen,
    setSelectedCurso,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleRetryBatch,
    handleCloseBatchConflict,
    handleClearBatchResult,
    handleClearDraft,
    handleCellDelete,
    handleClearConflict,
    handleClearAdvertencia,
    handleOpenEstadisticas,
    handleCloseEstadisticas,
    // Estado de activación (solo lectura)
    grupoActivo,
    // Estado del turno del grupo
    turnoNoConfigurado,
    turnoInactivo,
    turnoNombre
  };
}
