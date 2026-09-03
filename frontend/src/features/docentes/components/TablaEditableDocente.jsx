import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';

/**
 * TablaEditableDocente — tabla editable para una tabla hija de DOCENTES.
 *
 * El guardado se hace al Finalizar (DocenteForm) o al Guardar (DocenteTablasModal),
 * no inline. Las filas viven en memoria.
 *
 * Props:
 *  - tableName, primaryKey, columns, idDocente
 *  - title, description (header)
 *  - mode: 'edit' | 'create' (solo afecta mensaje de carga)
 *  - initialRows: filas iniciales (cargadas por el padre)
 *  - skipSelfLoad: si true, no carga de BD (el padre ya cargó)
 *  - onRowsChange: callback para reportar filas al padre
 *
 * Ref methods:
 *  - validateAndGetData(): { valid, error, data }
 */
const TablaEditableDocente = forwardRef(function TablaEditableDocente({
  tableName,
  primaryKey,
  columns,
  idDocente,
  title,
  description,
  mode = 'edit',
  onRowsChange,
  initialRows,
  skipSelfLoad = false
}, ref) {
  const isCreateMode = mode === 'create';

  const [rows, setRows] = useState(initialRows || []);
  const [toast, setToast] = useState(null);

  // En modo create, reportar filas al padre cuando cambien
  useEffect(() => {
    if (isCreateMode && onRowsChange) {
      const cleanRows = rows.map(({ _isNew, ...rest }) => rest);
      onRowsChange(cleanRows);
    }
  }, [rows, isCreateMode, onRowsChange]);

  // Crear fila vacía basada en las columnas
  const emptyRow = useMemo(() => {
    const obj = {};
    columns.forEach(col => { obj[col.field] = ''; });
    return obj;
  }, [columns]);

  const handleAddRow = () => {
    setRows(prev => [...prev, { ...emptyRow, _isNew: true }]);
  };

  const handleDeleteRow = (index) => {
    const row = rows[index];
    if (!row) return;
    if (!window.confirm('¿Eliminar esta fila?')) return;
    if (!isCreateMode && row[primaryKey] && !row._isNew) {
      setDeletedIds(prev => [...prev, row[primaryKey]]);
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleCellChange = (index, field, value) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  // Validar que todos los campos requeridos estén llenos
  const validateRows = () => {
    if (rows.length === 0) return { valid: true };
    for (let i = 0; i < rows.length; i++) {
      for (const col of columns) {
        const val = rows[i][col.field];
        const isEmpty = val === '' || val === null || val === undefined;
        if (col.required && isEmpty) {
          return {
            valid: false,
            error: `Fila ${i + 1}: el campo "${col.label}" es obligatorio`
          };
        }
        if (col.type === 'integer' && val !== '' && val !== null && val !== undefined) {
          const num = Number(val);
          if (isNaN(num) || (col.min !== undefined && num < col.min)) {
            return {
              valid: false,
              error: `Fila ${i + 1}: el campo "${col.label}" debe ser un número válido${col.min !== undefined ? ` (mínimo ${col.min})` : ''}`
            };
          }
        }
      }
    }
    return { valid: true };
  };

  // Validar y reportar — expuesto via ref del padre
  const validateAndGetData = useCallback(() => {
    const validation = validateRows();
    if (!validation.valid) {
      return { valid: false, error: validation.error, data: null };
    }
    // Retornar filas limpias (sin _isNew, sin primaryKey)
    const cleanData = rows.map(({ _isNew, [primaryKey]: _pk, ...rest }) => rest);
    return { valid: true, error: null, data: cleanData };
  }, [rows, columns, primaryKey]);

  // Exponer método al padre via ref
  useImperativeHandle(ref, () => ({
    validateAndGetData
  }), [validateAndGetData]);

  const renderInput = (col, value, onChange) => {
    const baseClass = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    const disabledClass = 'bg-white';

    switch (col.type) {
      case 'native-date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={false}
            className={`${baseClass} ${disabledClass}`}
          />
        );
      case 'integer':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={false}
            min={col.min}
            placeholder={col.placeholder || ''}
            className={`${baseClass} ${disabledClass}`}
          />
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={false}
            placeholder={col.placeholder || ''}
            className={`${baseClass} ${disabledClass}`}
          />
        );
    }
  };

  if (!isCreateMode && !idDocente) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-sm text-amber-700">
          Guarde el docente en la página anterior para poder gestionar {title.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={false}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Añadir fila
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-2 text-sm border-b ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Tabla */}
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No hay registros. Haga clic en "Añadir fila" para empezar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.field}
                    className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                  >
                    {col.label}
                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium text-gray-700 w-16">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, index) => (
                <tr key={index} className={row._isNew ? 'bg-blue-50/30' : 'hover:bg-gray-50'}>
                  {columns.map(col => (
                    <td key={col.field} className="px-3 py-2">
                      {renderInput(col, row[col.field], (val) => handleCellChange(index, col.field, val))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      disabled={false}
                      className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Eliminar fila"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default TablaEditableDocente;

