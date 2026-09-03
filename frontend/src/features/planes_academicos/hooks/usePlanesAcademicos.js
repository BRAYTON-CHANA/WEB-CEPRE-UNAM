import { useState, useMemo, useCallback } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import {
  getPlanAcademicoLevelConfig,
  getPlanAcademicoCursosLevelConfig
} from '@/features/planes_academicos/config/tableConfig';
import {
  planesAcademicosFormFields,
  planesAcademicosMultiStep,
  planesAcademicosValidation,
  planesAcademicosModalConfig
} from '@/features/planes_academicos/config/planesAcademicosFormConfig';
import {
  planesAcademicosCursosBaseFields,
  planesAcademicosCursosMultiStep,
  planesAcademicosCursosValidation,
  planesAcademicosCursosModalConfig
} from '@/features/planes_academicos/config/planesAcademicosCursosFormConfig';

const FETCH_CONFIGS = [
  { tableName: 'VW_PLAN_ACADEMICO', primaryKey: 'ID_PLAN', filters: {} },
  { tableName: 'VW_PLAN_ACADEMICO_CURSOS', primaryKey: 'ID_PLAN_ACADEMICO_CURSO', parentKey: 'ID_PLAN_ACADEMICO' }
];

/**
 * usePlanesAcademicos — lógica de la página de planes académicos.
 * MultiLevel CRUD: PLAN_ACADEMICO → PLAN_ACADEMICO_CURSOS (lazy load).
 */
export function usePlanesAcademicos() {
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

  const handleAddCursoToPlan = useCallback((planRow) => {
    setSelectedPlanForNewCurso(planRow.ID_PLAN);
    planesCursosCrud.handleCreate();
  }, [planesCursosCrud]);

  const handleEditCurso = useCallback((row) => {
    setEditingPlanId(row.ID_PLAN_ACADEMICO);
    planesCursosCrud.handleEdit(row);
  }, [planesCursosCrud]);

  const handleExpand = useCallback((levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  }, [fetchChildren]);

  const handleSaveSuccess = useCallback((recordId, field, newValue, primaryKey) => {
    updateRecord(recordId, primaryKey, field, newValue);
  }, [updateRecord]);

  const tableLevelConfigs = useMemo(() => [
    getPlanAcademicoLevelConfig(planesCrud, handleAddCursoToPlan),
    getPlanAcademicoCursosLevelConfig({ ...planesCursosCrud, handleEdit: handleEditCurso })
  ], [planesCrud, planesCursosCrud, handleAddCursoToPlan, handleEditCurso]);

  const crudLevels = useMemo(() => [
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
  ], [planesCrud, planesCursosCrud, cursosFormFields, selectedPlanForNewCurso, editingPlanId, refreshChildren]);

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  return {
    records,
    loading,
    error,
    planesCrud,
    tableLevelConfigs,
    crudLevels,
    handleExpand,
    handleSaveSuccess,
    childrenData,
    childrenLoading
  };
}
