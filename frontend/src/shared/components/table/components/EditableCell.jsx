import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';
import ToggleSwitch from '@/shared/components/ui/inputs/ToggleSwitch';
import { evaluateOperatorSet } from '@/shared/components/form/utils/conditionEvaluator';
import { renderCell } from '@/shared/utils/cellRenderer';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

// Tipos de campo que usan dropdown con portal (no cerrar en onBlur del td)
const SELECT_TYPES = new Set(['reference-select', 'function-select']);

/**
 * EditableCell — celda de EditableTable con modo lectura/edición
 *
 * Para tipos select (reference-select, function-select):
 * - El input se monta desde el inicio (precarga datos en background)
 * - Se alterna entre modo lectura y edición visualmente
 * - onBlur del td NO cierra el modo (el dropdown vive en un portal fuera del td)
 * - Se cierra solo al presionar Escape
 *
 * Para tipos simples (text, number, boolean):
 * - Se monta al activar y se cierra con onBlur
 */
const EditableCell = ({
  column,
  value,
  originalValue,
  rowData,
  rowId,
  primaryKey = 'id',
  onCellChange,
  editFunction,
  saveMode = 'auto',
  onSaveSuccess,
  onSaveError,
  allRows = [],
  activeEditCellId,
  onEditStart,
  onEditEnd
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const cellId = `${rowId}::${column.field}`;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [inputValue, setInputValue] = useState(value); // estado local del input (commit en blur/Enter)
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);

  // Cerrar edición si otra celda se activa
  useEffect(() => {
    if (isEditing && activeEditCellId && activeEditCellId !== cellId) {
      setIsEditing(false);
    }
  }, [activeEditCellId, cellId, isEditing]);

  const isBlocked = column.blocked
    ? evaluateOperatorSet(column.blocked, rowData)
    : false;

  const canEdit = (typeof column.editable === 'function' ? column.editable(rowData) : column.editable) && !isBlocked;
  const isSelectType = SELECT_TYPES.has(column.type);
  const isPending = saveMode !== 'auto' && value !== originalValue;

  // Calcular valores a excluir (plazas ya asignadas en otras filas del mismo grupo)
  const excludedValues = useMemo(() => {
    if (!column.excludeValues || !allRows || allRows.length === 0) return [];
    const groupField = column.excludeGroupField;
    const currentGroup = groupField ? rowData[groupField] : null;
    const exclusions = new Set();
    allRows.forEach(r => {
      // No excluir el valor de la fila actual
      if (String(r[primaryKey]) === String(rowId)) return;
      // Si hay groupField, solo excluir filas del mismo grupo
      if (groupField && String(r[groupField]) !== String(currentGroup)) return;
      const val = r[column.field];
      if (val !== null && val !== undefined && val !== '') {
        exclusions.add(String(val));
      }
    });
    return Array.from(exclusions);
  }, [column.excludeValues, column.excludeGroupField, column.field, allRows, rowData, rowId, primaryKey]);

  // Configuración de guardado declarativa (tipo campo de formulario)
  const {
    saveFunction,
    saveParamName,
    saveValueParam,
    targetTable,
    targetField,
    targetPrimaryKey
  } = column;

  const hasAutoSave = Boolean(saveFunction || (targetTable && targetField));

  const executeSave = useCallback(async (newValue) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      if (saveFunction) {
        const params = {};
        const idParam = saveParamName || `p_${primaryKey.toLowerCase()}`;
        params[idParam] = rowId;
        if (saveValueParam) {
          params[saveValueParam] = newValue;
        }
        console.log(`[EditableCell:${column.field}] 📡 Llamando db.executeFunction`, { saveFunction, params });
        const rawResult = await db.executeFunction(saveFunction, params);
        const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;
        console.log(`[EditableCell:${column.field}] ✅ db.executeFunction completado`, result);
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
        console.log(`[EditableCell:${column.field}] 📡 Llamando db.update`, { targetTable, rowId, [targetField]: saveValue, pk });
        await db.update(targetTable, rowId, { [targetField]: saveValue }, pk);
        console.log(`[EditableCell:${column.field}] ✅ db.update completado`);
      }

      console.log(`[EditableCell:${column.field}] 💾 Invalidando caché y notificando éxito`);
      cacheService.invalidateAll();
      onSaveSuccess?.(rowId, column.field, newValue);
    } catch (err) {
      console.error(`[EditableCell:${column.field}] ❌ Error guardando:`, err);
      setSaveError(err.message || 'Error al guardar');
      onSaveError?.(rowId, column.field, err);
      throw err;
    } finally {
      console.log(`[EditableCell:${column.field}] 🏁 executeSave finalizado`);
      setIsSaving(false);
    }
  }, [
    saveFunction, saveParamName, saveValueParam, targetTable, targetField,
    targetPrimaryKey, primaryKey, rowId, column.field, onSaveSuccess, onSaveError
  ]);

  const handleChange = useCallback(async (fieldName, newValue) => {
    const previousValue = value;
    console.log(`[EditableCell:${column.field}] 🖱️ handleChange iniciado`, { rowId, previousValue, newValue, hasAutoSave, hasEditFunction: !!editFunction, saveMode });

    // Intercept: si hay confirmBeforeSave y el nuevo valor coincide con whenValue, mostrar modal
    if (column.confirmBeforeSave && newValue === column.confirmBeforeSave.whenValue) {
      console.log(`[EditableCell:${column.field}] 🔒 confirmBeforeSave detectado, esperando confirmación`);
      setPendingValue(newValue);
      setShowConfirm(true);
      return;
    }

    // Actualizar estado local inmediatamente para feedback visual
    if (!editFunction) {
      console.log(`[EditableCell:${column.field}] 📝 Notificando onCellChange (estado local) -> newValue`);
      onCellChange(rowId, column.field, newValue);
    }

    // Guardado autónomo declarativo (tipo campo de formulario)
    if (hasAutoSave) {
      if (saveMode === 'auto') {
        console.log(`[EditableCell:${column.field}] ⚡ Modo guardado autónomo AUTO detectado`);
        try {
          await executeSave(newValue);
          console.log(`[EditableCell:${column.field}] ✅ Guardado autónomo exitoso`);
        } catch (err) {
          console.error(`[EditableCell:${column.field}] ↩️ Guardado autónomo falló, revirtiendo a previousValue`, previousValue);
          // Revertir estado local para reflejar el valor real
          if (!editFunction) {
            onCellChange(rowId, column.field, previousValue);
          }
        }
      } else {
        console.log(`[EditableCell:${column.field}] ⏸️ Modo BATCH: guardado aplazado, solo estado local actualizado`);
      }
    }

    // Función de edición personalizada (modo manual/legacy)
    if (editFunction) {
      console.log(`[EditableCell:${column.field}] 🔧 Llamando editFunction personalizada`);
      try {
        await editFunction(rowId, column.field, newValue);
        console.log(`[EditableCell:${column.field}] ✅ editFunction completada`);
      } catch (err) {
        console.error(`[EditableCell:${column.field}] ❌ editFunction error:`, err);
      }
    }
    
    // For auto save mode, exit editing after change
    if (saveMode === 'auto') {
      console.log(`[EditableCell:${column.field}] 🚪 Cerrando modo edición (saveMode=auto)`);
      closeEditing();
    }
    console.log(`[EditableCell:${column.field}] 🏁 handleChange finalizado`);
  }, [rowId, column.field, value, onCellChange, editFunction, hasAutoSave, executeSave, saveMode]);

  // ===== Handlers de confirmación (confirmBeforeSave) =====
  const handleConfirmSave = useCallback(async () => {
    const previousValue = value;
    setShowConfirm(false);
    if (!editFunction) {
      onCellChange(rowId, column.field, pendingValue);
    }
    if (hasAutoSave && saveMode === 'auto') {
      try {
        await executeSave(pendingValue);
      } catch (err) {
        if (!editFunction) {
          onCellChange(rowId, column.field, previousValue);
        }
      }
    }
    if (editFunction) {
      try {
        await editFunction(rowId, column.field, pendingValue);
      } catch (err) {
        console.error(`[EditableCell:${column.field}] confirmSave editFunction falló`, err);
      }
    }
    setPendingValue(null);
  }, [pendingValue, value, editFunction, onCellChange, rowId, column.field, hasAutoSave, saveMode, executeSave]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
    setPendingValue(null);
  }, []);

  const handleActivate = (e) => {
    if (canEdit && !isEditing) {
      e.stopPropagation();
      setInputValue(value);
      setIsEditing(true);
      if (onEditStart) onEditStart(cellId);
    }
  };

  const closeEditing = useCallback(() => {
    setIsEditing(false);
    if (onEditEnd) onEditEnd();
  }, [onEditEnd]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeEditing();
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
    }
  };

  // Commit del valor local al guardar (blur o Enter)
  // Valida positivos para tipos numéricos/currency
  // Acepta overrideValue para casos donde setInputValue es async (boolean)
  const commitInput = (overrideValue) => {
    const isNumericType = ['number', 'integer', 'float', 'currency'].includes(column.type);
    let finalValue = overrideValue !== undefined ? overrideValue : inputValue;

    if (isNumericType) {
      const num = Number(finalValue);
      if (finalValue === '' || finalValue === null || isNaN(num) || num < 0) {
        // Inválido: revertir sin guardar
        setInputValue(value);
        closeEditing();
        return;
      }
      finalValue = num;
    }

    if (finalValue !== value) {
      handleChange(column.field, finalValue);
    } else {
      closeEditing();
    }
  };

  // ── Tipos SELECT: siempre visible, sin toggle ────────────────
  if (isSelectType && canEdit) {
    return (
      <td
        className="px-2 py-1 align-middle"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="min-w-[240px]">
          {column.type === 'function-select' ? (
            <FunctionSelectInput
              name={column.field}
              value={value}
              onChange={handleChange}
              functionName={column.functionName}
              functionParams={column.functionParams}
              optionalParams={column.optionalParams}
              valueField={column.valueField}
              labelField={column.labelField}
              descriptionField={column.descriptionField}
              statusField={column.statusField}
              formData={rowData}
              placeholder={column.placeholder || 'Seleccione...'}
              searchable={column.searchable || false}
              freezeParams={column.freezeParams || false}
              showRefreshButton={column.showRefreshButton || false}
            />
          ) : (
            <ReferenceSelectInput
              name={column.field}
              value={value}
              onChange={handleChange}
              referenceTable={column.referenceTable}
              referenceField={column.referenceField}
              referenceQuery={column.referenceQuery}
              referenceLabelField={column.referenceLabelField}
              referenceDescriptionField={column.referenceDescriptionField}
              referenceFilters={column.referenceFilters}
              formData={rowData}
              placeholder={column.placeholder || 'Seleccione...'}
              searchable={column.searchable || false}
              excludeValues={excludedValues}
              showRefreshButton={column.showRefreshButton ?? true}
            />
          )}
        </div>
      </td>
    );
  }

  // ── Tipo no editable ──────────────────────────────────────────
  if (!canEdit) {
    return (
      <td className="px-4 py-2.5 text-sm whitespace-nowrap text-gray-300 bg-gray-50/60">
        {renderReadValue(column, value, false, undefined, true)}
      </td>
    );
  }

  // ── Tipos simples (text, number, boolean) ─────────────────────
  if (!isEditing) {
    // For boolean fields, make toggle directly interactive
    if (column.type === 'boolean') {
      return (
        <td className={`px-4 py-2.5 text-sm whitespace-nowrap relative ${isPending ? 'bg-amber-50' : ''}`}>
          {renderReadValue(column, value, isSaving, () => {
            const newValue = !Boolean(value);
            handleChange(column.field, newValue);
          })}
          {isPending && (
            <span
              title="Cambio pendiente de guardar"
              className="absolute -top-1 left-1/2 -translate-x-1/2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400"
            />
          )}
          {saveError && (
            <span
              title={saveError}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] cursor-help"
            >
              !
            </span>
          )}
          {showConfirm && column.confirmBeforeSave && createPortal(
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelConfirm} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="p-6 border-b border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-700">{column.confirmBeforeSave.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600">{column.confirmBeforeSave.message}</p>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={handleCancelConfirm}
                    className="px-5 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {column.confirmBeforeSave.cancelText || 'Cancelar'}
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  >
                    {column.confirmBeforeSave.confirmText || 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </td>
      );
    }
    
    return (
      <td
        onClick={handleActivate}
        className={`group px-4 py-2.5 text-sm whitespace-nowrap cursor-pointer transition-colors duration-150 ${isSaving ? 'opacity-60' : ''} ${isPending ? 'bg-amber-50' : 'hover:bg-blue-50/60'}`}
        title={saveError || (isPending ? 'Cambio pendiente de guardar' : 'Click para editar')}
      >
        <div className="flex items-center gap-1.5">
          <span className="transition-opacity">
            {renderReadValue(column, value)}
          </span>
          {/* Indicador editable: icono lápiz siempre visible, sutil */}
          {!isSaving && (
            <svg
              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors duration-150 shrink-0"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
          {isPending && (
            <span className="ml-0.5 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" title="Cambio pendiente de guardar" />
          )}
          {isSaving && (
            <span className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-b border-blue-600"></span>
          )}
        </div>
        {saveError && (
          <div className="text-xs text-red-500 mt-0.5">{saveError}</div>
        )}
      </td>
    );
  }

  return (
    <td className={`px-2 py-1 whitespace-nowrap align-top relative ${isPending ? 'bg-amber-50' : ''}`} onKeyDown={handleKeyDown}>
      {renderSimpleInput(column, inputValue, setInputValue, commitInput, isSaving)}
      {isPending && (
        <span
          title="Cambio pendiente de guardar"
          className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400"
        />
      )}
      {saveError && (
        <span
          title={saveError}
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] cursor-help"
        >
          !
        </span>
      )}
      {showConfirm && column.confirmBeforeSave && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelConfirm} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-amber-200 bg-amber-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-700">{column.confirmBeforeSave.title}</h3>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">{column.confirmBeforeSave.message}</p>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCancelConfirm}
                className="px-5 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {column.confirmBeforeSave.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                {column.confirmBeforeSave.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </td>
  );
};

// ── Helpers ───────────────────────────────────────────────────

function renderReadValue(column, value, isSaving, onToggle, disabled = false) {
  if (column.type === 'boolean') {
    return (
      <ToggleSwitch
        checked={Boolean(value)}
        onChange={onToggle}
        size="sm"
        disabled={isSaving || disabled}
      />
    );
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300 italic">—</span>;
  }
  const cellType = column.subtitle ? 'stacked' : column.type;
  const cellValue = column.subtitle
    ? { primary: value, secondary: rowData?.[column.subtitle.field] }
    : value;
  return renderCell(cellValue, 0, column.field, cellType);
}

function renderSimpleInput(column, inputValue, setInputValue, commitInput, isSaving) {
  const { type = 'text', field } = column;

  switch (type) {
    case 'boolean':
      return (
        <ToggleSwitch
          checked={Boolean(inputValue)}
          onChange={checked => {
            setInputValue(checked);
            // Boolean commit inmediato con valor explícito (no necesita blur)
            commitInput(checked);
          }}
          size="sm"
          disabled={isSaving}
        />
      );

    case 'number':
    case 'integer':
    case 'float':
    case 'currency':
      return (
        <input
          type="number"
          min="0"
          step={type === 'currency' ? '0.01' : '1'}
          value={inputValue ?? ''}
          disabled={isSaving}
          onChange={e => setInputValue(e.target.value === '' ? '' : e.target.value)}
          onBlur={() => commitInput()}
          className="w-full min-w-[100px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          autoFocus
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={inputValue ? String(inputValue).slice(0, 10) : ''}
          disabled={isSaving}
          onChange={e => setInputValue(e.target.value)}
          onBlur={() => commitInput()}
          className="w-full min-w-[140px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          autoFocus
        />
      );

    default:
      return (
        <input
          type="text"
          value={inputValue ?? ''}
          disabled={isSaving}
          onChange={e => setInputValue(e.target.value)}
          onBlur={() => commitInput()}
          className="w-full min-w-[140px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          autoFocus
        />
      );
  }
}

export default React.memo(EditableCell);
