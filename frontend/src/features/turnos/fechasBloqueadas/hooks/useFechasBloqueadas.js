import { useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { usePeriodo } from '@/shared/context/PeriodoContext';
import { tableConfig, getTableLevelConfigs } from '@/features/turnos/fechasBloqueadas/config/tableConfig';
import {
  fechasBloqueadasFormFields,
  fechasBloqueadasMultiStep,
  fechasBloqueadasValidation,
  fechasBloqueadasModalConfig
} from '@/features/turnos/fechasBloqueadas/config/formConfig';

/**
 * useFechasBloqueadas — lógica de la página de Fechas Bloqueadas.
 */
export function useFechasBloqueadas() {
  const { periodo } = usePeriodo();

  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const crud = useCrudForms({
    tableName: 'FECHAS_BLOQUEADAS',
    primaryKey: 'ID_FECHA_BLOQUEADA',
    onRefresh: refresh
  });

  const formFields = useMemo(() => {
    return fechasBloqueadasFormFields.map(field => {
      if (field.name === 'ID_PERIODO' && periodo) {
        return { ...field, defaultValue: periodo };
      }
      return field;
    });
  }, [periodo]);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    handleEdit: crud.handleEdit,
    handleDelete: crud.handleDelete
  }), [crud]);

  const crudLevels = useMemo(() => [
    {
      crud,
      tableName: 'FECHAS_BLOQUEADAS',
      primaryKey: 'ID_FECHA_BLOQUEADA',
      formFields,
      formLayout: null,
      multiStep: fechasBloqueadasMultiStep,
      validation: fechasBloqueadasValidation,
      confirmSubmit: true,
      modalConfig: fechasBloqueadasModalConfig
    }
  ], [crud, formFields]);

  return {
    records,
    loading,
    error,
    refresh,
    crud,
    tableLevelConfigs,
    crudLevels
  };
}

export default useFechasBloqueadas;
