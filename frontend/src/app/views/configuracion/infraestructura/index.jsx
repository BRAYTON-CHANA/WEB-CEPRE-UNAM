import React, { useState, useMemo } from 'react';
import { useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { headerProps, getHeaderActions, getSedesLevelConfig } from '@/features/sedes/config/sedesTableConfig';
import { sedesFormFields, sedesMultiStep, sedesValidation, sedesModalConfig } from '@/features/sedes/config/sedesFormConfig';
import { aulaBaseFields, aulaMultiStep, aulaValidation, aulasModalConfig } from '@/features/aulas/config/aulasFormConfig';
import { getAulasLevelConfig } from '@/features/aulas/config/aulasTableConfig';

const FETCH_CONFIGS = [
  { tableName: 'SEDES', primaryKey: 'ID_SEDE', filters: {} },
  { tableName: 'AULAS', primaryKey: 'ID_AULA', parentKey: 'ID_SEDE' }
];

function SedesYAulasConfig() {
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

  const tableLevelConfigs = [
    getSedesLevelConfig(sedesCrud, handleAddAulaFromSede),
    getAulasLevelConfig({ ...aulasCrud, handleEdit: handleEditAula })
  ];

  const crudLevels = [
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
      formLayout: null,
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
        {([sedesHandler, aulasHandler]) => (
          <div className="px-8 py-8 space-y-8 pb-12">
            <CrudHeader
              headerTitle={headerProps.headerTitle}
              headerDescription={headerProps.headerDescription}
              actions={getHeaderActions(sedesCrud)}
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
                  onSaveSuccess={(recordId, field, newValue, primaryKey) => updateRecord(recordId, primaryKey, field, newValue)}
                  formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) => `${rowData?.NOMBRE_SEDE || rowData?.NOMBRE_AULA || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`}
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
        )}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default SedesYAulasConfig;
