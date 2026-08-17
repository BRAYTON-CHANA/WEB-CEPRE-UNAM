import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useTableData } from '../../crud/hooks/useTableData';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import TableMultiLevel from './TableMultiLevel';
import Toast from '@/shared/components/ui/Toast';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * TableMultiLevelEditable — contenedor con datos propios y edición inline para TableMultiLevel.
 * Reutiliza EditableCell y los mismos patrones de guardado que DatabaseTableEditable.
 *
 * @param {string}   tableName       - Tabla BD a consultar (opcional si se pasa data)
 * @param {array}    data            - Datos externos (omite fetch si se pasa)
 * @param {object}   filters         - Filtros fijos para la consulta
 * @param {array}    levelConfigs    - Configuración multinivel: [{ headers, boundColumn, actions }]
 * @param {array}    editableColumns - Array de nombres de campo que pueden editarse
 * @param {function} onCellChange    - Callback para cambios: (recordId, field, newValue) => void
 * @param {object}   editFunctions   - Funciones personalizadas por campo: { fieldName: (recordId, field, newValue) => void }
 * @param {string}   saveMode        - 'auto' (inmediato) o 'manual' (con botón guardar)
 * @param {string}   batchSaveButtonText - Texto del botón de guardado manual
 * @param {boolean}  showBatchSaveButton   - Mostrar botón de guardado manual
 * @param {function} onSaveSuccess   - Callback tras guardado exitoso
 * @param {function} formatToastMessage - (recordId, field, newValue, primaryKey, rowData, header) => string
 * @param {function} onSaveError     - Callback tras error de guardado
 * @param {function} onPendingChangesChange - Callback con cantidad de cambios pendientes
 * @param {number}   refreshTrigger  - Trigger externo para refrescar
 * @param {object}   headerProps     - Props para CrudHeader
 * @param {boolean}  externalLoading - Override loading cuando data es externa
 * @param {object}   tableProps      - Props extra para TableMultiLevel (onExpand, childrenData, etc.)
 * @param {object}   toastProps      - Props extra para Toast (fontFamily, backgroundColor, etc.)
 */
