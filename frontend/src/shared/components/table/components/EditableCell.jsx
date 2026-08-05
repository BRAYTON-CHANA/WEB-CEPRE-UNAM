import React, { useState, useCallback } from 'react';
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
  onSaveError
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const isBlocked = column.blocked
    ? evaluateOperatorSet(column.blocked, rowData)
    : false;

  const canEdit = column.editable && !isBlocked;
  const isSelectType = SELECT_TYPES.has(column.type);
  const isPending = saveMode !== 'auto' && value !== originalValue;

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

  console.log(`[EditableCell:${column.field}] Render cell`, {
    rowId,
    value,
    type: column.type,
    canEdit,
    isEditing,
    isSaving,
    saveError,
    saveConfig: { saveFunction, targetTable, targetField }
  });

  const executeSave = useCallback(async (newValue) => {
    console.log(`[EditableCell:${column.field}] 🚀 executeSave iniciado`, { rowId, newValue, saveFunction, targetTable, targetField });
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
        console.log(`[EditableCell:${column.field}] 📡 Llamando db.update`, { targetTable, rowId, [targetField]: newValue, pk });
        await db.update(targetTable, rowId, { [targetField]: newValue }, pk);
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
      setIsEditing(false);
    }
    console.log(`[EditableCell:${column.field}] 🏁 handleChange finalizado`);
  }, [rowId, column.field, value, onCellChange, editFunction, hasAutoSave, executeSave, saveMode]);

  const handleActivate = (e) => {
    if (canEdit && !isEditing) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsEditing(false);
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
            />
          )}
        </div>
      </td>
    );
  }

  // ── Tipo no editable ──────────────────────────────────────────
  if (!canEdit) {
    return (
      <td className="px-4 py-2.5 text-sm whitespace-nowrap text-gray-500">
        {renderReadValue(column, value)}
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
        </td>
      );
    }
    
    return (
      <td
        onClick={handleActivate}
        className={`px-4 py-2.5 text-sm whitespace-nowrap cursor-pointer ${isSaving ? 'opacity-60' : ''} ${isPending ? 'bg-amber-50' : ''}`}
        title={saveError || (isPending ? 'Cambio pendiente de guardar' : '')}
      >
        {renderReadValue(column, value)}
        {isPending && (
          <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" title="Cambio pendiente de guardar" />
        )}
        {isSaving && (
          <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-b border-blue-600"></span>
        )}
      </td>
    );
  }

  return (
    <td className={`px-2 py-1 whitespace-nowrap align-top relative ${isPending ? 'bg-amber-50' : ''}`} onKeyDown={handleKeyDown}>
      {renderSimpleInput(column, value, handleChange, isSaving)}
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
    </td>
  );
};

// ── Helpers ───────────────────────────────────────────────────

function renderReadValue(column, value, isSaving, onToggle) {
  if (column.type === 'boolean') {
    return (
      <ToggleSwitch
        checked={Boolean(value)}
        onChange={onToggle}
        size="sm"
        disabled={isSaving}
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

function renderSimpleInput(column, value, handleChange, isSaving) {
  const { type = 'text', field } = column;

  switch (type) {
    case 'boolean':
      return (
        <ToggleSwitch
          checked={Boolean(value)}
          onChange={checked => handleChange(field, checked)}
          size="sm"
          disabled={isSaving}
        />
      );

    case 'number':
    case 'integer':
    case 'float':
      return (
        <input
          type="number"
          value={value ?? ''}
          disabled={isSaving}
          onChange={e => handleChange(field, e.target.value === '' ? null : Number(e.target.value))}
          className="w-full min-w-[100px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          autoFocus
        />
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          disabled={isSaving}
          onChange={e => handleChange(field, e.target.value)}
          className="w-full min-w-[140px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          autoFocus
        />
      );
  }
}

export default EditableCell;
