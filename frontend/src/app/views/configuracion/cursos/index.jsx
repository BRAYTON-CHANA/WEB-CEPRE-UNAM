import React from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from '@/features/configuracion/cursos/config/tableConfig';
import { cursosFormFields, cursosMultiStep, cursosValidation, cursosModalConfig } from '@/features/configuracion/cursos/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/configuracion/cursos/config/headerConfig';

/**
 * Configuración de CURSOS
 * CRUD completo para la tabla CURSOS usando CrudMultiLevelManager con un solo nivel.
 */
function CursosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOK
  // ==========================================
  const cursosCrud = useCrudForms({
    tableName: 'CURSOS',
    primaryKey: 'ID_CURSO',
    onRefresh: refresh
  });

  // ==========================================
  // 3. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(cursosCrud);

  const crudLevels = [
    {
      crud: cursosCrud,
      tableName: 'CURSOS',
      primaryKey: 'ID_CURSO',
      formFields: cursosFormFields,
      formLayout: null,
      multiStep: cursosMultiStep,
      validation: cursosValidation,
      confirmSubmit: true,
      modalConfig: cursosModalConfig
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
          actions: getHeaderActions(cursosCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default CursosConfig;
