import React, { useState, useEffect, useRef } from 'react';
import { useTableData } from '../../crud/hooks/useTableData';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import Table from './Table';

/**
 * DatabaseTable — tabla autónoma con carga de datos propia.
 * Carga desde tableName (BD) o recibe data externa.
 * Columna de acciones inyectada automáticamente.
 *
 * @param {string}   tableName       - Tabla BD a consultar (opcional si se pasa data)
 * @param {array}    data            - Datos externos (omite fetch si se pasa)
 * @param {object}   filters         - Filtros fijos para la consulta
 * @param {array}    headers         - Columnas: [{ title, type }]
 * @param {array}    actions         - Botones col acciones: [{ label, icon, onClick, className }]
 * @param {number}   refreshTrigger  - Trigger externo para refrescar
 * @param {object}   headerProps     - Props para CrudHeader (headerTitle, headerDescription, actions[])
 * @param {object}   tableProps      - Props extra para Table (sortable, pagination, etc.)
 * @param {boolean}  externalLoading - Override loading cuando data es externa
 */
function DatabaseTable({
  tableName,
  data: externalData,
  filters = {},
  headers = [],
  actions = [],
  refreshTrigger = 0,
  headerProps = {},
  tableProps = {},
  externalLoading = false
}) {
  const isExternal = externalData !== undefined;

  const {
    records: fetchedRecords,
    loading: fetchLoading,
    error: fetchError,
    refresh
  } = useTableData(isExternal ? null : tableName, filters);

  const records = isExternal ? externalData : fetchedRecords;
  const loading  = isExternal ? externalLoading : fetchLoading;
  const error    = isExternal ? null : fetchError;

  const [tableKey, setTableKey] = useState(0);
  const lastLoadingRef     = useRef(loading);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (lastLoadingRef.current === true && loading === false) {
      if (initialLoadDoneRef.current) setTableKey(prev => prev + 1);
      initialLoadDoneRef.current = true;
    }
    lastLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (refreshTrigger > 0 && !isExternal) refresh();
  }, [refreshTrigger, refresh, isExternal]);

  const tableActions = Array.isArray(actions) && actions.length > 0
    ? {
        direct: actions.map(action => ({
          label:     action.label,
          icon:      action.icon,
          className: action.className || 'text-gray-600 hover:bg-gray-100',
          onClick:   action.onClick,
          showIf:    action.showIf
        }))
      }
    : !Array.isArray(actions) && actions && Object.keys(actions).length > 0
      ? actions
      : {};

  return (
    <div className="space-y-4">
      {(headerProps.headerTitle || headerProps.headerDescription || headerProps.actions?.length > 0) && (
        <CrudHeader {...headerProps} />
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-red-700 text-sm"><strong>Error:</strong> {error}</p>
        </div>
      )}

      {headers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <Table
            key={tableKey}
            headers={headers}
            data={records}
            actions={tableActions}
            loading={loading}
            hover={true}
            bordered={true}
            striped={true}
            {...tableProps}
          />
        </div>
      )}
    </div>
  );
}

export default DatabaseTable;
