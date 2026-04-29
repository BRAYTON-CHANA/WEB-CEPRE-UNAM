import React, { useState, useMemo } from 'react';
import TablePagination from '../components/TablePagination';
import TableActions from '../components/TableActions';
import TableControls from '../components/TableControls';
import CreateButton from '../components/CreateButton';
import SelectionInfo from '../components/SelectionInfo';
import SmartColumn from '../components/SmartColumn';
import TableLoading from '../components/TableLoading';
import { useTableSort, useTableSelection, useTableExpansion, useTableFilters, useTableData, useTableStyles, useTablePagination, useTableGrouping } from '../hooks';
import { getDataType, processHeader, getUniqueValues } from '../../../shared/utils/dataUtils';
import { getContextualUniqueValues, getOriginalUniqueValues } from '../utils/dataUtils';
import { renderCell } from '../../../shared/utils/cellRenderer.jsx';
import { renderExpandedContent, calculateColumnSpan } from '../utils/tableUtils.jsx';
import { 
  TABLE_DEFAULTS, 
  TABLE_CLASSES, 
  SCROLL_CLASSES
} from '../constants/tableConstants';

/**
 * Componente Table reutilizable y altamente personalizable
 * Soporta numeración, ordenamiento, selección y múltiples variantes visuales
 */
