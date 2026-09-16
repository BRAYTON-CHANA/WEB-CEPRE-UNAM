import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { usePeriodo } from '@/shared/context/PeriodoContext';
import { tableConfig, getTableLevelConfigs } from '@/features/periodos/config/tableConfig';
import {
  periodosFormFields,
  periodosMultiStep,
  periodosValidation,
  periodosModalConfig
} from '@/features/periodos/config/formConfig';

/**
 * usePeriodos — lógica de la página de Periodos.
 * State + handlers + CRUD wiring usando useCrudForms + CrudMultiLevelManager.
 */
export function usePeriodos() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const { refreshPeriodos } = usePeriodo();
  const [tableRecords, setTableRecords] = useState(records || []);

  const sortById = (list) => [...(list || [])].sort((a, b) => Number(a.ID_PERIODO) - Number(b.ID_PERIODO));

  useEffect(() => {
    setTableRecords(sortById(records));
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_PERIODO) === String(recordId) ? { ...row, [field]: newValue } : row)
    );
    // Invalidar el caché del selector global (cualquier edición afecta la lista)
    refreshPeriodos();
    // Al marcar ES_DEFAULT el trigger apaga el default anterior: refrescar para reflejarlo
    if (field === 'ES_DEFAULT' && newValue) refresh();
  }, [refresh, refreshPeriodos]);

  const periodosCrud = useCrudForms({
    tableName: 'PERIODOS',
    primaryKey: 'ID_PERIODO',
    onRefresh: () => { refresh(); refreshPeriodos(); }
  });

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    handleEdit: periodosCrud.handleEdit,
    handleDelete: periodosCrud.handleDelete
  }), [periodosCrud]);

  const crudLevels = useMemo(() => [
    {
      crud: periodosCrud,
      tableName: 'PERIODOS',
      primaryKey: 'ID_PERIODO',
      formFields: periodosFormFields,
      formLayout: null,
      multiStep: periodosMultiStep,
      validation: periodosValidation,
      confirmSubmit: true,
      modalConfig: periodosModalConfig
    }
  ], [periodosCrud]);

  return {
    tableRecords,
    loading,
    error,
    periodosCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
