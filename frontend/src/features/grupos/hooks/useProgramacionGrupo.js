import { useState, useCallback, useEffect } from 'react';
import { db } from '@/shared/api';
import { transformRecords } from '../config/transformers';

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
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selectedCurso, setSelectedCurso] = useState('');
  const [estadisticasOpen, setEstadisticasOpen] = useState(false);

  // ===== Estado de activación de grupo (solo lectura, para display) =====
  const [grupoActivo, setGrupoActivo] = useState(null);

  const resetPlantilla = useCallback(() => {
    setCustomBlocks(null);
    setMatrix(null);
    setGrupoNombre(null);
    setCellEvents({});
    setBloqueMap({});
    setColumnDates([]);
    setDeleteMode(false);
    setSelectionMode(false);
    setSelectedCells(new Set());
    setSelectedCurso('');
    setConflictError(null);
    setAdvertenciaHoras(null);
    setGrupoActivo(null);
  }, []);

  const loadPlantilla = useCallback(async (idGrupo) => {
    if (!idGrupo) {
      resetPlantilla();
      return;
    }
    setLoading(true);
    try {
      const [records, fechasRaw] = await Promise.all([
        db.executeFunction('fn_obtener_programacion_grupo', { p_id_grupo: Number(idGrupo) }).catch(() => []),
        db.executeFunction('fn_calcular_fechas_matriz', { ID_GRUPO: idGrupo }).catch(() => [])
      ]);

      if (!records || records.length === 0) {
        resetPlantilla();
        return;
      }

      const { blocks, matrix: mat, grupoNombre: nombre, cellEvents: ce } = transformRecords(records);
      setCustomBlocks(blocks);
      setMatrix(mat);
      setGrupoNombre(nombre);
      setCellEvents(ce);

      // Obtener estado ACTIVO del grupo desde el primer record (GRUPO_ACTIVO, no ACTIVO de programacion)
      const grupoActivoVal = records[0]?.GRUPO_ACTIVO;
      setGrupoActivo(grupoActivoVal === true || grupoActivoVal === 'true' || grupoActivoVal === 't');

      const bMap = {};
      records.forEach(r => { bMap[r.BLOQUE_ORDEN] = r.ID_BLOQUE; });
      setBloqueMap(bMap);

      // Construir columnDates
      const colMap = {};
      const rawArr = Array.isArray(fechasRaw) ? fechasRaw : (fechasRaw ? [fechasRaw] : []);
      rawArr.forEach(r => {
        const colIdx = (r.col ?? r.COL) - 1;
        if (colIdx < 0) return;
        if (!colMap[colIdx]) colMap[colIdx] = [];
        const rawFecha = r.fecha ?? r.FECHA;
        const [y, m, d] = String(rawFecha).split('-').map(Number);
        const fechaLocal = new Date(y, m - 1, d);
        const fechaStr = fechaLocal.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        colMap[colIdx].push(fechaStr);
      });
      const maxCol = Math.max(...Object.keys(colMap).map(Number), -1);
      const colDates = Array.from({ length: maxCol + 1 }, (_, i) => colMap[i] || []);
      setColumnDates(colDates);
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
    setSelectedCells(new Set());
    setSelectedCurso('');
  };

  const handleCancelAdd = () => {
    setSelectionMode(false);
    setSelectedCells(new Set());
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
    const key = `${colIdx}-${bloqueOrden}`;
    setSelectedCells(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!selectedCurso || selectedCells.size === 0 || !sharedGrupo) return;
    setSaving(true);
    try {
      const sortedCells = Array.from(selectedCells).map(key => {
        const [colIdxStr, bloqueOrdenStr] = key.split('-');
        return {
          key,
          diaIdx: parseInt(colIdxStr) + 1,
          bloqueOrden: parseInt(bloqueOrdenStr)
        };
      }).sort((a, b) => {
        if (a.diaIdx !== b.diaIdx) return a.diaIdx - b.diaIdx;
        return a.bloqueOrden - b.bloqueOrden;
      });

      const inserts = sortedCells.map(cell =>
        db.executeFunction('fn_asignar_curso_grupo', {
          p_id_grupo: Number(sharedGrupo),
          p_dia_idx: cell.diaIdx,
          p_bloque_orden: cell.bloqueOrden,
          p_id_grupo_curso: Number(selectedCurso)
        })
      );

      const results = [];
      for (const insertPromise of inserts) {
        const result = await insertPromise;
        results.push(result);
      }

      // Verificar advertencias del último resultado
      const lastResult = results[results.length - 1];
      const adv = lastResult?.advertencias;
      if (adv && (adv.excede_ciclo || adv.excede_totales)) {
        setAdvertenciaHoras(adv);
      }

      setSelectionMode(false);
      setSelectedCells(new Set());
      setSelectedCurso('');
      await loadPlantilla(sharedGrupo);
    } catch (err) {
      console.error('Error al asignar curso:', err);
      const errorMsg = err?.message || '';

      const isSolapamientoDocente = errorMsg?.includes('[SOLAPAMIENTO_DOCENTE]');
      const isSolapamientoPlaza = errorMsg?.includes('[SOLAPAMIENTO_PLAZA]');
      const isConflicto = isSolapamientoDocente || isSolapamientoPlaza ||
                          errorMsg?.includes('[SOLAPAMIENTO]') ||
                          errorMsg?.includes('[CONFLICTO_DOCENTE]') ||
                          errorMsg?.includes('[CONFLICTO_PLAZA]');

      if (isConflicto) {
        try {
          if (isSolapamientoDocente || isSolapamientoPlaza) {
            const dataMatch = errorMsg.match(/\[SOLAPAMIENTO_\w+\]\s*(.+)/);
            if (dataMatch) {
              const parts = dataMatch[1].split('|');
              let errorData;
              if (isSolapamientoDocente && parts.length >= 9) {
                errorData = {
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
              } else if (isSolapamientoPlaza && parts.length >= 8) {
                errorData = {
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
              if (errorData) {
                setConflictError(errorData);
                setSaving(false);
                return;
              }
            }
          }
          setConflictError(errorMsg);
        } catch {
          setConflictError(errorMsg);
        }
      } else {
        setConflictError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  }, [selectedCurso, selectedCells, sharedGrupo, loadPlantilla]);

  const handleCellDelete = useCallback(async (event) => {
    if (!event?.idProgramacion) return;
    setSaving(true);
    try {
      await db.executeFunction('fn_desasignar_curso_grupo', {
        p_id_programacion: Number(event.idProgramacion)
      });
      if (sharedGrupo) await loadPlantilla(sharedGrupo);
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
    showTemplate,
    conflictError,
    advertenciaHoras,
    estadisticasOpen,
    setSelectedCurso,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict,
    handleClearAdvertencia,
    handleOpenEstadisticas,
    handleCloseEstadisticas,
    // Estado de activación (solo lectura)
    grupoActivo
  };
}
