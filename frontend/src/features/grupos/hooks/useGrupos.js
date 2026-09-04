import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getTableLevelConfigs, getGruposFlatConfig } from '@/features/grupos/config/tableConfig';
import { grupoFormFields, grupoEditFormFields, grupoEditValidation, grupoEditModalConfig, grupoMultiStep, grupoValidation, grupoModalConfig, grupoFormLayout } from '@/features/grupos/config/formConfig';
import { createGruposBatch } from '@/features/grupos/services/gruposService';
import { db } from '@/shared/api';

/**
 * useGrupos — lógica de la página de Grupos.
 * 3 niveles con lazy loading: Sedes (incl. virtual) → Áreas (sync) → Grupos (editable).
 * Solo 2 consultas: VW_SEDES_CON_VIRTUAL (level 0) y VW_GRUPOS por CODIGO_SEDE (level 1).
 */
export function useGrupos({ externalPeriodo, onExternalPeriodoChange, onVerCursos, onVerProgramacion } = {}) {
  // ===== Selector de período (externo o interno) =====
  const [internalPeriodo, setInternalPeriodo] = useState('');
  const selectedPeriodo = externalPeriodo !== undefined ? externalPeriodo : internalPeriodo;
  const handlePeriodoChange = (name, value) => {
    if (onExternalPeriodoChange) onExternalPeriodoChange(value);
    else setInternalPeriodo(value);
  };
  const [periodos, setPeriodos] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await db.select('PERIODOS', {});
        if (mounted) setPeriodos(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setPeriodos([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedPeriodoNombre = useMemo(() => {
    if (!selectedPeriodo) return '';
    const p = periodos.find(p => String(p.ID_PERIODO) === String(selectedPeriodo));
    return p?.NOMBRE_PERIODO || '';
  }, [selectedPeriodo, periodos]);

  // ===== Configs de multilevel fetch (depende de selectedPeriodo) =====
  const fetchConfigs = useMemo(() => {
    if (!selectedPeriodo) return [];
    return [
      { tableName: 'VW_SEDES_CON_VIRTUAL', primaryKey: 'ID_SEDE', filters: {} },
      { tableName: 'VW_GRUPOS', primaryKey: 'ID_GRUPO', parentKey: 'CODIGO_SEDE', filters: { ID_PERIODO: selectedPeriodo } }
    ];
  }, [selectedPeriodo]);

  // ===== Datos con lazy loading =====
  const {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    fetchLevel1,
    refresh,
    refreshChildren,
    populateChildrenFromFlatData,
    updateRecord
  } = useMultiLevelFetch(fetchConfigs);

  // Transformar childrenCache → childrenData + childrenLoading (formato para TableMultiLevel)
  const childrenData = useMemo(() => {
    const result = {};
    Object.entries(childrenCache).forEach(([key, val]) => {
      result[key] = val.data;
    });
    return result;
  }, [childrenCache]);

  const childrenLoading = useMemo(() => {
    const result = {};
    Object.entries(childrenCache).forEach(([key, val]) => {
      result[key] = val.loading;
    });
    return result;
  }, [childrenCache]);

  // ===== Modo plano: todos los grupos del periodo en una sola consulta =====
  const [gruposAll, setGruposAll] = useState([]);
  const [gruposAllLoading, setGruposAllLoading] = useState(false);
  const [gruposAllError, setGruposAllError] = useState(null);

  const fetchGruposAll = useCallback(async () => {
    if (!selectedPeriodo) { setGruposAll([]); return []; }
    setGruposAllLoading(true);
    setGruposAllError(null);
    try {
      const data = await db.select('VW_GRUPOS', { ID_PERIODO: selectedPeriodo });
      const rows = Array.isArray(data) ? data : [];
      setGruposAll(rows);
      return rows;
    } catch (err) {
      setGruposAllError(err.message || 'Error al cargar grupos');
      return [];
    } finally {
      setGruposAllLoading(false);
    }
  }, [selectedPeriodo]);

  useEffect(() => {
    if (selectedPeriodo) fetchGruposAll();
  }, [selectedPeriodo, fetchGruposAll]);

  const refreshGruposAll = useCallback(() => fetchGruposAll(), [fetchGruposAll]);

  // ===== Refresh combinado: compacto + plano =====
  // Optimización: en vez de refresh() (que limpia childrenCache y dispara N fetchChildren),
  // trae todos los grupos en 1 sola call y los distribuye a childrenCache por CODIGO_SEDE.
  const handleRefreshAll = useCallback(async () => {
    // 1. Fetch todos los grupos (1 sola call VW_GRUPOS)
    const rows = await fetchGruposAll();

    // 2. Distribuir a childrenCache por CODIGO_SEDE (sin N calls extra)
    populateChildrenFromFlatData(1, rows, 'CODIGO_SEDE');

    // 3. Refresh sedes (1 call VW_SEDES_CON_VIRTUAL)
    fetchLevel1();
  }, [fetchGruposAll, populateChildrenFromFlatData, fetchLevel1]);

  // ===== CRUD =====
  const gruposCrud = useCrudForms({
    tableName: 'GRUPOS',
    primaryKey: 'ID_GRUPO',
    onRefresh: handleRefreshAll
  });

  // ===== Crear grupo desde sede =====
  const [selectedSedeId, setSelectedSedeId] = useState(null);
  const [selectedIsVirtual, setSelectedIsVirtual] = useState(false);

  const handleAddGrupo = (row) => {
    setSelectedSedeId(row.ID_SEDE);
    setSelectedIsVirtual(row.CODIGO_SEDE === 'VRT' || row.ID_SEDE === null);
    gruposCrud.handleCreate();
  };

  // Crear grupo desde modo plano (sin sede preseleccionada)
  const handleAddGrupoFlat = () => {
    setSelectedSedeId(null);
    setSelectedIsVirtual(false);
    gruposCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedSedeId(null);
    setSelectedIsVirtual(false);
    gruposCrud.handleCloseCreate();
  };

  // ===== Form dinámico =====
  const dynamicGrupoFields = useMemo(() => {
    const hasPeriodo = selectedPeriodo !== '';
    const hasSede = selectedSedeId !== null;
    return grupoFormFields.map((field) => {
      if (hasPeriodo && field.name === 'ID_PERIODO') {
        return { ...field, defaultValue: selectedPeriodo, disabled: true };
      }
      if (hasSede && field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeId, disabled: true };
      }
      // Sede virtual: forzar MODALIDAD=VIRTUAL y bloquear
      if (selectedIsVirtual && field.name === 'MODALIDAD') {
        return { ...field, defaultValue: 'VIRTUAL', disabled: true };
      }
      // Sede virtual: ID_SEDE oculto con null
      if (selectedIsVirtual && field.name === 'ID_SEDE') {
        return { ...field, hidden: true, hiddenValue: null };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId, selectedIsVirtual]);

  // ===== Configs =====
  const tableLevelConfigs = getTableLevelConfigs(gruposCrud, handleAddGrupo, null, onVerCursos, onVerProgramacion);

  // ===== Batch create =====
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState('');

  const handleBatchOpen = () => {
    if (!selectedPeriodo) return;
    setBatchError('');
    setIsBatchOpen(true);
  };

  const handleBatchClose = () => {
    setIsBatchOpen(false);
    setBatchError('');
  };

  const handleBatchSubmit = async (data) => {
    setBatchSubmitting(true);
    setBatchError('');
    try {
      await createGruposBatch(data);
      setIsBatchOpen(false);
      handleRefreshAll();
    } catch (err) {
      setBatchError(err.message || 'Error al crear grupos');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const updateRecordFlat = useCallback((recordId, primaryKey, field, newValue) => {
    setGruposAll(prev => prev.map(r =>
      String(r[primaryKey]) === String(recordId) ? { ...r, [field]: newValue } : r
    ));
  }, []);

  const flatTableConfig = useMemo(() => getGruposFlatConfig(gruposCrud, onVerCursos, onVerProgramacion), [gruposCrud, onVerCursos, onVerProgramacion]);

  const crudLevels = useMemo(() => [
    {
      crud: gruposCrud,
      tableName: 'GRUPOS',
      primaryKey: 'ID_GRUPO',
      formFields: dynamicGrupoFields,
      editFormFields: grupoEditFormFields,
      formLayout: grupoFormLayout,
      multiStep: grupoMultiStep,
      validation: grupoValidation,
      editValidation: grupoEditValidation,
      confirmSubmit: true,
      modalConfig: grupoModalConfig,
      editModalConfig: grupoEditModalConfig,
      onCreateClose: handleCreateClose
    }
  ], [gruposCrud, dynamicGrupoFields]);

  return {
    // Selector
    selectedPeriodo,
    selectedPeriodoNombre,
    handlePeriodoChange,
    // Data (multilevel lazy loading)
    records,
    loading,
    error,
    onExpand: fetchChildren,
    childrenData,
    childrenLoading,
    updateRecord,
    refresh,
    // CRUD
    gruposCrud,
    tableLevelConfigs,
    crudLevels,
    // Batch
    isBatchOpen,
    batchSubmitting,
    batchError,
    handleBatchOpen,
    handleBatchClose,
    handleBatchSubmit,
    // Crear grupo individual
    handleAddGrupoFlat,
    // Modo plano
    gruposAll,
    gruposAllLoading,
    gruposAllError,
    flatTableConfig,
    refreshGruposAll,
    updateRecordFlat
  };
}
