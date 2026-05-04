import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { plazaFormFields, plazaMultiStep, plazaValidation, plazaModalConfig } from './config/formConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Plazas Docentes — CRUD 3 niveles
 * Nivel 1: Periodo (visualización)
 * Nivel 2: Sede (visualización + botón "Añadir Plaza")
 * Nivel 3: Plaza Docente (CRUD completo)
 */
function PlazasDocentesConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS
  // ==========================================
  const plazasCrud = useCrudForms({
    tableName: 'PLAZA_DOCENTE',
    primaryKey: 'ID_PLAZA_DOCENTE',
    onRefresh: refresh
  });

  // ==========================================
  // 3. ESTADOS PARA CREAR PLAZA DESDE SEDE
  // ==========================================
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddPlaza = (row) => {
    setSelectedPeriodoId(row.ID_PERIODO);
    setSelectedSedeId(row.ID_SEDE);
    plazasCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedPeriodoId(null);
    setSelectedSedeId(null);
    plazasCrud.handleCloseCreate();
  };

  // ==========================================
  // 4. FORMULARIO DINÁMICO (prellena Periodo y Sede)
  // ==========================================
  const dynamicPlazaFields = useMemo(() => {
    const isCreatingFromSede = selectedPeriodoId !== null && selectedSedeId !== null;
    return plazaFormFields.map((field) => {
      if (isCreatingFromSede && field.name === 'ID_PERIODO') {
        return {
          ...field,
          defaultValue: selectedPeriodoId,
          disabled: true
        };
      }
      if (isCreatingFromSede && field.name === 'ID_SEDE') {
        return {
          ...field,
          defaultValue: selectedSedeId,
          disabled: true
        };
      }
      return field;
    });
  }, [selectedPeriodoId, selectedSedeId]);

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(plazasCrud, handleAddPlaza);

  const crudLevels = [
    {
      crud: plazasCrud,
      tableName: 'PLAZA_DOCENTE',
      primaryKey: 'ID_PLAZA_DOCENTE',
      formFields: dynamicPlazaFields,
      formLayout: null,
      multiStep: plazaMultiStep,
      validation: plazaValidation,
      confirmSubmit: true,
      modalConfig: plazaModalConfig,
      onCreateClose: handleCreateClose
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
          actions: getHeaderActions()
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default PlazasDocentesConfig;
