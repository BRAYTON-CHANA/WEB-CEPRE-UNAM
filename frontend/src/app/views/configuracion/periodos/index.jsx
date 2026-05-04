import React from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { periodosFormFields, periodosMultiStep, periodosValidation, periodosModalConfig } from './config/formConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de PERIODOS
 * CRUD completo para la tabla PERIODOS usando CrudMultiLevelManager con un solo nivel.
 */
function PeriodosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOK
  // ==========================================
  const periodosCrud = useCrudForms({
    tableName: 'PERIODOS',
    primaryKey: 'ID_PERIODO',
    onRefresh: refresh
  });

  // ==========================================
  // 3. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(periodosCrud);

  const crudLevels = [
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
  ];

  return (
    <LayoutWithSidebar>
      <CrudMultiLevelManager
        data={records}
        loading={loading}
        error={error}
        tableLevelConfigs={tableLevelConfigs}
        headerProps={{
          ...headerProps,
          actions: getHeaderActions(periodosCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default PeriodosConfig;
