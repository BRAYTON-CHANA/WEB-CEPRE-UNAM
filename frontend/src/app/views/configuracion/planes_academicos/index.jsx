import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { planesAcademicosFormFields, planesAcademicosMultiStep, planesAcademicosValidation, planesAcademicosModalConfig } from './config/planesAcademicosFormConfig';
import { planesAcademicosCursosBaseFields, planesAcademicosCursosMultiStep, planesAcademicosCursosValidation, planesAcademicosCursosModalConfig } from './config/planesAcademicosCursosFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de PLANES ACADÉMICOS Y CURSOS
 * MultiLevel CRUD con agrupación por plan académico y CRUD completo en ambos niveles.
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function PlanesAcademicosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS (dos tablas)
  // ==========================================
  const planesCrud = useCrudForms({
    tableName: 'PLAN_ACADEMICO',
    primaryKey: 'ID_PLAN',
    onRefresh: refresh
  });

  const planesCursosCrud = useCrudForms({
    tableName: 'PLAN_ACADEMICO_CURSOS',
    primaryKey: 'ID_PLAN_ACADEMICO_CURSO',
    onRefresh: refresh
  });

  // Estado para preseleccionar plan al añadir curso desde un plan
  const [selectedPlanForNewCurso, setSelectedPlanForNewCurso] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (plan-curso con plan preseleccionado)
  // ==========================================
  const planesAcademicosCursosFormFields = useMemo(() => {
    if (selectedPlanForNewCurso === null) return planesAcademicosCursosBaseFields;
    return planesAcademicosCursosBaseFields.map(field => {
      if (field.name === 'ID_PLAN_ACADEMICO') {
        return { ...field, defaultValue: selectedPlanForNewCurso, disabled: true };
      }
      return field;
    });
  }, [selectedPlanForNewCurso]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddCursoToPlan = (planRow) => {
    setSelectedPlanForNewCurso(planRow.ID_PLAN);
    planesCursosCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(planesCrud, planesCursosCrud, handleAddCursoToPlan);

  const crudLevels = [
    {
      crud: planesCrud,
      tableName: 'PLAN_ACADEMICO',
      primaryKey: 'ID_PLAN',
      formFields: planesAcademicosFormFields,
      formLayout: null,
      multiStep: planesAcademicosMultiStep,
      validation: planesAcademicosValidation,
      confirmSubmit: true,
      modalConfig: planesAcademicosModalConfig
    },
    {
      crud: planesCursosCrud,
      tableName: 'PLAN_ACADEMICO_CURSOS',
      primaryKey: 'ID_PLAN_ACADEMICO_CURSO',
      formFields: planesAcademicosCursosFormFields,
      formLayout: null,
      multiStep: planesAcademicosCursosMultiStep,
      validation: planesAcademicosCursosValidation,
      confirmSubmit: true,
      modalConfig: {
        ...planesAcademicosCursosModalConfig,
        createFormKey: selectedPlanForNewCurso ?? 'free'
      },
      onCreateSuccess: () => setSelectedPlanForNewCurso(null),
      onCreateClose: () => setSelectedPlanForNewCurso(null)
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
          actions: getHeaderActions(planesCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default PlanesAcademicosConfig;