const Table = ({ 
  // Props requeridos
  headers, 
  data, 
  actions,
  
  // Props opcionales - Filtros fijos
  fixatedFilters = null,  // Array de {column, op, value}
  
  // Props opcionales - Visual y Presentación
  showCount = TABLE_DEFAULTS.showCount,
  emptyMessage = TABLE_DEFAULTS.emptyMessage,
  variant = TABLE_DEFAULTS.variant,
  striped = TABLE_DEFAULTS.striped,
  hover = TABLE_DEFAULTS.hover,
  bordered = TABLE_DEFAULTS.bordered,
  
  // Props opcionales - Funcionalidades
  sortable = TABLE_DEFAULTS.sortable,
  selectable = TABLE_DEFAULTS.selectable,
  expandable = TABLE_DEFAULTS.expandable,
  groupable = TABLE_DEFAULTS.groupable,
  filterable = TABLE_DEFAULTS.filterable,
  pagination = TABLE_DEFAULTS.pagination,
  
  // Props opcionales - Control de Ancho
  fit = TABLE_DEFAULTS.fit,
  
  // Props opcionales - Selección avanzada
  boundColumn = TABLE_DEFAULTS.boundColumn,
  onGetSelects = TABLE_DEFAULTS.onGetSelects,
  
  // Props opcionales - Personalización
  className = TABLE_DEFAULTS.className,
  headerClassName = TABLE_DEFAULTS.headerClassName,
  rowClassName = TABLE_DEFAULTS.rowClassName,
  cellClassName = TABLE_DEFAULTS.cellClassName,
  
  // Props opcionales - Comportamiento
  loading = TABLE_DEFAULTS.loading,
  onRowClick = TABLE_DEFAULTS.onRowClick,
  onSort = TABLE_DEFAULTS.onSort,
  onSelect = TABLE_DEFAULTS.onSelect,
  
  // Props opcionales - Paginación
  itemsPerPage = TABLE_DEFAULTS.itemsPerPage,
  currentPage = TABLE_DEFAULTS.currentPage,
  onPageChange = TABLE_DEFAULTS.onPageChange
}) => {
  // Refs para tracking de cambios (evitar logs excesivos)
  const lastDataRef = React.useRef(0);
  const lastHeadersRef = React.useRef(0);
  const headersLoggedRef = React.useRef(false);

  // Hooks personalizados reutilizables (deben ir primero)
  const { sortConfig, handleSort } = useTableSort(sortable, onSort);
  const { selectedRows, handleSelect, handleSelectAll, getSelectedValues } = useTableSelection(data, onSelect, boundColumn, onGetSelects);
  const { handleExpand, isExpanded } = useTableExpansion();
  const { activeFilters, handleFilterChange, clearAllFilters, hasActiveFilters, initializeColumnFilters, resetColumnInitialization } = useTableFilters(filterable);

  // Hooks específicos del componente
  const { preFilteredData, processedData } = useTableData({
    data,
    fixatedFilters,
    sortable,
    sortConfig,
    filterable,
    activeFilters
  });
  
  const { groupedData, handleGroupExpand, isGroupExpanded } = useTableGrouping(groupable, processedData);
  
  const { getTableClasses, getHeaderClasses, getRowClasses, getContainerClasses, getCellClasses, getInteractiveClasses } = useTableStyles({
    variant,
    bordered,
    className,
    headerClassName,
    rowClassName,
    hover,
    striped,
    fit
  });

  // Hook de paginación
  const { 
    localItemsPerPage, 
    localCurrentPage, 
    paginatedData, 
    handleItemsPerPageChange, 
    handlePageChange 
  } = useTablePagination({
    itemsPerPage,
    currentPage,
    onPageChange,
    pagination
  });

  // Track data changes
  if (data.length !== lastDataRef.current || headers.length !== lastHeadersRef.current) {
    lastDataRef.current = data.length;
    lastHeadersRef.current = headers.length;
    headersLoggedRef.current = false;
  }

  // Inicializar filtros con todos los valores seleccionados por defecto
  React.useEffect(() => {
    if (filterable && headers.length > 0 && data.length > 0) {
      headers.forEach(header => {
        const headerInfo = processHeader(header);
        const uniqueValues = getUniqueValues(data, headerInfo.title);
        // Pasar solo el title para evitar bucle infinito
        initializeColumnFilters(headerInfo.title, uniqueValues);
      });
    }
  }, [filterable, headers.length, data.length]);

  // Detectar cambios en datos y resetear filtros para reinicialización
  const dataSignatureRef = React.useRef(null);
  
  React.useEffect(() => {
    // Crear firma simple de los datos
    const newSignature = data.length > 0 
      ? `${data.length}-${headers.map(h => processHeader(h).title).join(',')}`
      : 'empty';
    
    // Si la firma cambió, los datos son diferentes - resetear filtros
    if (dataSignatureRef.current && dataSignatureRef.current !== newSignature) {
      resetColumnInitialization();
    }
    
    dataSignatureRef.current = newSignature;
  }, [data.length, headers]);
  // Renderizado de celda
  const renderCellWrapper = (row, header, rowIndex, columnType) => {
    return renderCell(row[header], rowIndex, header, columnType);
  };

  // Renderizado de contenido expandible
  const renderExpandedContentWrapper = (row) => {
    return renderExpandedContent(row, expandable);
  };

  
  
  // Memoizar procesamiento de headers para evitar ciclos de renderizado
  const processedHeaders = React.useMemo(() => {
    // Calculate processed headers with all needed metadata
    if (!data.length > 0 || !headers.length > 0) {
      return [];
    }
    
    return headers.map((header, index) => {
      const { title, type } = processHeader(header);
      const columnDataType = header.type || getDataType(preFilteredData, title);
      // ← CAMBIO CRÍTICO: Usar preFilteredData para calcular uniqueValues
      // Así el menú de filtros solo muestra valores que pasaron fixatedFilters
      const columnUniqueValues = getContextualUniqueValues(preFilteredData, activeFilters, title);
      const columnOriginalValues = getOriginalUniqueValues(preFilteredData, title);
      
      // Track headers logged (solo una vez)
      if (index === 0 && !headersLoggedRef.current) {
        headersLoggedRef.current = true;
      }
      
      return {
        original: header,
        processed: { title, type },
        detectedType: columnDataType,
        uniqueValues: columnUniqueValues,
        originalValues: columnOriginalValues,
        index
      };
    });
  }, [headers.length, data.length, activeFilters, preFilteredData]);

  // Función para verificar si hay acciones de fila que mostrar
  const hasRowActions = () => {
    return (
      actions?.edit?.enabled ||
      actions?.delete?.enabled ||
      (actions?.custom && actions.custom.length > 0)
    );
  };

  // Calcular valores originales para todas las columnas
  const originalValues = React.useMemo(() => {
    const values = {};
    headers.forEach(header => {
      values[header] = getOriginalUniqueValues(data, header);
    });
    return values;
  }, [headers, data]);

  
  return (
    <div>
      {/* Botones superiores */}
      <div className="flex justify-between items-center mb-4">
        {/* Botón de crear */}
        <CreateButton 
          action={actions?.create} 
          loading={loading} 
        />
        
        {/* Información de selección */}
        <SelectionInfo 
          selectedCount={selectedRows.size}
          getSelectedValues={getSelectedValues}
          boundColumn={boundColumn}
        />
      </div>
      
      {/* Estado de carga */}
      {loading && <TableLoading />}
      
      {/* Contenedor de la tabla con overflow visible para menús */}
      <div className={getContainerClasses()}>
      <table className={getTableClasses()}>
        <thead className={getHeaderClasses()}>
          <tr>
            {/* Columna inteligente: conteo o expansión */}
            {(showCount || expandable) && (
              <th className={`${fit ? TABLE_CLASSES.header.fitBase : TABLE_CLASSES.header.base} ${cellClassName}`}>
                {showCount ? '#' : ''}
              </th>
            )}
            
            {/* Columna de selección */}
            {selectable && (
              <th className={`${fit ? TABLE_CLASSES.header.fitBase : TABLE_CLASSES.header.base} ${cellClassName}`}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className={`${TABLE_CLASSES.checkbox} ${getInteractiveClasses()}`}
                />
              </th>
            )}
            
            {/* Encabezados de datos */}
            {processedHeaders.map((headerData, index) => {
              const { original: header, processed: { title, type }, detectedType: columnDataType, uniqueValues: columnUniqueValues, originalValues: columnOriginalValues } = headerData;
              
              return (
                <th
                  key={headerData.index}
                  className={`${getHeaderClasses()} ${cellClassName}`}
                >
                  <div className="flex items-center">
                    {title}
                    <TableControls
                      sortable={sortable}
                      filterable={filterable}
                      header={title}
                      uniqueValues={columnUniqueValues}
                      originalValues={columnOriginalValues}
                      activeFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                      dataType={columnDataType}
                      sortConfig={sortConfig}
                      onSortSelect={handleSort}
                    />
                  </div>
                </th>
              );
            })}
            
            {/* Columna de acciones */}
            {hasRowActions() && (
              <th className={`${TABLE_CLASSES.header.base} ${cellClassName}`}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-200">
          {groupable?.active && groupedData ? (
            // Modo agrupado
            groupedData.map((group, groupIndex) => {
              const isGroupExpandedState = isGroupExpanded(group.key);
              
              return (
                <React.Fragment key={group.key}>
                  {/* Fila de grupo */}
                  <tr 
                    className={`${groupable.className || 'bg-white text-black font-semibold'} cursor-pointer hover:bg-gray-50`}
                    onClick={() => handleGroupExpand(group.key)}
                  >
                    {/* Columna de conteo/expansión */}
                    <td className={`px-6 py-3 whitespace-nowrap text-sm ${cellClassName}`}>
                      <div className="flex items-center">
                        {/* Botón expandir grupo */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroupExpand(group.key);
                          }}
                          className="p-1 rounded hover:bg-gray-100 transition-colors mr-2"
                          title={isGroupExpandedState ? "Contraer grupo" : "Expandir grupo"}
                        >
                          <svg 
                            className={`w-4 h-4 text-gray-600 transition-transform ${isGroupExpandedState ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {/* Valor del grupo + conteo */}
                        <span>
                          {group.value} ({group.count})
                        </span>
                      </div>
                    </td>
                    
                    {/* Columna de selección */}
                    {selectable && (
                      <td className={`px-6 py-3 whitespace-nowrap text-sm ${cellClassName}`}>
                        <input
                          type="checkbox"
                          checked={group.indices.every(idx => selectedRows.has(idx))}
                          onChange={(e) => {
                            group.indices.forEach(idx => handleSelect(idx, e.target.checked));
                          }}
                          className={`${TABLE_CLASSES.checkbox} ${getInteractiveClasses()}`}
                        />
                      </td>
                    )}
                    
                    {/* Columnas vacías para alinear con headers */}
                    {headers.map((_, colIndex) => (
                      <td key={colIndex} className={`px-6 py-3 whitespace-nowrap text-sm ${cellClassName}`}></td>
                    ))}
                    
                    {/* Columna de acciones */}
                    {hasRowActions() && (
                      <td className={`px-6 py-3 whitespace-nowrap text-sm ${cellClassName}`}></td>
                    )}
                  </tr>
                  
                  {/* Filas de datos del grupo (cuando expandido) */}
                  {isGroupExpandedState && group.rows.map((row, rowIndex) => {
                    const actualIndex = data.indexOf(row);
                    const isRowExpanded = isExpanded(actualIndex);
                    const isSelected = selectedRows.has(actualIndex);
                    
                    return (
                      <React.Fragment key={`${group.key}-${rowIndex}`}>
                        <tr 
                          className={getRowClasses(rowIndex, isRowExpanded)}
                          onClick={() => onRowClick && onRowClick(row, actualIndex)}
                        >
                          {/* Columna inteligente: conteo o expansión */}
                          <SmartColumn
                            showCount={showCount}
                            expandable={expandable}
                            actualIndex={actualIndex}
                            isExpanded={isRowExpanded}
                            onExpand={handleExpand}
                            cellClassName={cellClassName}
                          />
                          
                          {/* Selección */}
                          {selectable && (
                            <td className={`${getCellClasses()} ${cellClassName}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelect(actualIndex, e.target.checked)}
                                className={`${TABLE_CLASSES.checkbox} ${getInteractiveClasses()}`}
                              />
                            </td>
                          )}
                          
                          {/* Datos */}
                          {headers.map((header, colIndex) => {
                            const { title, type } = processHeader(header);
                            const columnDataType = header.type || getDataType(data, title);
                            return (
                              <td key={colIndex} className={`${getCellClasses()} ${cellClassName}`}>
                                {renderCellWrapper(row, title, rowIndex, columnDataType)}
                              </td>
                            );
                          })}
                          
                          {/* Acciones */}
                          {hasRowActions() && (
                            <td className={`${getCellClasses()} ${cellClassName}`}>
                              <TableActions
                                actions={actions}
                                row={row}
                                rowIndex={actualIndex}
                                cellClassName={cellClassName}
                              />
                            </td>
                          )}
                        </tr>
                        
                        {/* Contenido expandible */}
                        {isRowExpanded && (
                          <tr>
                            <td 
                              colSpan={calculateColumnSpan(headers.length, showCount, selectable, expandable, hasRowActions())}
                              className="p-0"
                            >
                              {renderExpandedContentWrapper(row)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })
          ) : (
            // Modo normal (sin agrupación)
            paginatedData(processedData).length === 0 ? (
              <tr>
                <td 
                  colSpan={calculateColumnSpan(headers.length, showCount, selectable, expandable, hasRowActions())}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData(processedData).map((row, rowIndex) => {
                const actualIndex = data.indexOf(row);
                const isRowExpanded = isExpanded(actualIndex);
                const isSelected = selectedRows.has(actualIndex);
                
                return (
                  <React.Fragment key={rowIndex}>
                    <tr 
                      className={getRowClasses(rowIndex, isRowExpanded)}
                      onClick={() => onRowClick && onRowClick(row, actualIndex)}
                    >
                      {/* Columna inteligente: conteo o expansión */}
                      <SmartColumn
                        showCount={showCount}
                        expandable={expandable}
                        actualIndex={actualIndex}
                        isExpanded={isRowExpanded}
                        onExpand={handleExpand}
                        cellClassName={cellClassName}
                      />
                      
                      {/* Selección */}
                      {selectable && (
                        <td className={`${getCellClasses()} ${cellClassName}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelect(actualIndex, e.target.checked)}
                            className={`${TABLE_CLASSES.checkbox} ${getInteractiveClasses()}`}
                          />
                        </td>
                      )}
                      
                      {/* Datos */}
                      {headers.map((header, colIndex) => {
                        const { title, type } = processHeader(header);
                        const columnDataType = header.type || getDataType(data, title);
                        return (
                          <td key={colIndex} className={`${getCellClasses()} ${cellClassName}`}>
                            {renderCellWrapper(row, title, rowIndex, columnDataType)}
                          </td>
                        );
                      })}
                      
                      {/* Acciones */}
                      {hasRowActions() && (
                        <td className={`${getCellClasses()} ${cellClassName}`}>
                          <TableActions
                            actions={actions}
                            row={row}
                            rowIndex={actualIndex}
                            cellClassName={cellClassName}
                          />
                        </td>
                      )}
                    </tr>
                    
                    {/* Contenido expandible */}
                    {isRowExpanded && (
                      <tr>
                        <td 
                          colSpan={calculateColumnSpan(headers.length, showCount, selectable, expandable, hasRowActions())}
                          className="p-0"
                        >
                          {renderExpandedContentWrapper(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )
          )}
        </tbody>
      </table>
      </div>
      
      {/* Paginación */}
      <TablePagination
        pagination={pagination}
        processedData={processedData}
        itemsPerPage={localItemsPerPage}
        currentPage={localCurrentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default Table;
