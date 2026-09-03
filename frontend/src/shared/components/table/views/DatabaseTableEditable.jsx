import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useTableData } from '../../crud/hooks/useTableData';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import Table from './Table';
import EditableCell from '../components/EditableCell';
import TableActions from '../components/TableActions';
import Toast from '@/shared/components/ui/Toast';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * DatabaseTableEditable — tabla autónoma con carga de datos propia y edición inline.
 * Basado en DatabaseTable pero con capacidades de edición para columnas específicas.
 *
 * @param {string}   tableName       - Tabla BD a consultar (opcional si se pasa data)
 * @param {array}    data            - Datos externos (omite fetch si se pasa)
 * @param {object}   filters         - Filtros fijos para la consulta
 * @param {array}    headers         - Columnas: [{ title, field, type, render, editable }]
 * @param {array}    actions         - Botones col acciones: [{ label, icon, onClick, className }]
 * @param {array}    editableColumns - Array de nombres de campo que pueden editarse
 * @param {function} onCellChange    - Callback para cambios: (recordId, field, newValue) => void
 * @param {object}   editFunctions   - Funciones personalizadas por campo: { fieldName: (recordId, field, newValue) => void }
 * @param {string}   saveMode        - Modo de guardado: 'auto' (inmediato) o 'manual' (con botón guardar)
 * @param {string}   primaryKey      - Campo primario para identificar registros
 * @param {function} onSaveSuccess   - Callback tras guardado exitoso: (recordId, field, newValue) => void
 * @param {function} onSaveError     - Callback tras error de guardado: (recordId, field, error) => void
 * @param {number}   refreshTrigger  - Trigger externo para refrescar
 * @param {object}   headerProps     - Props para CrudHeader (headerTitle, headerDescription, actions[])
 * @param {object}   tableProps      - Props extra para Table (sortable, pagination, etc.)
 * @param {boolean}  externalLoading - Override loading cuando data es externa
 */
