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
  const [estadisticasOpen, setEstadisticasOpen] = useState(false);

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
    console.log(`[DEBUG Frontend] loadPlantilla - Cargando grupo ${idGrupo}...`);
    try {
      const [records, fechasRaw] = await Promise.all([
        db.select('VW_PROGRAMACION_GRUPO_COMPLETA', { ID_GRUPO: idGrupo }),
        db.executeFunction('fn_calcular_fechas_matriz', { ID_GRUPO: idGrupo }).catch(() => [])
      ]);
      console.log(`[DEBUG Frontend] loadPlantilla - Records cargados: ${records?.length || 0}`);
      console.log(`[DEBUG Frontend] loadPlantilla - Fechas cargadas: ${fechasRaw?.length || 0}`);
      
      // DEBUG: Ver últimas columnas (día 2 y 3)
      const recordsDia2 = records?.filter(r => r.DIA_IDX === 2) || [];
      const recordsDia3 = records?.filter(r => r.DIA_IDX === 3) || [];
      console.log(`[DEBUG Frontend] loadPlantilla - Registros día 2: ${recordsDia2.length}`, recordsDia2.slice(0, 3));
      console.log(`[DEBUG Frontend] loadPlantilla - Registros día 3: ${recordsDia3.length}`, recordsDia3.slice(0, 3));

      if (!records || records.length === 0) { 
        console.log(`[DEBUG Frontend] loadPlantilla - No hay records, reseteando`);
        resetPlantilla(); 
        return; 
      }

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

  const handleOpenEstadisticas = () => {
    setEstadisticasOpen(true);
  };

  const handleCloseEstadisticas = () => {
    setEstadisticasOpen(false);
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
    console.log(`[DEBUG Frontend] handleConfirmAdd - grupo=${idGrupo}, curso=${selectedCurso}, celdas=${selectedCells.size}`);
    try {
      // Convertir Set a array y ordenar por DIA_IDX primero, luego por BLOQUE_ORDEN
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

      const inserts = [];
      for (const cell of sortedCells) {
        console.log(`[DEBUG Frontend] Insertando: diaIdx=${cell.diaIdx}, bloqueOrden=${cell.bloqueOrden}, curso=${selectedCurso}`);
        // Insertar en la vista - el trigger INSTEAD OF INSERT se encarga del upsert
        inserts.push(
          db.insert('VW_PROGRAMACION_GRUPO_COMPLETA', {
            ID_GRUPO: idGrupo,
            DIA_IDX: cell.diaIdx,
            BLOQUE_ORDEN: cell.bloqueOrden,
            ID_GRUPO_PLAN_CURSO: selectedCurso,
            ACTIVO: true
          })
        );
      }
      console.log(`[DEBUG Frontend] Ejecutando ${inserts.length} inserts secuencialmente (ordenados por día y bloque)...`);
      const results = [];
      for (const insertPromise of inserts) {
        const result = await insertPromise;
        results.push(result);
      }
      console.log(`[DEBUG Frontend] Inserts completados:`, results);
      setSelectionMode(false);
      setSelectedCells(new Set());
      setSelectedCurso('');
      console.log(`[DEBUG Frontend] Recargando plantilla para grupo ${idGrupo}...`);
      await loadPlantilla(idGrupo);
      console.log(`[DEBUG Frontend] Plantilla recargada OK`);
    } catch (err) {
      console.error('Error al asignar curso:', err);
      console.log('[DEBUG] Error completo:', JSON.stringify(err, null, 2));
      console.log('[DEBUG] err.message:', err.message);
      console.log('[DEBUG] err.response?.data:', err.response?.data);
      console.log('[DEBUG] err.details:', err.details);
      console.log('[DEBUG] err.detail:', err.detail);
      
      // Detectar error de solapamiento del trigger
      const errorMsg = err?.message || '';
      console.log('[DEBUG] errorMsg:', errorMsg);
      console.log('[DEBUG] ¿Incluye [SOLAPAMIENTO]?:', errorMsg?.includes('[SOLAPAMIENTO]'));
      
      if (errorMsg?.includes('[SOLAPAMIENTO]')) {
        try {
          // El backend ahora envía details directamente en el error
          let detail = err?.details;
          
          // Si details es string, parsearlo
          if (typeof detail === 'string') {
            detail = JSON.parse(detail);
          }
          
          console.log('[DEBUG] err.details:', err?.details);
          console.log('[DEBUG] detail parseado:', detail);
          console.log('[DEBUG] ¿detail tiene nivel?:', detail?.nivel);
          console.log('[DEBUG] ¿detail tiene conflictos?:', detail?.conflictos?.length);
          
          let solapamientoMsg = '';
          
          // Si no hay detalles válidos, usar mensaje básico del error
          if (!detail || Object.keys(detail).length === 0) {
            solapamientoMsg = `⚠️ ${errorMsg}\n\n` +
              `💡 La plaza o docente ya está asignado a otro grupo en este horario.\n` +
              `🔧 Solución: Libere la plaza del grupo conflictivo primero.`;
          } else if (detail.nivel === 1) {
            const conflictos = detail.conflictos || [];
            solapamientoMsg = `⚠️ SOLAPAMIENTO DE PLAZA (Nivel 1)\n\n` +
              `Plaza: ${detail.plaza_identificador || 'N/A'} (ID: ${detail.plaza_id || 'N/A'})\n` +
              `Total conflictos detectados: ${detail.total_conflictos || conflictos.length}\n\n` +
              (conflictos.length > 0 
                ? conflictos.map((c) => 
                    `${c.numero}. Fecha: ${c.fecha} (${c.dia_nombre})\n` +
                    `   Tu intento: ${c.tu_grupo}\n` +
                    `   Horario: ${c.tu_hora}\n` +
                    `   Bloques: ${c.tu_bloques}\n\n` +
                    `   Conflicto con: ${c.grupo_conflicto}\n` +
                    `   Horario: ${c.conflicto_hora}\n` +
                    `   Bloques: ${c.conflicto_bloques}`
                  ).join('\n\n')
                : '⚠️ No se pudieron cargar los detalles de los conflictos.') +
              `\n\nSolución: Libere la plaza del grupo conflictivo primero.`;
              
          } else if (detail.nivel === 2) {
            const conflictos = detail.conflictos || [];
            solapamientoMsg = `⚠️ SOLAPAMIENTO DE DOCENTE (Nivel 2)\n\n` +
              `Docente: ${detail.docente_nombre || 'N/A'} (ID: ${detail.docente_id || 'N/A'})\n` +
              `Plaza actual: ${detail.plaza_actual || 'N/A'}\n` +
              `Total conflictos detectados: ${detail.total_conflictos || conflictos.length}\n\n` +
              (conflictos.length > 0
                ? conflictos.map((c) => 
                    `${c.numero}. Fecha: ${c.fecha} (${c.dia_nombre})\n` +
                    `   Tu intento: ${c.tu_grupo}\n` +
                    `   Horario: ${c.tu_hora}\n` +
                    `   Bloques: ${c.tu_bloques}\n\n` +
                    `   Conflicto con plaza: ${c.plaza_conflicto}\n` +
                    `   En grupo: ${c.grupo_conflicto}\n` +
                    `   Horario: ${c.conflicto_hora}\n` +
                    `   Bloques: ${c.conflicto_bloques}`
                  ).join('\n\n')
                : '⚠️ No se pudieron cargar los detalles de los conflictos.') +
              `\n\nSolución: El docente ya está asignado a otra plaza en este horario.`;
          } else {
            // Fallback si hay detail pero no nivel reconocido
            solapamientoMsg = `⚠️ ${errorMsg}\n\n` +
              `📊 Detalles recibidos: ${JSON.stringify(detail, null, 2)}`;
          }
          
          console.log('[DEBUG] solapamientoMsg a mostrar:', solapamientoMsg);
          setConflictError(solapamientoMsg);
          console.log('[DEBUG] setConflictError llamado con éxito');
        } catch (parseErr) {
          console.log('[DEBUG] Error al parsear detalles:', parseErr);
          const fallbackMsg = errorMsg.replace('[SOLAPAMIENTO] ', '');
          console.log('[DEBUG] Mensaje fallback:', fallbackMsg);
          setConflictError(fallbackMsg);
        }
      } else if (errorMsg.includes('[REGENERAR_ERROR]')) {
        try {
          const detailStr = err.details || 
                           err.response?.data?.details || 
                           err.detail || 
                           '{}';
          const detail = typeof detailStr === 'string' ? JSON.parse(detailStr) : detailStr;
          
          const regenerarErrorMsg = `❌ ERROR AL REGENERAR SESIONES\n\n` +
            `🔧 Función: ${detail.funcion}\n` +
            `📋 Parámetros utilizados:\n` +
            `   • ID Grupo: ${detail.param_id_grupo}\n` +
            `   • Día: ${detail.param_dia_idx}\n` +
            `   • GPC: ${detail.param_gpc}\n\n` +
            `💥 Error: ${detail.error}\n\n` +
            `📊 Datos adicionales:\n${JSON.stringify(detail, null, 2)}\n\n` +
            `💡 Esto indica un problema técnico. Contacta al administrador.`;
          
          setConflictError(regenerarErrorMsg);
        } catch (parseErr) {
          setConflictError(errorMsg.replace('[REGENERAR_ERROR] ', ''));
        }
      } else if (errorMsg.includes('[SESION_DUPLICADA]')) {
        try {
          const detailStr = err.details || 
                           err.response?.data?.details || 
                           err.detail || 
                           '{}';
          const detail = typeof detailStr === 'string' ? JSON.parse(detailStr) : detailStr;
          
          const duplicadoMsg = `⚠️ SESIÓN DUPLICADA\n\n` +
            `No se pudo insertar la sesión porque ya existe una con los mismos datos.\n\n` +
            `📅 Fecha: ${detail.fecha}\n` +
            `🆔 GPC: ${detail.id_grupo_plan_curso}\n` +
            `🔢 Ocurrencia #: ${detail.numero_ocurrencia}\n` +
            `🕐 Horario: ${detail.hora_inicio} - ${detail.hora_fin}\n` +
            `🧱 Bloques: ${JSON.stringify(detail.bloques)}\n\n` +
            `💥 ${detail.error}\n\n` +
            `💡 Posibles causas:\n` +
            `   1. El DELETE de sesiones existentes no funcionó\n` +
            `   2. Hay un trigger que se ejecuta múltiples veces\n` +
            `   3. Hay sesiones huérfanas en la tabla\n\n` +
            `🔧 Solución: Verifique si hay sesiones existentes para este GPC y elimínelas manualmente.`;
          
          setConflictError(duplicadoMsg);
        } catch (parseErr) {
          setConflictError(errorMsg.replace('[SESION_DUPLICADA] ', ''));
        }
      } else {
        const genericMsg = err.message || 'Error desconocido';
        console.log('[DEBUG] Error no reconocido, mensaje genérico:', genericMsg);
        setConflictError(genericMsg);
      }
    } finally {
      setSaving(false);
    }
  }, [selectedCurso, selectedCells, selectorValues.ID_GRUPO, loadPlantilla]);


  const handleCellDelete = useCallback(async (event) => {
    if (!event?.idProgramacion) return;
    setSaving(true);
    try {
      // Eliminar a través de la vista usando el trigger INSTEAD OF DELETE
      await db.delete('VW_PROGRAMACION_GRUPO_COMPLETA', event.idProgramacion, 'ID_PROGRAMACION');
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
    estadisticasOpen,
    setSelectedCurso,
    handleSelectorChange,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict,
    handleOpenEstadisticas,
    handleCloseEstadisticas
  };
}
