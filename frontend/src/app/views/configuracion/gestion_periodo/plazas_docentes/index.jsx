import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { headerProps, getHeaderActions } from '@/features/plazas_docentes/config/headerConfig';
import { usePlazasDocentes } from '@/features/plazas_docentes/hooks/usePlazasDocentes';

/**
 * Plazas Docentes — CRUD multinivel con selector de período.
 * Nivel 1: SEDES → Nivel 2: VW_PLAZA_DOCENTE_ASIGNADA (lazy load).
 */
function PlazasDocentesConfig() {
  const {
    selectedPeriodo, setSelectedPeriodo,
    records, loading, error, updateRecord,
    tableLevelConfigs, crudLevels, childrenData, childrenLoading, handleExpand
  } = usePlazasDocentes();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {() => (
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

export default PlazasDocentesConfig;