const DatabaseTableEditable = forwardRef(function DatabaseTableEditable({
  tableName,
  data: externalData,
  filters = {},
  headers = [],
  actions = [],
  editableColumns = [],
  onCellChange,
  editFunctions = {},
  saveMode = 'auto',
  batchSaveButtonText = 'Guardar cambios',
  showBatchSaveButton = true,
  primaryKey = 'id',
  onSaveSuccess,
  onSaveError,
  onPendingChangesChange,
  refreshTrigger = 0,
  headerProps = {},
  tableProps = {},
  externalLoading = false
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
  const [activeEditCellId, setActiveEditCellId] = useState(null);

  const isBatchMode = saveMode === 'manual';

  const pendingChangesCount = useMemo(() => {
    return Object.values(editingData).reduce((total, row) => total + Object.keys(row).length, 0);
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

  // Enhanced headers with editable support
  // Una columna es editable si el header la declara editable=true o si está en editableColumns
  // Memoizado para evitar re-creación de objetos que cascada a re-renders de EditableCell
  const enhancedHeaders = useMemo(() => headers.map(header => ({
    ...header,
    editable: (header.editable === true || typeof header.editable === 'function' || editableColumns.includes(header.field))
  })), [headers, editableColumns]);

  const handleCellChange = useCallback((recordId, field, newValue) => {
    // Ignorar emisiones espurias de undefined (ej: ReferenceSelectInput al remontar)
    if (newValue === undefined) return;

    console.log('[DatabaseTableEditable] 📝 handleCellChange: actualizando editingData', { recordId, field, newValue, isExternal });

    // Update local editing state immediately for visual feedback
    setEditingData(prev => {
      const next = {
        ...prev,
        [recordId]: {
          ...prev[recordId],
          [field]: newValue
        }
      };
      console.log('[DatabaseTableEditable] 💾 editingData actualizado', { recordId, field, newValue, editingData: next });
      return next;
    });
    
    // Call parent callback (for background function execution or legacy mode)
    if (onCellChange) {
      console.log('[DatabaseTableEditable] 📢 Disparando onCellChange externo', { recordId, field, newValue });
      onCellChange(recordId, field, newValue);
    }
  }, [onCellChange, isExternal]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    console.log('[DatabaseTableEditable] ✅ handleSaveSuccess', { recordId, field, newValue, isExternal });
    // Limpiar el valor local para que el refresh muestre el dato real de la BD
    setEditingData(prev => {
      const row = prev[recordId];
      if (!row || !(field in row)) {
        console.log('[DatabaseTableEditable] ⚠️ No hay valor local para limpiar', { recordId, field });
        return prev;
      }
      const nextRow = { ...row };
      delete nextRow[field];
      const next = { ...prev };
      if (Object.keys(nextRow).length === 0) {
        delete next[recordId];
      } else {
        next[recordId] = nextRow;
      }
      console.log('[DatabaseTableEditable] 🧹 editingData limpiado tras éxito', { recordId, field, editingData: next });
      return next;
    });
    // Refrescar datos para reflejar el estado real en la vista
    if (!isExternal) {
      console.log('[DatabaseTableEditable] 🔄 Refrescando datos via useTableData.refresh()');
      refresh();
    } else {
      console.log('[DatabaseTableEditable] ⏭️ Datos externos: no se refresca internamente, se delega a onSaveSuccess');
    }
    // Mostrar toast de éxito
    const header = enhancedHeaders.find(h => h.field === field);
    const fieldLabel = header?.label || header?.title || field;
    setToast({ title: 'Guardado exitoso', description: `${fieldLabel} → ${newValue}`, type: 'success' });
    // Disparar callback externo si existe, pasando primaryKey
    if (onSaveSuccess) {
      console.log('[DatabaseTableEditable] 📢 Disparando onSaveSuccess externo', { recordId, field, newValue, primaryKey });
      onSaveSuccess(recordId, field, newValue, primaryKey);
    }
  }, [isExternal, refresh, onSaveSuccess, primaryKey, enhancedHeaders]);

  const handleSaveError = useCallback((recordId, field, error) => {
    console.error('[DatabaseTableEditable] ❌ handleSaveError', { recordId, field, error: error?.message || error });
    setToast({ title: 'Error', description: error?.message || 'Error al guardar', type: 'error' });
    if (onSaveError) {
      console.log('[DatabaseTableEditable] 📢 Disparando onSaveError externo');
      onSaveError(recordId, field, error);
    }
  }, [onSaveError]);

  // Add retry mechanism for view refresh as fallback
  const refreshRowWithRetry = async (recordId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Attempting view refresh ${i + 1}/${retries} for record:`, recordId);
        
        // Add delay to allow view to update
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        
        // This would require implementing a direct fetch method
        // For now, we'll rely on the function response data
        console.log('📊 Using function response data instead of view refresh');
        break;
        
      } catch (err) {
        console.error(`❌ View refresh attempt ${i + 1} failed:`, err);
        if (i === retries - 1) {
          console.warn('⚠️ All view refresh attempts failed, relying on function response');
        }
      }
    }
  };

  // ── Modo batch: guardar todos los cambios acumulados ─────────────
  const handleBatchSave = useCallback(async () => {
    console.log('[DatabaseTableEditable] 💾 handleBatchSave iniciado', { pendingChanges: editingData });
    if (pendingChangesCount === 0) {
      console.log('[DatabaseTableEditable] ⚠️ No hay cambios pendientes');
      return;
    }

    setIsBatchSaving(true);
    setBatchSaveError(null);

    const failedChanges = {};
    const succeeded = [];
    const headerMap = Object.fromEntries(enhancedHeaders.map(h => [h.field, h]));

    for (const [rowId, rowChanges] of Object.entries(editingData)) {
      for (const [field, newValue] of Object.entries(rowChanges)) {
        const header = headerMap[field];
        if (!header) {
          console.warn('[DatabaseTableEditable] ⚠️ Columna no encontrada para cambio pendiente', { rowId, field });
          continue;
        }

        const { saveFunction, saveParamName, saveValueParam, targetTable, targetField, targetPrimaryKey } = header;
        const rowIdNum = Number(rowId);

        try {
          if (saveFunction) {
            const params = {};
            const idParam = saveParamName || `p_${primaryKey.toLowerCase()}`;
            params[idParam] = rowIdNum;
            if (saveValueParam) {
              params[saveValueParam] = newValue;
            }
            console.log(`[DatabaseTableEditable] 📡 Batch: ejecutando ${saveFunction}`, { rowId: rowIdNum, params });
            const rawResult = await db.executeFunction(saveFunction, params);
            const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;
            if (result?.success === false) {
              const conflictos = result.conflictos || [];
              const detalles = conflictos.length > 0
                ? conflictos.map(c => `Reserva #${c.id_reserva} · ${c.fecha} · ${c.hora_inicio?.slice(0, 5)}–${c.hora_fin?.slice(0, 5)}`).join('\n')
                : '';
              const msg = `${result.message || 'No se puede guardar'}${detalles ? '\n' + detalles : ''}`;
              throw new Error(msg);
            }
          } else if (targetTable && targetField) {
            const pk = targetPrimaryKey || primaryKey;
            const saveValue = newValue === '' ? null : newValue;
            console.log(`[DatabaseTableEditable] 📡 Batch: ejecutando db.update`, { targetTable, rowId: rowIdNum, [targetField]: saveValue, pk });
            await db.update(targetTable, rowIdNum, { [targetField]: saveValue }, pk);
          } else {
            console.log('[DatabaseTableEditable] ⚠️ Batch: columna sin config de guardado, omitiendo', { rowId: rowIdNum, field });
            continue;
          }

          console.log(`[DatabaseTableEditable] ✅ Batch: guardado exitoso`, { rowId: rowIdNum, field, newValue });
          succeeded.push({ rowId: rowIdNum, field, newValue });
        } catch (err) {
          console.error(`[DatabaseTableEditable] ❌ Batch: guardado fallido`, { rowId: rowIdNum, field, newValue, error: err.message });
          if (!failedChanges[rowId]) failedChanges[rowId] = {};
          failedChanges[rowId][field] = newValue;
        }
      }
    }

    setEditingData(failedChanges);
    setIsBatchSaving(false);

    if (Object.keys(failedChanges).length === 0) {
      console.log('[DatabaseTableEditable] ✅ Batch: todos los cambios guardados, refrescando');
      cacheService.invalidateAll();
      if (!isExternal) refresh();
      setTableKey(prev => prev + 1);
      succeeded.forEach(({ rowId, field, newValue }) => onSaveSuccess?.(rowId, field, newValue));
      setBatchSaveError(null);
    } else {
      const msg = `Error al guardar ${Object.keys(failedChanges).length} cambios. Revise las celdas marcadas.`;
      console.error('[DatabaseTableEditable] ❌ Batch: algunos cambios fallaron', { failedChanges, msg });
      setBatchSaveError(msg);
      onSaveError?.(null, null, new Error(msg));
    }
  }, [editingData, pendingChangesCount, enhancedHeaders, primaryKey, isExternal, refresh, onSaveSuccess, onSaveError]);

  // Exponer handleBatchSave al padre via ref
  useImperativeHandle(ref, () => ({
    handleBatchSave,
    pendingChangesCount,
    isBatchSaving
  }), [handleBatchSave, pendingChangesCount, isBatchSaving]);

  const tableActions = Array.isArray(actions) && actions.length > 0
    ? {
        direct: actions.map(action => ({
          label:     action.label,
          icon:      action.icon,
          className: action.className || 'text-gray-600 hover:bg-gray-100',
          onClick:   action.onClick
        }))
      }
    : !Array.isArray(actions) && actions && Object.keys(actions).length > 0
      ? actions
      : null;

  const hasRowActions = Boolean(tableActions);

  // Pre-calcular merged rows para que EditableCell pueda excluir valores de otras filas
  const allMergedRows = records.map(row => ({ ...row, ...(editingData[row[primaryKey]] || {}) }));

  // Determinar si hay que mostrar el botón de guardado batch
  const showBatchButton = isBatchMode && showBatchSaveButton && (pendingChangesCount > 0 || isBatchSaving);

  return (
    <div className="space-y-4">
      {/* Toast de feedback */}
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
        />
      )}

      {(headerProps.headerTitle || headerProps.headerDescription || headerProps.actions?.length > 0) && (
        <CrudHeader {...headerProps} />
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-red-700 text-sm"><strong>Error:</strong> {error}</p>
            <button
              onClick={() => { refresh(); }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {batchSaveError && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-red-700 text-sm"><strong>Error al guardar:</strong> {batchSaveError}</p>
        </div>
      )}

      {headers.length > 0 && (
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
            <table key={tableKey} className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {enhancedHeaders.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      <span>{header.title}</span>
                    </th>
                  ))}
                  {hasRowActions && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {records.map((row, rowIndex) => {
                  const rowId = row[primaryKey];
                  const mergedRow = { ...row, ...(editingData[rowId] || {}) };

                  return (
                    <tr
                      key={rowId}
                      className="hover:bg-slate-50/60 transition-colors duration-100"
                    >
                      {enhancedHeaders.map((header, colIndex) => {
                        const isEditable = header.editable;

                        if (isEditable) {
                          return (
                            <EditableCell
                              key={colIndex}
                              column={header}
                              value={mergedRow[header.field]}
                              originalValue={row[header.field]}
                              rowData={mergedRow}
                              rowId={rowId}
                              primaryKey={primaryKey}
                              onCellChange={handleCellChange}
                              editFunction={editFunctions[header.field]}
                              saveMode={saveMode}
                              onSaveSuccess={handleSaveSuccess}
                              onSaveError={handleSaveError}
                              allRows={allMergedRows}
                              activeEditCellId={activeEditCellId}
                              onEditStart={(cellId) => setActiveEditCellId(cellId)}
                              onEditEnd={() => setActiveEditCellId(null)}
                            />
                          );
                        }

                        return (
                          <td key={colIndex} className="px-4 py-2.5 text-sm whitespace-nowrap">
                            {header.render
                              ? header.render(mergedRow[header.field], mergedRow)
                              : mergedRow[header.field] || <span className="text-gray-300 italic">—</span>
                            }
                          </td>
                        );
                      })}

                      {hasRowActions && (
                        <td className="px-4 py-2.5 text-sm whitespace-nowrap text-left">
                          <TableActions
                            actions={tableActions}
                            row={mergedRow}
                            rowIndex={rowIndex}
                            cellClassName="px-2 py-1"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Botón de guardado batch — dentro del contenedor de la tabla */}
          {showBatchButton && (
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <span className="text-sm text-gray-500">
                {pendingChangesCount} cambio{pendingChangesCount !== 1 ? 's' : ''} pendiente{pendingChangesCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={pendingChangesCount > 0 && !isBatchSaving ? handleBatchSave : () => {}}
                disabled={pendingChangesCount === 0 || isBatchSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${
                  pendingChangesCount > 0 && !isBatchSaving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>{isBatchSaving ? '⏳' : '💾'}</span>
                <span>{isBatchSaving ? 'Guardando...' : batchSaveButtonText}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DatabaseTableEditable;
