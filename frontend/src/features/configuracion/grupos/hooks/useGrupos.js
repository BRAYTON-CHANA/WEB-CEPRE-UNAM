import { useState, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/configuracion/grupos/config/tableConfig';
import { grupoFormFields, grupoMultiStep, grupoValidation, grupoModalConfig } from '@/features/configuracion/grupos/config/formConfig';

/**
 * useGrupos — lógica de la página de Grupos.
 * Selector de período + CRUD 2 niveles + modal de asignación de plazas.
 */
export function useGrupos() {
  // ===== Selector de período =====
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  // ===== Datos =====
  const { records, loading, error, refresh } = useTableData(
    selectedPeriodo ? tableConfig.tableName : null,
    filters
  );

  // ===== CRUD =====
  const gruposCrud = useCrudForms({
    tableName: 'GRUPOS',
    primaryKey: 'ID_GRUPO',
    onRefresh: refresh
  });

  // ===== Crear grupo desde sede =====
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddGrupo = (row) => {
    setSelectedSedeId(row.ID_SEDE);
    gruposCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedSedeId(null);
    gruposCrud.handleCloseCreate();
  };

  // ===== Form dinámico =====
  const dynamicGrupoFields = useMemo(() => {
    const isCreatingFromSede = selectedPeriodo !== '' && selectedSedeId !== null;
    return grupoFormFields.map((field) => {
      if (isCreatingFromSede && field.name === 'ID_PERIODO') {
        return { ...field, defaultValue: selectedPeriodo, disabled: true };
      }
      if (isCreatingFromSede && field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeId, disabled: true };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId]);

  // ===== Asignar plazas =====
  const [selectedGrupoForPlazas, setSelectedGrupoForPlazas] = useState(null);

  const handleAsignarPlazas = (row) => setSelectedGrupoForPlazas(row);
  const handleClosePlazas = () => setSelectedGrupoForPlazas(null);

  const plazasFilters = useMemo(
    () => selectedGrupoForPlazas ? { ID_GRUPO: selectedGrupoForPlazas.ID_GRUPO } : {},
    [selectedGrupoForPlazas]
  );

  const {
    records: plazasData,
    loading: plazasLoading,
    refresh: refreshPlazas
  } = useTableData(
    selectedGrupoForPlazas ? 'VW_GRUPO_PLAN_CURSO' : null,
    plazasFilters
  );

  // ===== Configs =====
  const tableLevelConfigs = getTableLevelConfigs(gruposCrud, handleAddGrupo, handleAsignarPlazas);

  const crudLevels = useMemo(() => [
    {
      crud: gruposCrud,
      tableName: 'GRUPOS',
      primaryKey: 'ID_GRUPO',
      formFields: dynamicGrupoFields,
      formLayout: null,
      multiStep: grupoMultiStep,
      validation: grupoValidation,
      confirmSubmit: true,
      modalConfig: grupoModalConfig,
      onCreateClose: handleCreateClose
    }
  ], [gruposCrud, dynamicGrupoFields]);

  return {
    // Selector
    selectedPeriodo,
    handlePeriodoChange,
    // Data
    records,
    loading,
    error,
    // CRUD
    tableLevelConfigs,
    crudLevels,
    // Plazas modal
    selectedGrupoForPlazas,
    handleClosePlazas,
    plazasData,
    plazasLoading,
    refreshPlazas
  };
}
