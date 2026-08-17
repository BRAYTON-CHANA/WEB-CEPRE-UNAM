import { useState, useMemo } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getHorariosLevelConfig, getHorarioBloquesLevelConfig } from '@/features/horarios/config/tableConfig';
import { horariosFormFields, horariosMultiStep, horariosValidation, horariosModalConfig } from '@/features/horarios/config/horariosFormConfig';
import { bloqueBaseFields, bloqueMultiStep, bloqueValidation, bloqueModalConfig } from '@/features/horarios/config/horarioBloquesFormConfig';

const FETCH_CONFIGS = [
  { tableName: 'VW_HORARIOS', primaryKey: 'ID_HORARIO', filters: {} },
  { tableName: 'VW_HORARIO_BLOQUES', primaryKey: 'ID_BLOQUE', parentKey: 'ID_HORARIO' }
];

/**
 * useHorarios — lógica de la página de Horarios.
 * 2 niveles: VW_HORARIOS → VW_HORARIO_BLOQUES (lazy load) + vista EditarBloques.
 */
export function useHorarios() {
  const {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    refresh,
    refreshChildren
  } = useMultiLevelFetch(FETCH_CONFIGS);

  const horariosCrud = useCrudForms({
    tableName: 'HORARIOS',
    primaryKey: 'ID_HORARIO',
    onRefresh: refresh
  });

  const [editingBloquesHorario, setEditingBloquesHorario] = useState(null);
  const [nextBloqueOrden, setNextBloqueOrden] = useState(1);

  const bloquesCrud = useCrudForms({
    tableName: 'HORARIO_BLOQUES',
    primaryKey: 'ID_BLOQUE',
    onRefresh: () => {
      if (editingBloquesHorario) {
        refreshChildren(1, editingBloquesHorario.ID_HORARIO);
      }
    }
  });

  const bloqueFormFields = useMemo(() => {
    if (!editingBloquesHorario) return bloqueBaseFields;
    return bloqueBaseFields.map(field => {
      if (field.name === 'ID_HORARIO') {
        return { ...field, defaultValue: editingBloquesHorario.ID_HORARIO, disabled: true };
      }
      if (field.name === 'ORDEN') {
        return { ...field, defaultValue: nextBloqueOrden, hidden: true, required: false };
      }
      return field;
    });
  }, [editingBloquesHorario, nextBloqueOrden]);

  const handleEditarBloques = (horarioRow) => {
    setEditingBloquesHorario(horarioRow);
  };

  const handleBackToHorarios = () => {
    setEditingBloquesHorario(null);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = useMemo(() => [
    getHorariosLevelConfig(horariosCrud, handleEditarBloques),
    getHorarioBloquesLevelConfig({ ...bloquesCrud })
  ], [horariosCrud, bloquesCrud]);

  const crudLevels = useMemo(() => [
    {
      crud: horariosCrud,
      tableName: 'HORARIOS',
      primaryKey: 'ID_HORARIO',
      formFields: horariosFormFields,
      formLayout: null,
      multiStep: horariosMultiStep,
      validation: horariosValidation,
      confirmSubmit: true,
      modalConfig: horariosModalConfig
    },
    {
      crud: bloquesCrud,
      tableName: 'HORARIO_BLOQUES',
      primaryKey: 'ID_BLOQUE',
      formFields: bloqueFormFields,
      formLayout: null,
      multiStep: bloqueMultiStep,
      validation: bloqueValidation,
      confirmSubmit: true,
      modalConfig: {
        ...bloqueModalConfig,
        createFormKey: editingBloquesHorario?.ID_HORARIO ?? 'free'
      }
    }
  ], [horariosCrud, bloquesCrud, bloqueFormFields, editingBloquesHorario]);

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
    horariosCrud,
    bloquesCrud,
    tableLevelConfigs,
    crudLevels,
    childrenData,
    childrenLoading,
    handleExpand,
    editingBloquesHorario,
    handleBackToHorarios,
    setNextBloqueOrden
  };
}
