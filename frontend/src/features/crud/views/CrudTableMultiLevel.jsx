import React, { useEffect, useRef } from 'react';
import { useTableData } from '../hooks/useTableData';
import TableMultiLevel from '@/features/table/views/TableMultiLevel';

/**
 * Componente CrudTableMultiLevel
 * Usa misma lógica que CrudTable para conseguir datos
 * Pasa data y levelConfigs a TableMultiLevel
 */
function CrudTableMultiLevel({ 
  tableConfig = {},
  refreshTrigger = 0
}) {
  const { schema, records, loading, error, refresh } = useTableData(tableConfig.tableName);
  
  // Key para forzar recreación del TableMultiLevel cuando se recargan datos
  const [tableKey, setTableKey] = React.useState(0);
  const lastLoadingRef = useRef(loading);
  const initialLoadDoneRef = useRef(false);

  // Detectar cuando termina una carga y forzar recreación del TableMultiLevel
  useEffect(() => {
    if (lastLoadingRef.current === true && loading === false) {
      if (initialLoadDoneRef.current) {
        setTableKey(prev => prev + 1);
      }
      initialLoadDoneRef.current = true;
    }
    lastLoadingRef.current = loading;
  }, [loading]);

  // Detectar cambios en refreshTrigger y ejecutar refresh automático
  useEffect(() => {
    if (refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div key={tableKey}>
      <TableMultiLevel 
        data={records} 
        levelConfigs={tableConfig.levelConfigs}
      />
    </div>
  );
}

export default CrudTableMultiLevel;
