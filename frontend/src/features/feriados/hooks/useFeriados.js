import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/feriados/config/tableConfig';
import {
  feriadosFormFields,
  feriadosMultiStep,
  feriadosValidation,
  feriadosModalConfig
} from '@/features/feriados/config/formConfig';

/**
 * useFeriados — lógica de la página de Feriados.
 * Lee desde VW_FERIADOS (con datos del periodo) y escribe en FERIADOS.
 */
export function useFeriados() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_FERIADO) === String(recordId) ? { ...row, [field]: newValue } : row)
    );
  }, []);

  const feriadosCrud = useCrudForms({
    tableName: 'FERIADOS',
    primaryKey: 'ID_FERIADO',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    handleEdit: feriadosCrud.handleEdit,
    handleDelete: feriadosCrud.handleDelete
  }), [feriadosCrud]);

  const crudLevels = useMemo(() => [
    {
      crud: feriadosCrud,
      tableName: 'FERIADOS',
      primaryKey: 'ID_FERIADO',
      formFields: feriadosFormFields,
      formLayout: null,
      multiStep: feriadosMultiStep,
      validation: feriadosValidation,
      confirmSubmit: true,
      modalConfig: feriadosModalConfig
    }
  ], [feriadosCrud]);

  return {
    tableRecords,
    loading,
    error,
    feriadosCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
