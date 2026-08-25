import { useState, useMemo } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { headerProps, getHeaderActions, getSedesLevelConfig } from '@/features/sedes/config/sedesTableConfig';
import { sedesFormFields, sedesMultiStep, sedesValidation, sedesModalConfig } from '@/features/sedes/config/sedesFormConfig';
import { aulaBaseFields, aulaMultiStep, aulaValidation, aulasModalConfig, aulaFormLayout } from '@/features/aulas/config/aulasFormConfig';
import { getAulasLevelConfig } from '@/features/aulas/config/aulasTableConfig';

const FETCH_CONFIGS = [
  { tableName: 'SEDES', primaryKey: 'ID_SEDE', filters: {} },
  { tableName: 'AULAS', primaryKey: 'ID_AULA', parentKey: 'ID_SEDE' }
];

/**
 * useSedesYAulas — lógica de la página de Infraestructura.
 * 2 niveles: SEDES → AULAS (lazy load).
 */
export function useSedesYAulas() {
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

  const sedesCrud = useCrudForms({
    tableName: 'SEDES',
    primaryKey: 'ID_SEDE',
    onRefresh: refresh
  });

  const [selectedSedeForNewAula, setSelectedSedeForNewAula] = useState(null);
  const [editingSedeId, setEditingSedeId] = useState(null);

  const aulasCrud = useCrudForms({
    tableName: 'AULAS',
    primaryKey: 'ID_AULA',
    onRefresh: () => {
      const sedeId = selectedSedeForNewAula ?? editingSedeId;
      if (sedeId !== null) {
        refreshChildren(1, sedeId);
      }
    }
  });

  const aulaFormFields = useMemo(() => {
    if (selectedSedeForNewAula === null) return aulaBaseFields;
    return aulaBaseFields.map(field => {
      if (field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeForNewAula, disabled: true };
      }
      return field;
    });
  }, [selectedSedeForNewAula]);

  const handleAddAulaFromSede = (sedeRow) => {
    setSelectedSedeForNewAula(sedeRow.ID_SEDE);
    aulasCrud.handleCreate();
  };

  const handleEditAula = (row) => {
    setEditingSedeId(row.ID_SEDE);
    aulasCrud.handleEdit(row);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = useMemo(() => [
    getSedesLevelConfig(sedesCrud, handleAddAulaFromSede),
    getAulasLevelConfig({ ...aulasCrud, handleEdit: handleEditAula })
  ], [sedesCrud, aulasCrud]);

  const crudLevels = useMemo(() => [
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
      formLayout: aulaFormLayout,
      multiStep: aulaMultiStep,
      validation: aulaValidation,
      confirmSubmit: true,
      modalConfig: {
        ...aulasModalConfig,
        createFormKey: selectedSedeForNewAula ?? 'free'
      },
      onCreateSuccess: () => {
        if (selectedSedeForNewAula !== null) {
          refreshChildren(1, selectedSedeForNewAula);
        }
        setSelectedSedeForNewAula(null);
      },
      onCreateClose: () => setSelectedSedeForNewAula(null),
      onEditSuccess: () => {
        if (editingSedeId !== null) {
          refreshChildren(1, editingSedeId);
        }
        setEditingSedeId(null);
      },
      onEditClose: () => setEditingSedeId(null)
    }
  ], [sedesCrud, aulasCrud, aulaFormFields, selectedSedeForNewAula, refreshChildren]);

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
    updateRecord,
    sedesCrud,
    tableLevelConfigs,
    crudLevels,
    childrenData,
    childrenLoading,
    handleExpand,
    headerProps,
    getHeaderActions
  };
}
