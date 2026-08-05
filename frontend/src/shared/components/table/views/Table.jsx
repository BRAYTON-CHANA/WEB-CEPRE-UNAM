import React from 'react';
import TablePagination from '../components/TablePagination';
import TableActions from '../components/TableActions';
import TableControls from '../components/TableControls';
import { useTableSort, useTableSelection, useTableData, useTableStyles, useTablePagination } from '../hooks';
import { getDataType, processHeader } from '../../../utils/dataUtils';
import { renderCell } from '../../../utils/cellRenderer.jsx';
import { TABLE_DEFAULTS, TABLE_CLASSES } from '../constants/tableConstants';

/**
 * Table — componente de tabla genérico y reutilizable.
 * Soporta: numeración, sort, selección con checkboxes, paginación, acciones de fila.
 */
const Table = ({
  headers,
  data,
  actions,

  fixatedFilters = null,

  showCount    = TABLE_DEFAULTS.showCount,
  emptyMessage = TABLE_DEFAULTS.emptyMessage,
  variant      = TABLE_DEFAULTS.variant,
  striped      = TABLE_DEFAULTS.striped,
  hover        = TABLE_DEFAULTS.hover,
  bordered     = TABLE_DEFAULTS.bordered,

  sortable   = TABLE_DEFAULTS.sortable,
  selectable = TABLE_DEFAULTS.selectable,
  pagination = TABLE_DEFAULTS.pagination,

  fit = TABLE_DEFAULTS.fit,

  boundColumn = TABLE_DEFAULTS.boundColumn,
  onGetSelects = TABLE_DEFAULTS.onGetSelects,

  className       = TABLE_DEFAULTS.className,
  headerClassName = TABLE_DEFAULTS.headerClassName,
  rowClassName    = TABLE_DEFAULTS.rowClassName,
  cellClassName   = TABLE_DEFAULTS.cellClassName,

  loading    = TABLE_DEFAULTS.loading,
  onRowClick = TABLE_DEFAULTS.onRowClick,
  onSort     = TABLE_DEFAULTS.onSort,
  onSelect   = TABLE_DEFAULTS.onSelect,

  itemsPerPage       = TABLE_DEFAULTS.itemsPerPage,
  currentPage        = TABLE_DEFAULTS.currentPage,
  onPageChange       = TABLE_DEFAULTS.onPageChange,
  paginationClassName = TABLE_DEFAULTS.paginationClassName,
}) => {
  const { sortConfig, handleSort } = useTableSort(sortable, onSort);
  const { selectedRows, handleSelect, handleSelectAll, getSelectedValues } = useTableSelection(data, onSelect, boundColumn, onGetSelects);
  const { processedData } = useTableData({ data, fixatedFilters, sortable, sortConfig });
  const { getTableClasses, getHeaderClasses, getRowClasses, getContainerClasses, getCellClasses, getInteractiveClasses } = useTableStyles({
    variant, bordered, className, headerClassName, rowClassName, hover, striped, fit
  });
  const { localItemsPerPage, localCurrentPage, paginatedData, handleItemsPerPageChange, handlePageChange } = useTablePagination({
    itemsPerPage, currentPage, onPageChange, pagination
  });

  const processedHeaders = React.useMemo(() => {
    if (!headers.length) return [];
    return headers.map((header, index) => {
      const meta = processHeader(header);
      const detectedType = meta.type !== 'string' ? meta.type : getDataType(data, meta.field);
      return { ...meta, detectedType, index };
    });
  }, [headers, data]);

  const renderCellForColumn = (row, meta, rowIndex) => {
    if (meta.render) {
      return meta.render(row[meta.field], row);
    }
    if (meta.fields && meta.type === 'stacked') {
      const [primaryField, secondaryField] = meta.fields;
      return renderCell(
        { primary: row[primaryField], secondary: row[secondaryField] },
        rowIndex, meta.title, 'stacked', meta.colorMap
      );
    }
    return renderCell(row[meta.field], rowIndex, meta.field, meta.detectedType, meta.colorMap);
  };

  const hasRowActions = () =>
    actions?.edit?.enabled ||
    actions?.delete?.enabled ||
    (actions?.custom  && actions.custom.length  > 0) ||
    (actions?.direct  && actions.direct.length  > 0) ||
    (actions?.dropdown && actions.dropdown.length > 0);

  const colSpan = headers.length + (showCount ? 1 : 0) + (selectable ? 1 : 0) + (hasRowActions() ? 1 : 0);

  return (
    <div>
      {/* Loading inline */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      <div className={getContainerClasses()}>
        <table className={getTableClasses()}>
          <thead className={getHeaderClasses()}>
            <tr>
              {showCount && (
                <th className={`${fit ? TABLE_CLASSES.header.fitBase : TABLE_CLASSES.header.base} ${cellClassName}`}>#</th>
              )}
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
              {processedHeaders.map((h) => {
                const sortable_col = sortable && !h.render && !(h.fields && h.fields.length > 1);
                return (
                  <th key={h.index} className={`${getHeaderClasses()} ${cellClassName}`}>
                    <div className="flex items-center">
                      {h.title}
                      <TableControls
                        sortable={sortable_col}
                        header={h.field}
                        dataType={h.detectedType}
                        sortConfig={sortConfig}
                        onSortSelect={handleSort}
                      />
                    </div>
                  </th>
                );
              })}
              {hasRowActions() && (
                <th className={`${TABLE_CLASSES.header.base} ${cellClassName}`}>Acciones</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedData(processedData).length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData(processedData).map((row, rowIndex) => {
                const actualIndex = data.indexOf(row);
                const isSelected = selectedRows.has(actualIndex);
                return (
                  <tr
                    key={rowIndex}
                    className={getRowClasses(rowIndex)}
                    onClick={() => onRowClick && onRowClick(row, actualIndex)}
                  >
                    {showCount && (
                      <td className={`${fit ? TABLE_CLASSES.header.fitBase : TABLE_CLASSES.header.base} ${cellClassName}`}>
                        {actualIndex + 1}
                      </td>
                    )}
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
                    {processedHeaders.map((meta) => (
                      <td key={meta.index} className={`${getCellClasses()} ${cellClassName}`}>
                        {renderCellForColumn(row, meta, rowIndex)}
                      </td>
                    ))}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        pagination={pagination}
        processedData={processedData}
        itemsPerPage={localItemsPerPage}
        currentPage={localCurrentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        paginationClassName={paginationClassName}
      />
    </div>
  );
};

export default Table;
