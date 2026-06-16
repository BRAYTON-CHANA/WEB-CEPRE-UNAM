import React, { useState, useMemo } from 'react';
import { useMultiLevelGrouping } from '../hooks/useMultiLevelGrouping';
import TableActions from '../components/TableActions';
import { TABLE_CLASSES } from '../constants/tableConstants';
import { renderCell } from '@/shared/utils/cellRenderer';

/**
 * TableMultiLevelRender - Tabla multinivel profesional
 * Renderiza datos agrupados en tabla HTML con expandible/colapsable y acciones
 */
const TableMultiLevelRender = ({ data, levelConfigs }) => {
  // Agrupar datos según levelConfigs usando custom hook
  const groupedData = useMultiLevelGrouping(data, levelConfigs);
  
  // Estado para tracking de grupos expandidos
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Toggle expansión de grupo
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Verificar si grupo está expandido
  const isGroupExpanded = (groupKey) => expandedGroups.has(groupKey);

  // Calcular boundValue para acciones
  const getBoundValue = (row, boundColumn) => {
    if (!boundColumn) return null;
    return row[boundColumn];
  };

  // Obtener acciones del nivel actual
  const getLevelActions = (level) => {
    return levelConfigs[level - 1]?.actions;
  };

  // Obtener boundColumn del nivel actual
  const getBoundColumn = (level) => {
    return levelConfigs[level - 1]?.boundColumn;
  };

  // Calcular máximo de columnas de datos entre todos los niveles
  // Un nivel con field + headers usa 1 (field) + headers.length columnas
  const maxDataColumns = useMemo(() => {
    if (!levelConfigs.length) return 1;
    const maxHeaders = Math.max(
      ...levelConfigs.map(config => {
        const headerCount = (config.headers?.filter(h => h?.title) || []).length;
        return config.field ? 1 + headerCount : headerCount;
      })
    );
    return Math.max(maxHeaders, 1);
  }, [levelConfigs]);

  // Verificar si hay acciones en algún nivel (dinámico: objetos con enabled o arrays no vacíos)
  const hasAnyActions = useMemo(() => {
    return levelConfigs.some(config => {
      if (!config.actions) return false;
      return Object.values(config.actions).some(value => {
        if (Array.isArray(value)) return value.length > 0 && value.some(item => item.enabled !== false);
        if (typeof value === 'object' && value !== null) return value.enabled === true;
        return false;
      });
    });
  }, [levelConfigs]);

  // Renderizar fila de datos individual
  const renderDataRow = (row, headers, level, depth) => {
    const indent = depth * 24; // 24px por nivel de profundidad
    const actions = getLevelActions(level);
    const boundColumn = getBoundColumn(level);
    const boundValue = getBoundValue(row, boundColumn);

    const hasActions = (() => {
      if (!actions) return false;
      return Object.values(actions).some(value => {
        if (Array.isArray(value)) return value.length > 0 && value.some(item => item.enabled !== false);
        if (typeof value === 'object' && value !== null) return value.enabled === true;
        return false;
      });
    })();

    // Generar celdas vacías si hay menos headers que maxDataColumns
    const emptyCells = maxDataColumns - headers.length;

    return (
      <tr key={`${level}-${JSON.stringify(row)}`} className="hover:bg-blue-50/40 transition-colors duration-150 border-b border-gray-100">
        {/* Columnas de datos */}
        {headers.map((header, idx) => (
          <td key={header.title} className="px-5 py-3 whitespace-nowrap text-sm text-gray-700" style={idx === 0 ? { paddingLeft: `${indent + 20}px` } : {}}>
            <span className="font-medium text-gray-800">
              {renderCell(row[header.title], 0, header.title, header.type)}
            </span>
          </td>
        ))}

        {/* Celdas vacías para alinear */}
        {emptyCells > 0 && Array.from({ length: emptyCells }).map((_, idx) => (
          <td key={`empty-${idx}`} className="px-5 py-3 whitespace-nowrap text-sm text-gray-700"></td>
        ))}

        {/* Columna de acciones */}
        {hasAnyActions && (
          <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700">
            {hasActions && (
              <TableActions
                actions={actions}
                row={row}
                rowIndex={boundValue}
                cellClassName=""
              />
            )}
          </td>
        )}
      </tr>
    );
  };

  // Renderizar grupo padre
  const renderGroupRow = (group, depth) => {
    const indent = depth * 28;
    const isExpanded = isGroupExpanded(group.key);
    const actions = getLevelActions(group.level);
    const boundColumn = getBoundColumn(group.level);
    const boundValue = getBoundValue(group.rows[0], boundColumn);

    const hasActions = (() => {
      if (!actions) return false;
      return Object.values(actions).some(value => {
        if (Array.isArray(value)) return value.length > 0 && value.some(item => item.enabled !== false);
        if (typeof value === 'object' && value !== null) return value.enabled === true;
        return false;
      });
    })();
    const isExpandable = group.children && group.children.length > 0 && group.config.visible;

    const isLeafGroup = !group.children || group.children.length === 0;

    return (
      <React.Fragment key={group.key}>
        {/* Fila del grupo */}
        <tr className="bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200/60 transition-colors duration-150">
          {isLeafGroup ? (
            /* Grupo hoja: renderizar celdas individuales por header */
            <>
              {group.config.headers?.map((header, idx) => (
                <td key={header.title} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700" style={idx === 0 ? { paddingLeft: `${indent + 20}px` } : {}}>
                  <span className="font-medium text-gray-800">
                    {renderCell(group.rows[0]?.[header.title], 0, header.title, header.type)}
                  </span>
                </td>
              ))}
              {group.config.headers?.length < maxDataColumns && Array.from({ length: maxDataColumns - group.config.headers.length }).map((_, idx) => (
                <td key={`empty-${idx}`} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700"></td>
              ))}
            </>
          ) : (
            /* Grupo con hijos: renderizar celda de field + celdas de headers */
            <>
              {/* Celda del campo de agrupación (field) */}
              <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700" style={{ paddingLeft: `${indent + 20}px` }}>
                <div className="flex items-center gap-3">
                  {isExpandable && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="flex items-center justify-center w-7 h-7 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 text-slate-600"
                      title={isExpanded ? "Contraer" : "Expandir"}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  <span className="text-sm font-semibold text-slate-700 tracking-tight">{group.value}</span>
                  {(() => {
                    const validCount = group.children?.reduce((acc, child) => {
                      if (child.config.visible !== false && child.value !== 'null' && child.rows) {
                        return acc + child.rows.length;
                      }
                      return acc;
                    }, 0) || 0;
                    if (validCount <= 0) return null;
                    const countLabel = group.config.childCountLabel || { singular: 'registro', plural: 'registros' };
                    const labelText = validCount === 1 ? countLabel.singular : countLabel.plural;
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        {validCount} {labelText}
                      </span>
                    );
                  })()}
                </div>
              </td>
              {/* Celdas de headers adicionales */}
              {group.config.headers?.map((header) => (
                <td key={header.title} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                  <span className="font-medium text-gray-800">
                    {renderCell(group.rows[0]?.[header.title], 0, header.title, header.type)}
                  </span>
                </td>
              ))}
              {/* Celdas vacías para alinear con maxDataColumns */}
              {(() => {
                const totalCols = 1 + (group.config.headers?.length || 0);
                const emptyCount = maxDataColumns - totalCols;
                if (emptyCount > 0) {
                  return Array.from({ length: emptyCount }).map((_, idx) => (
                    <td key={`empty-${idx}`} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700"></td>
                  ));
                }
                return null;
              })()}
            </>
          )}

          {/* Columna de acciones */}
          {hasAnyActions && (
            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
              {hasActions && (
                <TableActions
                  actions={actions}
                  row={group.rows[0]}
                  rowIndex={boundValue}
                  cellClassName=""
                />
              )}
            </td>
          )}
        </tr>

        {/* Filas hijas (cuando expandido) */}
        {isExpanded && group.children && (
          <React.Fragment>
            {/* Header del siguiente nivel */}
            {group.children[0] && group.children[0].config.visible !== false && group.children[0].config.headers?.length > 0 && (
              <tr className="bg-slate-50/60 border-b border-slate-200/40">
                {(() => {
                  const headers = group.children[0].config.headers;
                  return (
                    <>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ paddingLeft: `${indent + 44}px` }}>
                        {headers[0]?.title}
                      </th>
                      {headers.slice(1).map(header => (
                        <th key={header.title} className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {header.title}
                        </th>
                      ))}
                      {hasAnyActions && (
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                      )}
                    </>
                  );
                })()}
              </tr>
            )}
            
            {/* Filas de datos hijas */}
            {(() => {
              const visibleChildren = group.children?.filter(child => 
                child.config.visible !== false && child.value !== 'null'
              ) || [];
              
              if (visibleChildren.length === 0) {
                return (
                  <tr className="bg-white border-b border-gray-200">
                    <td colSpan={maxDataColumns + (hasAnyActions ? 1 : 0)} className="px-4 py-3 text-sm text-gray-400 italic text-center">
                      Sin datos
                    </td>
                  </tr>
                );
              }
              
              return visibleChildren.map(child => {
                if (child.children) {
                  return renderGroupRow(child, depth + 1);
                } else if (child.rows && child.rows.length > 0) {
                  return child.rows.map(row => 
                    renderDataRow(row, child.config.headers, child.level, depth + 1)
                  );
                }
                return null;
              });
            })()}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  if (!groupedData.length) {
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

  // Obtener headers para mostrar en header principal
  const getMainHeaders = () => {
    const firstLevelHeaders = levelConfigs[0]?.headers?.filter(h => h?.title) || [];
    const field = levelConfigs[0]?.field;
    // Si hay field + headers, incluir field como primera columna
    if (field && firstLevelHeaders.length > 0) {
      return [{ title: field }, ...firstLevelHeaders];
    }
    if (firstLevelHeaders.length > 0) {
      return firstLevelHeaders;
    }
    // Si no hay headers, usar el field como columna
    if (field) {
      return [{ title: field }];
    }
    return [];
  };

  const mainHeaders = getMainHeaders();
  const firstLevelHasHeaders = (levelConfigs[0]?.headers?.filter(h => h?.title) || []).length > 0;

  return (
    <div className="w-full">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-slate-50/80 border-b border-slate-200/60">
          <tr>
            {/* Headers del primer nivel */}
            {mainHeaders.map(header => (
              <th
                key={header.title}
                className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                colSpan={firstLevelHasHeaders ? undefined : maxDataColumns}
              >
                {header.title}
              </th>
            ))}

            {/* Celdas vacías para alinear con maxDataColumns (cuando nivel 2 tiene más headers que nivel 1) */}
            {firstLevelHasHeaders && mainHeaders.length < maxDataColumns && Array.from({ length: maxDataColumns - mainHeaders.length }).map((_, idx) => (
              <th key={`empty-th-${idx}`} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
            ))}

            {/* Columna de acciones */}
            {hasAnyActions && (
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-50">
          {groupedData.map(group => renderGroupRow(group, 0))}
        </tbody>
      </table>
    </div>
  );
};

export default TableMultiLevelRender;
