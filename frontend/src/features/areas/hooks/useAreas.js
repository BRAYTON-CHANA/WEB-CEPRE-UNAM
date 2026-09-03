import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/areas/config/tableConfig';
import {
  areasFormFields,
  areasMultiStep,
  areasValidation,
  areasModalConfig
} from '@/features/areas/config/formConfig';

/**
 * useAreas — lógica de la página de áreas.
 * State + handlers + CRUD wiring para la tabla AREAS.
 */
export function useAreas() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  const areasCrud = useCrudForms({
    tableName: 'AREAS',
    primaryKey: 'ID_AREA',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(areasCrud),
    [areasCrud]
  );

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_AREA) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  const crudLevels = useMemo(() => [
    {
      crud: areasCrud,
      tableName: 'AREAS',
      primaryKey: 'ID_AREA',
      formFields: areasFormFields,
      formLayout: null,
      multiStep: areasMultiStep,
      validation: areasValidation,
      confirmSubmit: true,
      modalConfig: areasModalConfig
    }
  ], [areasCrud]);

  return {
    records,
    tableRecords,
    loading,
    error,
    areasCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
