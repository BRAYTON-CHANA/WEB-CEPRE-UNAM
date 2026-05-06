import { useState, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';
import { transformRecords } from '../config/transformers';
import { initialSelectorValues } from '../config/selectorConfig';

export function useProgramacionGrupo() {
  const [selectorValues, setSelectorValues] = useState(initialSelectorValues);

  const [customBlocks, setCustomBlocks] = useState(null);
  const [matrix, setMatrix]             = useState(null);
  const [grupoNombre, setGrupoNombre]   = useState(null);
  const [cellEvents, setCellEvents]     = useState({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [bloqueMap, setBloqueMap]       = useState({});

  const [columnDates, setColumnDates]     = useState([]);

  const [conflictError, setConflictError]  = useState(null);
  const [deleteMode, setDeleteMode]       = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selectedCurso, setSelectedCurso] = useState('');

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
  }, []);

  const loadPlantilla = useCallback(async (idGrupo) => {
    if (!idGrupo) return;
    setLoading(true);
    try {
      const [records, fechasRaw] = await Promise.all([
        db.select('VW_PROGRAMACION_GRUPO_COMPLETA', { ID_GRUPO: idGrupo }),
        db.executeFunction('fn_calcular_fechas_matriz', { ID_GRUPO: idGrupo }).catch(() => [])
      ]);

      if (!records || records.length === 0) { resetPlantilla(); return; }

      const { blocks, matrix: mat, grupoNombre: nombre, cellEvents: ce } = transformRecords(records);
      setCustomBlocks(blocks);
      setMatrix(mat);
      setGrupoNombre(nombre);
      setCellEvents(ce);

      const bMap = {};
      records.forEach(r => { bMap[r.BLOQUE_ORDEN] = r.ID_BLOQUE; });
      setBloqueMap(bMap);

      // Construir columnDates: array 0-based donde cada elemento es string[] de fechas
      const colMap = {};
      const rawArr = Array.isArray(fechasRaw) ? fechasRaw : (fechasRaw ? [fechasRaw] : []);
      rawArr.forEach(r => {
        const colIdx = (r.col ?? r.COL) - 1; // 1-based → 0-based
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

  const handleSelectorChange = useCallback((name, value) => {
    setSelectorValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'ID_PERIODO') {
        next.ID_SEDE = ''; next.ID_TURNO = ''; next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_SEDE') {
        next.ID_TURNO = ''; next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_TURNO') {
        next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_GRUPO') {
        value ? loadPlantilla(value) : resetPlantilla();
      }
      return next;
    });
  }, [resetPlantilla, loadPlantilla]);

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

  const handleCellToggle = useCallback((colIdx, bloqueOrden) => {
    const key = `${colIdx}-${bloqueOrden}`;
    setSelectedCells(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!selectedCurso || selectedCells.size === 0) return;
    const idGrupo = selectorValues.ID_GRUPO;
    setSaving(true);
    try {
      const upserts = [];
      selectedCells.forEach(key => {
        const [colIdxStr, bloqueOrdenStr] = key.split('-');
        const diaIdx     = parseInt(colIdxStr) + 1;
        const bloqueOrden = parseInt(bloqueOrdenStr);
        const idBloque   = bloqueMap[bloqueOrden];
        if (!idBloque) return;
        upserts.push(
          db.upsert(
            'PROGRAMACION_GRUPO',
            {},
            { ID_GRUPO: idGrupo, DIA_IDX: diaIdx, ID_BLOQUE: idBloque, ID_GRUPO_PLAN_CURSO: selectedCurso, ACTIVO: true },
            'ID_GRUPO,DIA_IDX,ID_BLOQUE'
          )
        );
      });
      await Promise.all(upserts);
      setSelectionMode(false);
      setSelectedCells(new Set());
      setSelectedCurso('');
      await loadPlantilla(idGrupo);
    } catch (err) {
      console.error('Error al asignar curso:', err);
      setConflictError(err.message || 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }, [selectedCurso, selectedCells, selectorValues.ID_GRUPO, bloqueMap, loadPlantilla]);

  const handleCellDelete = useCallback(async (event) => {
    if (!event?.idProgramacion) return;
    setSaving(true);
    try {
      await db.update('PROGRAMACION_GRUPO', event.idProgramacion, { ID_GRUPO_PLAN_CURSO: null }, 'ID_PROGRAMACION');
      await loadPlantilla(selectorValues.ID_GRUPO);
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
    } finally {
      setSaving(false);
    }
  }, [selectorValues.ID_GRUPO, loadPlantilla]);

  const stableFormData = useMemo(() => ({
    ID_PERIODO: selectorValues.ID_PERIODO,
    ID_SEDE:    selectorValues.ID_SEDE,
    ID_TURNO:   selectorValues.ID_TURNO,
    ID_GRUPO:   selectorValues.ID_GRUPO
  }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE, selectorValues.ID_TURNO, selectorValues.ID_GRUPO]);

  const showTemplate = !!customBlocks && !!matrix;

  const handleClearConflict = useCallback(() => setConflictError(null), []);

  return {
    selectorValues,
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
    stableFormData,
    conflictError,
    setSelectedCurso,
    handleSelectorChange,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict
  };
}
