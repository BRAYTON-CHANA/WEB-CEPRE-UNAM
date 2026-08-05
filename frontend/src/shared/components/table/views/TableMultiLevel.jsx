import React, { useState } from 'react';
import { useMultiLevelGrouping } from '../hooks/useMultiLevelGrouping';
import TableActions from '../components/TableActions';
import EditableCell from '../components/EditableCell';
import { renderCell } from '@/shared/utils/cellRenderer';

/**
 * TableMultiLevel - Tabla multinivel con nested tables independientes.
 * Cada nivel tiene su propio <table> con sus propias columnas.
 * Al expandir una fila se inserta una tabla hija dentro de un <td colSpan>.
 *
 * Modo síncrono (default): usa `data` + `useMultiLevelGrouping` para agrupar.
 * Modo asíncrono: pasa `onExpand` + `childrenData` + `childrenLoading` para carga diferida.
 *
 * @param {Array} data            - Datos planos a agrupar (modo síncrono) o datos del nivel actual (modo async)
 * @param {Array} levelConfigs    - Configuración por nivel: [{ headers, boundColumn, actions, field }]
 * @param {Function} onExpand     - Callback al expandir: (level, parentValue) => void
 * @param {Object} childrenData   - Datos de hijos por nodo: { [`${levelIndex}-${parentValue}`]: rows[] }
 * @param {Object} childrenLoading - Estado de carga: { [`${levelIndex}-${parentValue}`]: boolean }
 * @param {number} _depth         - Interno: profundidad actual (no pasar desde fuera)
 * @param {number} _levelIndex    - Interno: índice del nivel actual (no pasar desde fuera)
 */
