import { useState, useMemo } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getSedesLevelConfig, getPlazasLevelConfig } from '@/features/plazas_docentes/config/tableConfig';
import { plazaFormFields, plazaMultiStep, plazaValidation, plazaModalConfig } from '@/features/plazas_docentes/config/formConfig';

/**
 * usePlazasDocentes — lógica de la página de Plazas Docentes.
 * 2 niveles: SEDES → VW_PLAZA_DOCENTE_ASIGNADA (lazy load) + selector de período.
 */
export function usePlazasDocentes() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  const FETCH_CONFIGS = useMemo(() => [
    { tableName: selectedPeriodo ? 'SEDES' : null, primaryKey: 'ID_SEDE', filters: {} },
    {
      tableName: 'VW_PLAZA_DOCENTE_ASIGNADA',
      primaryKey: 'ID_PLAZA_DOCENTE',
      parentKey: 'ID_SEDE',
      filters: selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : { ID_PERIODO: -1 }
    }
  ], [selectedPeriodo]);

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

  const [selectedSedeForNewPlaza, setSelectedSedeForNewPlaza] = useState(null);
  const [editingSedeId, setEditingSedeId] = useState(null);

  const plazasCrud = useCrudForms({
    tableName: 'PLAZA_DOCENTE',
    primaryKey: 'ID_PLAZA_DOCENTE',
    onRefresh: () => {
      const sedeId = selectedSedeForNewPlaza ?? editingSedeId;
      if (sedeId !== null) {
        refreshChildren(1, sedeId);
      }
    }
  });

  const plazaFormFieldsWithDefaults = useMemo(() => {
    if (!selectedPeriodo) return plazaFormFields;
    return plazaFormFields.map((field) => {
      if (field.name === 'ID_PERIODO') {
        return { ...field, defaultValue: selectedPeriodo, disabled: true };
      }
      if (selectedSedeForNewPlaza !== null && field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeForNewPlaza, disabled: true };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeForNewPlaza]);

  const handleAddPlazaFromSede = (sedeRow) => {
    setSelectedSedeForNewPlaza(sedeRow.ID_SEDE);
    plazasCrud.handleCreate();
  };

  const handleEditPlaza = (row) => {
    setEditingSedeId(row.ID_SEDE);
    plazasCrud.handleEdit(row);
  };

  const handleExpand = (levelIndex, parentValue) => {
    if (!selectedPeriodo) return;
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = useMemo(() => [
    getSedesLevelConfig(plazasCrud, handleAddPlazaFromSede),
    getPlazasLevelConfig({ ...plazasCrud, handleEdit: handleEditPlaza })
  ], [plazasCrud]);

  const crudLevels = useMemo(() => [
    {
      crud: plazasCrud,
      tableName: 'PLAZA_DOCENTE',
      primaryKey: 'ID_PLAZA_DOCENTE',
      formFields: plazaFormFieldsWithDefaults,
      formLayout: null,
      multiStep: plazaMultiStep,
      validation: plazaValidation,
      confirmSubmit: true,
      modalConfig: {
        ...plazaModalConfig,
        createFormKey: selectedSedeForNewPlaza ?? 'free'
      },
      onCreateSuccess: () => {
        if (selectedSedeForNewPlaza !== null) {
          refreshChildren(1, selectedSedeForNewPlaza);
        }
        setSelectedSedeForNewPlaza(null);
      },
      onCreateClose: () => setSelectedSedeForNewPlaza(null),
      onEditSuccess: () => {
        if (editingSedeId !== null) {
          refreshChildren(1, editingSedeId);
        }
        setEditingSedeId(null);
      },
      onEditClose: () => setEditingSedeId(null)
    }
  ], [plazasCrud, plazaFormFieldsWithDefaults, selectedSedeForNewPlaza, refreshChildren]);

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  return {
    selectedPeriodo,
    setSelectedPeriodo,
    records,
    loading,
    error,
    updateRecord,
    tableLevelConfigs,
    crudLevels,
    childrenData,
    childrenLoading,
    handleExpand
  };
}
