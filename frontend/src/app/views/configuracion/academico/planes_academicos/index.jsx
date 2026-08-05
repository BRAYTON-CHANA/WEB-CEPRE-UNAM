import React, { useState, useMemo, useCallback } from 'react';
import { useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getPlanAcademicoLevelConfig, getPlanAcademicoCursosLevelConfig } from '@/features/planes_academicos/config/tableConfig';
import { planesAcademicosFormFields, planesAcademicosMultiStep, planesAcademicosValidation, planesAcademicosModalConfig } from '@/features/planes_academicos/config/planesAcademicosFormConfig';
import { planesAcademicosCursosBaseFields, planesAcademicosCursosMultiStep, planesAcademicosCursosValidation, planesAcademicosCursosModalConfig } from '@/features/planes_academicos/config/planesAcademicosCursosFormConfig';
import { headerProps, getHeaderActions } from '@/features/planes_academicos/config/headerConfig';

const FETCH_CONFIGS = [
  { tableName: 'VW_PLAN_ACADEMICO', primaryKey: 'ID_PLAN', filters: {} },
  { tableName: 'VW_PLAN_ACADEMICO_CURSOS', primaryKey: 'ID_PLAN_ACADEMICO_CURSO', parentKey: 'ID_PLAN_ACADEMICO' }
];

/**
 * Configuración de Planes Académicos y Cursos
 * MultiLevel CRUD con carga lazy, igual que Infraestructura.
 */
function PlanesAcademicosConfig() {
  const {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    refresh,
    refreshChildren,
    updateRecord
  } = useMultiLevelFetch(FETCH_CONFIGS);

  const planesCrud = useCrudForms({
    tableName: 'PLAN_ACADEMICO',
    primaryKey: 'ID_PLAN',
    onRefresh: refresh
  });

  const [selectedPlanForNewCurso, setSelectedPlanForNewCurso] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const planesCursosCrud = useCrudForms({
    tableName: 'PLAN_ACADEMICO_CURSOS',
    primaryKey: 'ID_PLAN_ACADEMICO_CURSO',
    onRefresh: () => {
      const planId = selectedPlanForNewCurso ?? editingPlanId;
      if (planId !== null) {
        refreshChildren(1, planId);
      }
    }
  });

  const cursosFormFields = useMemo(() => {
    if (selectedPlanForNewCurso === null) return planesAcademicosCursosBaseFields;
    return planesAcademicosCursosBaseFields.map(field => {
      if (field.name === 'ID_PLAN_ACADEMICO') {
        return { ...field, defaultValue: selectedPlanForNewCurso, disabled: true };
      }
      return field;
    });
  }, [selectedPlanForNewCurso]);

  const handleAddCursoToPlan = (planRow) => {
    setSelectedPlanForNewCurso(planRow.ID_PLAN);
    planesCursosCrud.handleCreate();
  };

  const handleEditCurso = (row) => {
    setEditingPlanId(row.ID_PLAN_ACADEMICO);
    planesCursosCrud.handleEdit(row);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const handleSaveSuccess = useCallback((recordId, field, newValue, primaryKey) => {
    updateRecord(recordId, primaryKey, field, newValue);
  }, [updateRecord]);

  const tableLevelConfigs = [
    getPlanAcademicoLevelConfig(planesCrud, handleAddCursoToPlan),
    getPlanAcademicoCursosLevelConfig({ ...planesCursosCrud, handleEdit: handleEditCurso })
  ];

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
      formFields: cursosFormFields,
      formLayout: null,
      multiStep: planesAcademicosCursosMultiStep,
      validation: planesAcademicosCursosValidation,
      confirmSubmit: true,
      modalConfig: {
        ...planesAcademicosCursosModalConfig,
        createFormKey: selectedPlanForNewCurso ?? 'free'
      },
      onCreateSuccess: () => {
        if (selectedPlanForNewCurso !== null) {
          refreshChildren(1, selectedPlanForNewCurso);
        }
        setSelectedPlanForNewCurso(null);
      },
      onCreateClose: () => setSelectedPlanForNewCurso(null),
      onEditSuccess: () => {
        if (editingPlanId !== null) {
          refreshChildren(1, editingPlanId);
        }
        setEditingPlanId(null);
      },
      onEditClose: () => setEditingPlanId(null)
    }
  ];

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([planHandler, cursoHandler]) => (
          <div className="px-8 py-8 space-y-8 pb-12">
            <CrudHeader
              headerTitle={headerProps.headerTitle}
              headerDescription={headerProps.headerDescription}
              titleClassName={headerProps.titleClassName}
              descriptionClassName={headerProps.descriptionClassName}
              actions={getHeaderActions(planesCrud)}
            />

            {loading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando datos...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <TableMultiLevelEditable
                  data={records}
                  levelConfigs={tableLevelConfigs}
                  saveMode="auto"
                  onSaveSuccess={handleSaveSuccess}
                  formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) => {
                    const name = primaryKey === 'ID_PLAN' ? rowData?.DESCRIPCION : rowData?.NOMBRE_CURSO;
                    return `${name || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`;
                  }}
                  toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  tableProps={{ onExpand: handleExpand, childrenData, childrenLoading }}
                />
              </div>
            )}
          </div>
        )}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default PlanesAcademicosConfig;
