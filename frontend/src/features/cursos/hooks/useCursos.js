import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/cursos/config/tableConfig';
import {
  cursosFormFields,
  cursosFormLayout,
  cursosMultiStep,
  cursosValidation,
  cursosModalConfig
} from '@/features/cursos/config/formConfig';

/**
 * useCursos — lógica de la página de cursos.
 * State + handlers + CRUD wiring para la tabla CURSOS.
 */
export function useCursos() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  const cursosCrud = useCrudForms({
    tableName: 'CURSOS',
    primaryKey: 'ID_CURSO',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(cursosCrud),
    [cursosCrud]
  );

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_CURSO) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  const crudLevels = useMemo(() => [
    {
      crud: cursosCrud,
      tableName: 'CURSOS',
      primaryKey: 'ID_CURSO',
      formFields: cursosFormFields,
      formLayout: cursosFormLayout,
      multiStep: cursosMultiStep,
      validation: cursosValidation,
      confirmSubmit: true,
      modalConfig: cursosModalConfig
    }
  ], [cursosCrud]);

  return {
    records,
    tableRecords,
    loading,
    error,
    cursosCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
