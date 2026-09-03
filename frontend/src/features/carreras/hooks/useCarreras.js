import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/carreras/config/tableConfig';
import {
  carreraFormFields,
  carreraValidation,
  carreraModalConfig
} from '@/features/carreras/config/formConfig';

/**
 * useCarreras — lógica de la página de carreras.
 * State + handlers + CRUD wiring para la tabla CARRERAS.
 */
export function useCarreras() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  const carrerasCrud = useCrudForms({
    tableName: 'CARRERAS',
    primaryKey: 'ID_CARRERA',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(carrerasCrud),
    [carrerasCrud]
  );

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_CARRERA) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  const crudLevels = useMemo(() => [
    {
      crud: carrerasCrud,
      tableName: 'CARRERAS',
      primaryKey: 'ID_CARRERA',
      formFields: carreraFormFields,
      formLayout: null,
      validation: carreraValidation,
      confirmSubmit: true,
      modalConfig: carreraModalConfig
    }
  ], [carrerasCrud]);

  return {
    records,
    tableRecords,
    loading,
    error,
    carrerasCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
