import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { sedesFormFields, sedesMultiStep, sedesValidation, sedesModalConfig } from './config/sedesFormConfig';
import { aulaBaseFields, aulaMultiStep, aulaValidation, aulasModalConfig } from './config/aulasFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de SEDES Y AULAS
 * MultiLevel CRUD con agrupación por sede y CRUD completo en ambos niveles.
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function SedesYAulasConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS (dos tablas)
  // ==========================================
  const sedesCrud = useCrudForms({
    tableName: 'SEDES',
    primaryKey: 'ID_SEDE',
    onRefresh: refresh
  });

  const aulasCrud = useCrudForms({
    tableName: 'AULAS',
    primaryKey: 'ID_AULA',
    onRefresh: refresh
  });

  // Estado para preseleccionar sede al añadir aula desde una sede
  const [selectedSedeForNewAula, setSelectedSedeForNewAula] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (aula con sede preseleccionada)
  // ==========================================
  const aulaFormFields = useMemo(() => {
    if (selectedSedeForNewAula === null) return aulaBaseFields;
    return aulaBaseFields.map(field => {
      if (field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeForNewAula, disabled: true };
      }
      return field;
    });
  }, [selectedSedeForNewAula]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddAulaFromSede = (sedeRow) => {
    setSelectedSedeForNewAula(sedeRow.ID_SEDE);
    aulasCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(sedesCrud, aulasCrud, handleAddAulaFromSede);

  const crudLevels = [
    {
      crud: sedesCrud,
      tableName: 'SEDES',
      primaryKey: 'ID_SEDE',
      formFields: sedesFormFields,
      formLayout: null,
      multiStep: sedesMultiStep,
      validation: sedesValidation,
      confirmSubmit: true,
      modalConfig: sedesModalConfig
    },
    {
      crud: aulasCrud,
      tableName: 'AULAS',
      primaryKey: 'ID_AULA',
      formFields: aulaFormFields,
      formLayout: null,
      multiStep: aulaMultiStep,
      validation: aulaValidation,
      confirmSubmit: true,
      modalConfig: {
        ...aulasModalConfig,
        createFormKey: selectedSedeForNewAula ?? 'free'
      },
      onCreateSuccess: () => setSelectedSedeForNewAula(null),
      onCreateClose: () => setSelectedSedeForNewAula(null)
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
          actions: getHeaderActions(sedesCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default SedesYAulasConfig;