const TableMultiLevel = ({
  data,
  levelConfigs,
  onExpand,
  childrenData,
  childrenLoading,
  _depth = 0,
  _levelIndex = 0,
  editingData = {},
  onCellChange,
  saveMode = 'auto',
  onSaveSuccess,
  onSaveError,
  editFunctions = {}
}) => {
  const isAsyncMode = !!onExpand;
  const groupedData = useMultiLevelGrouping(data, levelConfigs);
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const toggle = (key) => setExpandedKeys(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const config      = levelConfigs[0];
  const subConfigs  = levelConfigs.slice(1);
  const isLastLevel = subConfigs.length === 0;
  const headers     = config?.headers?.filter(h => h?.title) || [];
  const actions     = config?.actions;
  const boundColumn = config?.boundColumn;

  const hasActions = actions
    ? Object.values(actions).some(v => {
        if (Array.isArray(v)) return v.some(i => i.enabled !== false);
        if (typeof v === 'object' && v !== null) return v.enabled === true;
        return false;
      })
    : false;

  const colSpanAll = headers.length + (hasActions ? 1 : 0) + 1;

  // En modo async, los datos ya son filas planas del nivel actual
  const rows = isAsyncMode ? data : groupedData;

  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    if (_depth > 0) {
      return (
        <p className="text-xs text-gray-400 italic px-4 py-2">Sin registros</p>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-gray-900 font-medium text-sm mb-1">No hay datos para mostrar</h3>
        <p className="text-gray-400 text-sm">Los registros aparecerán aquí una vez que sean creados.</p>
      </div>
    );
  }

  const getCellValue = (row, field) => {
    const rowId = boundColumn ? row[boundColumn] : null;
    if (rowId == null) return row[field];
    return editingData[boundColumn]?.[rowId]?.[field] ?? row[field];
  };

  const handleExpand = (row) => {
    const boundValue = boundColumn ? row[boundColumn] : null;
    const key = `${boundValue}`;
    const isExpanded = expandedKeys.has(key);

    if (!isExpanded && isAsyncMode) {
      onExpand(_levelIndex + 1, boundValue);
    }
    toggle(key);
  };

  return (
    <div className={_depth > 0 ? 'border border-slate-200 rounded-lg overflow-hidden' : 'w-full'}>
      <table className="min-w-full divide-y divide-gray-100">
        {/* ── Header de este nivel ── */}
        <thead className={_depth === 0 ? 'bg-slate-50/80 border-b border-slate-200/60' : 'bg-slate-100/60 border-b border-slate-200/40'}>
          <tr>
            {/* Columna expand (solo si hay subniveles) */}
            {!isLastLevel && (
              <th className="w-10 px-3 py-3" />
            )}
            {headers.map(header => (
              <th
                key={header.title}
                className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {header.label || header.title}
              </th>
            ))}
            {hasActions && (
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="bg-white divide-y divide-gray-100">
          {(isAsyncMode ? rows : groupedData).map((item, idx) => {
            // Modo async: item es una fila plana
            // Modo síncrono: item es un grupo de useMultiLevelGrouping
            const rowData    = isAsyncMode ? item : (item.rows[0] || {});
            const boundValue = boundColumn ? rowData[boundColumn] : null;
            const expandKey  = `${boundValue}`;
            const isOpen     = expandedKeys.has(expandKey);

            // Modo síncrono: canExpand basado en children
            // Modo async: siempre se puede expandir (carga al click)
            const canExpand  = isAsyncMode
              ? !isLastLevel
              : !isLastLevel && item.children?.length > 0 && item.config?.visible !== false;

            const displayRow = rowData;

            return (
              <React.Fragment key={isAsyncMode ? (boundValue ?? idx) : item.key}>
                {/* Fila principal */}
                <tr className={`transition-colors duration-150 border-b border-gray-100 ${
                  isLastLevel
                    ? 'hover:bg-blue-50/40'
                    : isOpen
                      ? 'bg-slate-50 hover:bg-slate-100/60'
                      : 'bg-white hover:bg-slate-50/60'
                }`}>
                  {/* Botón expand */}
                  {!isLastLevel && (
                    <td className="w-10 px-3 py-3 text-center">
                      {canExpand && (
                        <button
                          onClick={() => handleExpand(displayRow)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 text-slate-500"
                          title={isOpen ? 'Contraer' : 'Expandir'}
                        >
                          <svg
                            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}

                  {/* Celdas de datos */}
                  {headers.map((header, hidx) => {
                    const isGroupByCol = !isAsyncMode && (header.groupBy === true || header.title === item.field);
                    const field = header.field || header.title;
                    const cellValue = getCellValue(displayRow, field);
                    const originalValue = displayRow[field];

                    if (header.editable && onCellChange && !isGroupByCol) {
                      return (
                        <EditableCell
                          key={header.title}
                          column={{ ...header, field }}
                          value={cellValue}
                          originalValue={originalValue}
                          rowData={displayRow}
                          rowId={boundValue}
                          primaryKey={boundColumn}
                          onCellChange={(rowId, field, newValue) => onCellChange?.(rowId, field, newValue, boundColumn)}
                          editFunction={editFunctions[field]}
                          saveMode={saveMode}
                          onSaveSuccess={(rowId, field, newValue) => onSaveSuccess?.(rowId, field, newValue, boundColumn, displayRow, header)}
                          onSaveError={(rowId, field, error) => onSaveError?.(rowId, field, error, boundColumn, displayRow, header)}
                        />
                      );
                    }

                    return (
                      <td key={header.title} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {isGroupByCol && !isLastLevel ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{item.value}</span>
                            {(() => {
                              const validCount = item.children?.reduce((acc, child) =>
                                child?.config?.visible !== false && child?.value !== 'null' && child?.rows
                                  ? acc + child.rows.length : acc, 0) || 0;
                              if (validCount <= 0) return null;
                              const lbl = item.config.childCountLabel || { singular: 'registro', plural: 'registros' };
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  {validCount} {validCount === 1 ? lbl.singular : lbl.plural}
                                </span>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className={hidx === 0 ? 'font-medium text-gray-800' : ''}>
                            {(() => {
                              const mainValue = typeof header.displayValue === 'function'
                                ? header.displayValue(displayRow)
                                : originalValue;
                              const subtitleField = header.subtitle?.field;
                              const renderedValue = subtitleField
                                ? { primary: mainValue, secondary: displayRow[subtitleField] }
                                : mainValue;
                              const columnType = subtitleField ? 'stacked' : header.type;
                              return renderCell(renderedValue, 0, header.title, columnType, header.colorMap);
                            })()}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Acciones */}
                  {hasActions && (
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                      <TableActions
                        actions={actions}
                        row={displayRow}
                        rowIndex={boundValue}
                        cellClassName=""
                      />
                    </td>
                  )}
                </tr>

                {/* Fila de expansión — tabla hija */}
                {!isLastLevel && isOpen && canExpand && (
                  <tr className="bg-slate-50/40">
                    <td
                      colSpan={colSpanAll}
                      className="px-0 py-0"
                    >
                      {isAsyncMode ? (
                        // Modo async: cargar hijos desde childrenData
                        (() => {
                          const cacheKey = `${_levelIndex + 1}-${boundValue}`;
                          const childLoading = childrenLoading?.[cacheKey];
                          const childData = childrenData?.[cacheKey];

                          if (childLoading) {
                            return (
                              <div className="flex items-center justify-center py-8">
                                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
                                <p className="text-gray-500 text-sm">Cargando...</p>
                              </div>
                            );
                          }

                          if (childData && childData.length > 0) {
                            return (
                              <TableMultiLevel
                                data={childData}
                                levelConfigs={subConfigs}
                                onExpand={onExpand}
                                childrenData={childrenData}
                                childrenLoading={childrenLoading}
                                _depth={_depth + 1}
                                _levelIndex={_levelIndex + 1}
                                editingData={editingData}
                                onCellChange={onCellChange}
                                saveMode={saveMode}
                                onSaveSuccess={(rowId, field, newValue, primaryKey, rowData, header) => onSaveSuccess?.(rowId, field, newValue, primaryKey, rowData, header)}
                                onSaveError={(rowId, field, error, primaryKey, rowData, header) => onSaveError?.(rowId, field, error, primaryKey, rowData, header)}
                                editFunctions={editFunctions}
                              />
                            );
                          }

                          return (
                            <p className="text-xs text-gray-400 italic px-4 py-3">Sin registros</p>
                          );
                        })()
                      ) : (
                        // Modo síncrono: tabla recursiva con datos agrupados
                        <TableMultiLevel
                          data={item.rows}
                          levelConfigs={subConfigs}
                          _depth={_depth + 1}
                          _levelIndex={_levelIndex + 1}
                          editingData={editingData}
                          onCellChange={onCellChange}
                          saveMode={saveMode}
                          onSaveSuccess={(rowId, field, newValue, primaryKey, rowData, header) => onSaveSuccess?.(rowId, field, newValue, primaryKey, rowData, header)}
                          onSaveError={(rowId, field, error, primaryKey, rowData, header) => onSaveError?.(rowId, field, error, primaryKey, rowData, header)}
                          editFunctions={editFunctions}
                        />
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableMultiLevel;
