import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/areas/config/headerConfig';
import { useAreas } from '@/features/areas/hooks/useAreas';

/**
 * AreasPanel — página de gestión de áreas.
 * Tabla AREAS + CRUD via CrudMultiLevelManager.
 */
function AreasPanel() {
  const {
    tableRecords, loading, error, refresh,
    areasCrud, tableLevelConfigs, crudLevels,
    handleSaveSuccess
  } = useAreas();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
            ...level,
            actions: level.actions ? {
              ...level.actions,
              edit: level.actions.edit ? { ...level.actions.edit, onClick: h.handleEdit } : undefined,
              delete: level.actions.delete ? { ...level.actions.delete, onClick: h.handleDelete } : undefined
            } : undefined
          }));

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions(areasCrud)}
              />

              {loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando datos...</p>
                </div>
              )}

              {!loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevelEditable
                    data={tableRecords}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    externalError={error}
                    onRefreshExternal={refresh}
                    onSaveSuccess={handleSaveSuccess}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_AREA || 'Área'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
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

export default AreasPanel;
