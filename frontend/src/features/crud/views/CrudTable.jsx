import React, { useState, useEffect, useRef } from 'react';
import { useTableData } from '../hooks/useTableData';
import TableParametersExample from '../components/TableParametersExample';
import Table from '@/features/table/views/Table';

/**
 * Componente CrudTable
 * Recibe tableName, headers y todas las props de Table (excepto data/records)
 */
function CrudTable({ 
  tableName, 
  headers = [],
  tableActions = {},
  refreshTrigger = 0,  // Prop para forzar refresh automático
  // Props agrupados para el componente Table
  tableComponentParameters = {}
}) {
  const { schema, records, loading, error, refresh } = useTableData(tableName);

  // Key para forzar recreación del Table cuando se recargan datos
  const [tableKey, setTableKey] = useState(0);
  const lastLoadingRef = useRef(loading);

  // Detectar cuando termina una carga y forzar recreación del Table
  useEffect(() => {
    if (lastLoadingRef.current === true && loading === false) {
      // Carga terminada, incrementar key para recrear Table
      setTableKey(prev => prev + 1);
    }
    lastLoadingRef.current = loading;
  }, [loading]);

  // Detectar cambios en refreshTrigger y ejecutar refresh automático
  useEffect(() => {
    if (refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // Extraer parámetros para Table con valores por defecto
  const {
    showCount = false,
    emptyMessage = 'No hay datos disponibles',
    variant = 'default',
    striped = false,
    hover = true,
    bordered = true,
    sortable = false,
    selectable = false,
    expandable = false,
    filterable = false,
    pagination = false,
    fit = false,
    boundColumn = null,
    onGetSelects = null,
    className = '',
    headerClassName = '',
    rowClassName = '',
    cellClassName = '',
    onRowClick = null,
    onSort = null,
    onSelect = null,
    itemsPerPage = 10,
    currentPage = 1,
    onPageChange = null
  } = tableComponentParameters;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Título - Oculto por mientras */}
      {false && (
        <h1 className="text-2xl font-bold mb-4">Tabla: {tableName || 'No especificada'}</h1>
      )}
      
      {/* Loading - Oculto por mientras */}
      {false && loading && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded mb-4">
          Cargando datos...
        </div>
      )}

      {/* Error - Oculto por mientras */}
      {false && error && (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Schema - Oculto por mientras */}
      {false && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Schema</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-sm">
            {schema ? JSON.stringify(schema, null, 2) : 'No hay schema disponible'}
          </pre>
        </div>
      )}

      {/* Records - Oculto por mientras */}
      {false && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Datos ({records.length} registros)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {records.length > 0 ? JSON.stringify(records, null, 2) : 'No hay datos'}
          </pre>
        </div>
      )}

      {/* Refresh button */}
      <button
        onClick={refresh}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Recargar
      </button>

      {/* Ejemplo de parámetros para el componente Table - Oculto por mientras */}
      {false && <TableParametersExample records={records} />}

      {/* Tabla usando el componente Table */}
      {headers.length > 0 && records.length > 0 && (
        <div className="mt-8">
          <Table
            key={tableKey}  // Cambia cuando loading termina, fuerza recreación
            headers={headers}
            data={records}
            actions={tableActions}
            loading={loading}
            showCount={showCount}
            emptyMessage={emptyMessage}
            variant={variant}
            striped={striped}
            hover={hover}
            bordered={bordered}
            sortable={sortable}
            selectable={selectable}
            expandable={expandable}
            filterable={filterable}
            pagination={pagination}
            fit={fit}
            boundColumn={boundColumn}
            onGetSelects={onGetSelects}
            className={className}
            headerClassName={headerClassName}
            rowClassName={rowClassName}
            cellClassName={cellClassName}
            onRowClick={onRowClick}
            onSort={onSort}
            onSelect={onSelect}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </main>
  );
}

export default CrudTable;
