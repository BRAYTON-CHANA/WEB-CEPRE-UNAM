import React, { useState, useCallback } from 'react';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';
import { evaluateOperatorSet } from '@/features/form/utils/conditionEvaluator';
import { renderCell } from '@/shared/utils/cellRenderer';

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
const EditableCell = ({ column, value, rowData, rowId, onCellChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const isBlocked = column.blocked
    ? evaluateOperatorSet(column.blocked, rowData)
    : false;

  const canEdit = column.editable && !isBlocked;
  const isSelectType = SELECT_TYPES.has(column.type);

  const handleChange = useCallback((fieldName, newValue) => {
    onCellChange(rowId, column.field, newValue);
  }, [rowId, column.field, onCellChange]);

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
    return (
      <td
        onClick={handleActivate}
        className="px-4 py-2.5 text-sm whitespace-nowrap cursor-pointer hover:bg-blue-50 group"
      >
        <span className="text-gray-800 group-hover:underline group-hover:decoration-dotted">
          {renderReadValue(column, value)}
        </span>
        <span className="ml-1.5 opacity-0 group-hover:opacity-60 text-blue-400 text-xs">✎</span>
      </td>
    );
  }

  return (
    <td className="px-2 py-1 whitespace-nowrap align-top" onBlur={handleSimpleBlur} onKeyDown={handleKeyDown}>
      {renderSimpleInput(column, value, handleChange)}
    </td>
  );
};

// ── Helpers ───────────────────────────────────────────────────

function renderReadValue(column, value) {
  if (column.type === 'boolean') {
    return value ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Sí</span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No</span>
    );
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300 italic">—</span>;
  }
  return renderCell(value, 0, column.field, column.type);
}

function renderSimpleInput(column, value, handleChange) {
  const { type = 'text', field } = column;

  switch (type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => handleChange(field, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          autoFocus
        />
      );

    case 'number':
    case 'integer':
    case 'float':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={e => handleChange(field, e.target.value === '' ? null : Number(e.target.value))}
          className="w-full min-w-[100px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={e => handleChange(field, e.target.value)}
          className="w-full min-w-[140px] px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
  }
}

export default EditableCell;
