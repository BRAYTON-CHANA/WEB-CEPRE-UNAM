import React, { useState, useMemo } from 'react';
import TablePagination from '../components/TablePagination';
import TableActions from '../components/TableActions';
import TableControls from '../components/TableControls';
import CreateButton from '../components/CreateButton';
import SelectionInfo from '../components/SelectionInfo';
import SmartColumn from '../components/SmartColumn';
import TableLoading from '../components/TableLoading';
import { useTableSort, useTableSelection, useTableExpansion, useTableFilters, useTableData, useTableStyles, useTablePagination } from '../hooks';
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
  const { processedData } = useTableData({
    data,
    sortable,
    sortConfig,
    filterable,
    activeFilters
  });
  
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

  // Console log para debug de datos que llegan al Table (solo en desarrollo y cuando hay cambios reales)
  if (process.env.NODE_ENV === 'development' && (data.length !== lastDataRef.current || headers.length !== lastHeadersRef.current)) {
    console.log(`🔍 Table actualizada:`, {
      dataLength: data.length,
      headersCount: headers.length,
      loading: loading,
      sampleData: data.slice(0, 2).map(row => ({
        id: row.id,
        name: row.name,
        department: row.department
      }))
    });
    lastDataRef.current = data.length;
    lastHeadersRef.current = headers.length;
    // Resetear el ref de headers logged para mostrar nuevos logs si los datos cambian
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
  const renderCellWrapper = (row, header, rowIndex) => {
    return renderCell(row[header], rowIndex, header);
  };

  // Renderizado de contenido expandible
  const renderExpandedContentWrapper = (row) => {
    return renderExpandedContent(row, expandable);
  };

  
  
  // Memoizar procesamiento de headers para evitar ciclos de renderizado
  const processedHeaders = React.useMemo(() => {
    // Solo procesar si hay datos Y headers válidos
    if (!data.length > 0 || !headers.length > 0) {
      return [];
    }
    
    return headers.map((header, index) => {
      const { title, type } = processHeader(header);
      const columnDataType = header.type || getDataType(data, title);
      const columnUniqueValues = getContextualUniqueValues(data, activeFilters, title);
      const columnOriginalValues = getOriginalUniqueValues(data, title);
      
      // Console log para debug de headers y tipos (solo en desarrollo y una sola vez)
      if (process.env.NODE_ENV === 'development' && index === 0 && !headersLoggedRef.current) {
        const allHeadersInfo = headers.map((h, i) => {
          const processed = processHeader(h);
          const dataType = h.type || getDataType(data, processed.title);
          const uniqueVals = getContextualUniqueValues(data, activeFilters, processed.title);
          return {
            index: i,
            title: processed.title,
            type: processed.type,
            detectedType: dataType,
            tipoUsado: h.type ? `PREDEFINIDO (${h.type})` : `AUTODETECTADO (${dataType})`,
            uniqueValuesCount: uniqueVals.length
          };
        });
        
        console.log(`🔍 Headers procesados (${headers.length} totales):`, allHeadersInfo);
        console.log(`📊 Resumen de datos:`, {
          totalRows: data.length,
          totalColumns: headers.length,
          hasFilters: Object.keys(activeFilters).length > 0,
          activeFiltersCount: Object.values(activeFilters).filter(v => v && v.length > 0).length
        });
        
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
  }, [headers.length, data.length, activeFilters]);

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
          {paginatedData(processedData).length === 0 ? (
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
                      const { title } = processHeader(header);
                      return (
                        <td key={colIndex} className={`${getCellClasses()} ${cellClassName}`}>
                          {renderCellWrapper(row, title, rowIndex)}
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