const TableMultiLevelEditable = forwardRef(function TableMultiLevelEditable({
  tableName,
  data: externalData,
  filters = {},
  levelConfigs = [],
  editableColumns = [],
  onCellChange,
  editFunctions = {},
  saveMode = 'auto',
  batchSaveButtonText = 'Guardar cambios',
  showBatchSaveButton = true,
  onSaveSuccess,
  onSaveError,
  formatToastMessage,
  onPendingChangesChange,
  refreshTrigger = 0,
  headerProps = {},
  externalLoading = false,
  tableProps = {},
  toastProps = {}
}, ref) {
  const isExternal = externalData !== undefined;

  const {
    records: fetchedRecords,
    loading: fetchLoading,
    error: fetchError,
    refresh
  } = useTableData(isExternal ? null : tableName, filters);

  const records = isExternal ? externalData : fetchedRecords;
  const loading  = isExternal ? externalLoading : fetchLoading;
  const error    = isExternal ? null : fetchError;

  const [tableKey, setTableKey] = useState(0);
  const lastLoadingRef     = useRef(loading);
  const initialLoadDoneRef = useRef(false);
  const [editingData, setEditingData] = useState({});
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [batchSaveError, setBatchSaveError] = useState(null);
  const [toast, setToast] = useState(null);
  const [optimisticOverrides, setOptimisticOverrides] = useState({});

  // Limpiar overrides cuando los datos cambian (create/edit/delete/refresh traen valores frescos)
  useEffect(() => {
    setOptimisticOverrides({});
  }, [records]);

  // displayRecords: records + optimisticOverrides aplicados
  // Usa el boundColumn del último nivel (donde están los registros editables con su PK real)
  const displayRecords = useMemo(() => {
    if (Object.keys(optimisticOverrides).length === 0) return records;
    const pk = levelConfigs[levelConfigs.length - 1]?.boundColumn;
    if (!pk) return records;
    return records.map(row => {
      const overrides = optimisticOverrides[String(row[pk])];
      return overrides ? { ...row, ...overrides } : row;
    });
  }, [records, optimisticOverrides, levelConfigs]);

  const isBatchMode = saveMode === 'manual';

  const pendingChangesCount = useMemo(() => {
    return Object.values(editingData).reduce((total, pkGroup) => {
      return total + Object.values(pkGroup).reduce((rowTotal, row) => rowTotal + Object.keys(row).length, 0);
    }, 0);
  }, [editingData]);

  useEffect(() => {
    if (lastLoadingRef.current === true && loading === false) {
      if (initialLoadDoneRef.current) setTableKey(prev => prev + 1);
      initialLoadDoneRef.current = true;
    }
    lastLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    onPendingChangesChange?.(pendingChangesCount, isBatchSaving);
  }, [pendingChangesCount, isBatchSaving, onPendingChangesChange]);

  useEffect(() => {
    if (refreshTrigger > 0 && !isExternal) refresh();
  }, [refreshTrigger, refresh, isExternal]);

  const enhancedLevelConfigs = useMemo(() => {
    return levelConfigs.map(level => ({
      ...level,
      headers: (level.headers || []).map(header => ({
        ...header,
        editable: header.editable === true || editableColumns.includes(header.field || header.title)
      }))
    }));
  }, [levelConfigs, editableColumns]);

  const headerMap = useMemo(() => {
    const map = {};
    enhancedLevelConfigs.forEach(level => {
      const boundColumn = level.boundColumn;
      (level.headers || []).forEach(header => {
        const f = header.field || header.title;
        map[f] = { ...header, boundColumn };
      });
    });
    return map;
  }, [enhancedLevelConfigs]);

  const formatValue = (value, header = {}) => {
    if (typeof value === 'boolean') {
      const label = (header.label || header.title || '').toLowerCase();
      if (label.includes('activo')) return value ? 'Activo' : 'No activo';
      return value ? 'Sí' : 'No';
    }
    return value;
  };

  const handleCellChange = useCallback((recordId, field, newValue, primaryKey) => {
    setEditingData(prev => ({
      ...prev,
      [primaryKey]: {
        ...prev[primaryKey],
        [recordId]: {
          ...prev[primaryKey]?.[recordId],
          [field]: newValue
        }
      }
    }));
    onCellChange?.(recordId, field, newValue);
  }, [onCellChange]);

  const handleSaveSuccess = useCallback((recordId, field, newValue, primaryKey, rowData, header) => {
    setEditingData(prev => {
      const pkGroup = prev[primaryKey];
      if (!pkGroup) return prev;
      const row = pkGroup[recordId];
      if (!row || !(field in row)) return prev;
      const nextRow = { ...row };
      delete nextRow[field];
      const nextPkGroup = { ...pkGroup };
      if (Object.keys(nextRow).length === 0) {
        delete nextPkGroup[recordId];
      } else {
        nextPkGroup[recordId] = nextRow;
      }
      const next = { ...prev };
      if (Object.keys(nextPkGroup).length === 0) {
        delete next[primaryKey];
      } else {
        next[primaryKey] = nextPkGroup;
      }
      return next;
    });

    const isBoolean = header?.type === 'boolean';
    if (isBoolean) {
      // Optimistic update: guardar override, no refresh
      setOptimisticOverrides(prev => ({
        ...prev,
        [String(recordId)]: { ...prev[String(recordId)], [field]: newValue }
      }));
    } else {
      // Comportamiento actual para no-boolean
      if (!isExternal) refresh();
    }
    onSaveSuccess?.(recordId, field, newValue, primaryKey, rowData, header);
    const fieldLabel = header?.label || header?.title || field;
    const valueText = formatValue(newValue, header);
    const description = formatToastMessage
      ? formatToastMessage(recordId, field, newValue, primaryKey, rowData, header)
      : (primaryKey ? `Registro #${recordId}: ${fieldLabel} → ${valueText}` : `${fieldLabel} → ${valueText}`);
    setToast({ title: 'Guardado exitoso', description, type: 'success' });
  }, [isExternal, refresh, onSaveSuccess, formatToastMessage]);

  const handleSaveError = useCallback((recordId, field, error, primaryKey, rowData, header) => {
    onSaveError?.(recordId, field, error, primaryKey, rowData, header);
    const description = formatToastMessage
      ? formatToastMessage(recordId, field, rowData?.[field], primaryKey, rowData, header)
      : error?.message || 'Error al guardar';
    setToast({ title: 'Error', description, type: 'error' });
  }, [onSaveError, formatToastMessage]);

  const handleBatchSave = useCallback(async () => {
    if (pendingChangesCount === 0) return;

    setIsBatchSaving(true);
    setBatchSaveError(null);

    const failedChanges = {};
    const succeeded = [];

    for (const [primaryKey, records] of Object.entries(editingData)) {
      for (const [rowId, rowChanges] of Object.entries(records)) {
        for (const [field, newValue] of Object.entries(rowChanges)) {
          const header = headerMap[field];
          if (!header) {
            console.warn('[TableMultiLevelEditable] Columna no encontrada', { primaryKey, rowId, field });
            continue;
          }

          const { saveFunction, saveParamName, saveValueParam, targetTable, targetField, targetPrimaryKey } = header;
          const rowIdNum = Number(rowId);

          try {
            if (saveFunction) {
              const params = {};
              const idParam = saveParamName || `p_${(targetPrimaryKey || primaryKey).toLowerCase()}`;
              params[idParam] = rowIdNum;
              if (saveValueParam) {
                params[saveValueParam] = newValue;
              }
              const rawResult = await db.executeFunction(saveFunction, params);
              const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;
              if (result?.success === false) {
                throw new Error(result.message || 'No se puede guardar');
              }
            } else if (targetTable && targetField) {
              const pk = targetPrimaryKey || primaryKey;
              await db.update(targetTable, rowIdNum, { [targetField]: newValue }, pk);
            } else {
              console.warn('[TableMultiLevelEditable] Columna sin config de guardado', { primaryKey, rowId: rowIdNum, field });
              continue;
            }

            succeeded.push({ rowId: rowIdNum, field, newValue, primaryKey });
          } catch (err) {
            if (!failedChanges[primaryKey]) failedChanges[primaryKey] = {};
            if (!failedChanges[primaryKey][rowId]) failedChanges[primaryKey][rowId] = {};
            failedChanges[primaryKey][rowId][field] = newValue;
          }
        }
      }
    }

    setEditingData(failedChanges);
    setIsBatchSaving(false);

    if (Object.keys(failedChanges).length === 0) {
      cacheService.invalidateAll();
      if (!isExternal) refresh();
      succeeded.forEach(({ rowId, field, newValue, primaryKey }) => onSaveSuccess?.(rowId, field, newValue, primaryKey));
      setBatchSaveError(null);
      setToast({ title: 'Guardado exitoso', description: 'Cambios guardados', type: 'success' });
    } else {
      const msg = `Error al guardar ${Object.keys(failedChanges).length} cambios. Revise las celdas marcadas.`;
      setBatchSaveError(msg);
      onSaveError?.(null, null, new Error(msg));
      setToast({ title: 'Error', description: msg, type: 'error' });
    }
  }, [editingData, pendingChangesCount, headerMap, isExternal, refresh, onSaveSuccess, onSaveError]);

  useImperativeHandle(ref, () => ({
    handleBatchSave,
    pendingChangesCount,
    isBatchSaving
  }), [handleBatchSave, pendingChangesCount, isBatchSaving]);

  const mergedHeaderProps = useMemo(() => {
    if (!isBatchMode || !showBatchSaveButton) return headerProps;
    const batchAction = {
      text: isBatchSaving ? 'Guardando...' : `${batchSaveButtonText} (${pendingChangesCount})`,
      icon: isBatchSaving ? '⏳' : '💾',
      font: pendingChangesCount > 0 && !isBatchSaving
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
      onClick: pendingChangesCount > 0 && !isBatchSaving ? handleBatchSave : () => {}
    };
    return {
      ...headerProps,
      actions: [batchAction, ...(headerProps.actions || [])]
    };
  }, [isBatchMode, showBatchSaveButton, headerProps, batchSaveButtonText, pendingChangesCount, isBatchSaving, handleBatchSave]);

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          title={toast.title}
          description={toast.description}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
          position="bottom-right"
          size="lg"
          showProgress
          {...toastProps}
        />
      )}
      {(mergedHeaderProps.headerTitle || mergedHeaderProps.headerDescription || mergedHeaderProps.actions?.length > 0) && (
        <CrudHeader {...mergedHeaderProps} />
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-red-700 text-sm"><strong>Error:</strong> {error}</p>
        </div>
      )}

      {batchSaveError && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-red-700 text-sm"><strong>Error al guardar:</strong> {batchSaveError}</p>
        </div>
      )}

      {levelConfigs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
              <span className="text-gray-500 text-sm">Cargando datos...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No hay datos para mostrar</p>
            </div>
          ) : (
            <TableMultiLevel
              key={tableKey}
              data={displayRecords}
              levelConfigs={enhancedLevelConfigs}
              editingData={editingData}
              onCellChange={handleCellChange}
              saveMode={saveMode}
              onSaveSuccess={handleSaveSuccess}
              onSaveError={handleSaveError}
              editFunctions={editFunctions}
              {...tableProps}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default TableMultiLevelEditable;
