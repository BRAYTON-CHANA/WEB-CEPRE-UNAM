import React, { useState, useMemo } from 'react';
import { useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { getSedesLevelConfig, getPlazasLevelConfig } from '@/features/plazas_docentes/config/tableConfig';
import { headerProps, getHeaderActions } from '@/features/plazas_docentes/config/headerConfig';
import { plazaFormFields, plazaMultiStep, plazaValidation, plazaModalConfig } from '@/features/plazas_docentes/config/formConfig';
import PostulacionesPlazaPanel from '@/features/plazas_docentes/components/PostulacionesPlazaPanel';

/**
 * Plazas Docentes — CRUD multinivel estilo Infraestructura.
 * Nivel 1: SEDES (seleccionables).
 * Nivel 2: plazas del período elegido filtradas por ID_SEDE e ID_PERIODO.
 */
function PlazasDocentesConfig() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState(null);

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
        return {
          ...field,
          defaultValue: selectedPeriodo,
          disabled: true
        };
      }
      if (selectedSedeForNewPlaza !== null && field.name === 'ID_SEDE') {
        return {
          ...field,
          defaultValue: selectedSedeForNewPlaza,
          disabled: true
        };
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

  const handleViewPostulantes = (row) => {
    setSelectedPlaza(row);
  };

  const handleBackToPlazas = () => {
    setSelectedPlaza(null);
  };

  const handleExpand = (levelIndex, parentValue) => {
    if (!selectedPeriodo) return;
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = [
    getSedesLevelConfig(plazasCrud, handleAddPlazaFromSede),
    getPlazasLevelConfig({ ...plazasCrud, handleEdit: handleEditPlaza }, handleViewPostulantes)
  ];

  const crudLevels = [
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
        {() => {
          if (selectedPlaza) {
            return <PostulacionesPlazaPanel plaza={selectedPlaza} onBack={handleBackToPlazas} />;
          }
          return (
            <div className="px-8 py-8 space-y-8 pb-12">
            <CrudHeader
              headerTitle={headerProps.headerTitle}
              headerDescription={headerProps.headerDescription}
              actions={getHeaderActions()}
            />

            {/* Selector de Período */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex-1 max-w-md">
                <ReferenceSelectInput
                  name="id_periodo"
                  label="Período Académico"
                  referenceTable="PERIODOS"
                  referenceField="ID_PERIODO"
                  referenceLabelField="NOMBRE_PERIODO"
                  placeholder="Seleccione un período..."
                  searchable={true}
                  value={selectedPeriodo}
                  onChange={(_, value) => setSelectedPeriodo(value)}
                  formData={{}}
                />
              </div>
            </div>

            {loading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando sedes...</p>
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
                  onSaveSuccess={(recordId, field, newValue, primaryKey) => updateRecord(recordId, primaryKey, field, newValue)}
                  formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                    `${rowData?.NOMBRE_SEDE || rowData?.IDENTIFICADOR_DOCENTE || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                  }
                  toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  tableProps={{
                    onExpand: handleExpand,
                    childrenData,
                    childrenLoading
                  }}
                />
              </div>
            )}
          </div>
        );
      }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default PlazasDocentesConfig;
