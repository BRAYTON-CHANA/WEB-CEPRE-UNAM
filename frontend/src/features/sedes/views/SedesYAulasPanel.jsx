import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { useSedesYAulas } from '@/features/sedes/hooks/useSedesYAulas';

/**
 * SedesYAulasPanel — página de gestión de infraestructura.
 * 2 niveles: SEDES → AULAS (lazy load).
 */
function SedesYAulasPanel() {
  const {
    records, loading, error, updateRecord,
    sedesCrud, tableLevelConfigs, crudLevels,
    childrenData, childrenLoading, handleExpand,
    headerProps, getHeaderActions
  } = useSedesYAulas();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {() => (
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
                  formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                    `${rowData?.NOMBRE_SEDE || rowData?.NOMBRE_AULA || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
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

export default SedesYAulasPanel;
