import React from 'react';
import { useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ArrayEditorModal } from '@/shared/components';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/roles/config/headerConfig';
import { useRoles } from '@/features/roles/hooks/useRoles';

/**
 * Configuración de ROLES
 * CRUD + ACTIVO editable inline + modal de permisos.
 */
function RolesConfig() {
  const {
    records, loading, error,
    rolesCrud, tableLevelConfigs, crudLevels,
    permisosModalOpen, permisosEditingRow, permisosSaving,
    handleSavePermisos, handleClosePermisos
  } = useRoles();

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
                actions={getHeaderActions(rolesCrud)}
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
                    key={h.refreshTrigger}
                    data={records}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_ROL || 'Rol'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  />
                </div>
              )}

              <ArrayEditorModal
                isOpen={permisosModalOpen}
                onClose={handleClosePermisos}
                title={`Permisos del rol: ${permisosEditingRow?.NOMBRE_ROL || ''}`}
                tableName="PERMISOS"
                valueField="ID_PERMISO"
                labelTemplate="{RECURSO}: {ACCION}"
                searchField="DESCRIPCION"
                searchPlaceholder="Buscar por descripción..."
                groupByField="RECURSO"
                selectedValues={permisosEditingRow?.ID_PERMISOS || []}
                onSave={handleSavePermisos}
                loading={permisosSaving}
              />
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default RolesConfig;
