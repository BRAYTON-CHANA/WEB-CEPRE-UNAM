import { useState, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/configuracion/postulantes/config/tableConfig';
import { postulanteFormFields, postulanteValidation, postulanteModalConfig } from '@/features/configuracion/postulantes/config/formConfig';

/**
 * usePostulantes — lógica de la página de Postulantes.
 * Selector de período + CRUD 3 niveles + CSV import.
 */
export function usePostulantes() {
  // ===== CSV Import =====
  const [csvModalOpen, setCsvModalOpen] = useState(false);

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

  const handleImportSuccess = () => {
    refresh();
  };

  // ===== CRUD =====
  const postulantesCrud = useCrudForms({
    tableName: 'VW_POSTULANTE',
    primaryKey: 'ID_POSTULANTE',
    onRefresh: refresh
  });

  // ===== Crear postulante desde grupo =====
  const [selectedGrupoId, setSelectedGrupoId] = useState(null);
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddPostulante = (row) => {
    setSelectedGrupoId(row.ID_GRUPO);
    setSelectedSedeId(row.ID_SEDE);
    postulantesCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedGrupoId(null);
    setSelectedSedeId(null);
    postulantesCrud.handleCloseCreate();
  };

  // ===== Form dinámico =====
  const dynamicPostulanteFields = useMemo(() => {
    const isCreatingFromGrupo = selectedPeriodo !== '' && selectedSedeId !== null;
    return postulanteFormFields.map((field) => {
      if (isCreatingFromGrupo && field.name === 'ID_PERIODO') {
        return { ...field, defaultValue: selectedPeriodo, disabled: true };
      }
      if (isCreatingFromGrupo && field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeId, disabled: true };
      }
      if (isCreatingFromGrupo && field.name === 'ID_GRUPO') {
        return { ...field, defaultValue: selectedGrupoId || '', disabled: true };
      }
      if (postulantesCrud.selectedRow && !isCreatingFromGrupo) {
        const row = postulantesCrud.selectedRow;
        if (field.name === 'NOMBRES') return { ...field, defaultValue: row.NOMBRES || '' };
        if (field.name === 'APELLIDOS') return { ...field, defaultValue: row.APELLIDOS || '' };
        if (field.name === 'ID_GRUPO') return { ...field, defaultValue: row.ID_GRUPO || '' };
        if (field.name === 'ID_CARRERA') return { ...field, defaultValue: row.ID_CARRERA || '' };
        if (field.name === 'ACTIVO') return { ...field, defaultValue: row.POSTULANTE_ACTIVO !== false };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId, selectedGrupoId, postulantesCrud.selectedRow]);

  // ===== Configs =====
  const tableLevelConfigs = getTableLevelConfigs(postulantesCrud, handleAddPostulante);

  const crudLevels = useMemo(() => [
    {
      crud: postulantesCrud,
      tableName: 'VW_POSTULANTE',
      primaryKey: 'ID_POSTULANTE',
      formFields: dynamicPostulanteFields,
      formLayout: null,
      validation: postulanteValidation,
      confirmSubmit: true,
      modalConfig: postulanteModalConfig,
      onCreateClose: handleCreateClose
    }
  ], [postulantesCrud, dynamicPostulanteFields]);

  return {
    // CSV
    csvModalOpen,
    setCsvModalOpen,
    handleImportSuccess,
    // Selector
    selectedPeriodo,
    handlePeriodoChange,
    // Data
    records,
    loading,
    error,
    // CRUD
    tableLevelConfigs,
    crudLevels
  };
}
