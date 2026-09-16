import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { PermisosEditorModal, SedesEditorModal } from '@/shared/components';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/roles/config/headerConfig';
import { useRoles } from '@/features/roles/hooks/useRoles';

/**
 * RolesPanel — página de gestión de roles.
 * CRUD simple (datos del rol) + modal separado de permisos + ACTIVO editable inline.
 * Al crear un rol, abre automáticamente el modal de permisos.
 */
function RolesPanel() {
  const {
    records, loading, error, refresh,
    rolesCrud, tableLevelConfigs, crudLevels,
    permisosModalOpen, permisosEditingRow, permisosSaving,
    handleSavePermisos, handleClosePermisos,
    sedesModalOpen, sedesEditingRow, sedesSaving,
    handleSaveSedes, handleCloseSedes
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

              {!loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevelEditable
                    key={h.refreshTrigger}
                    data={records}
                    levelConfigs={enrichedLevelConfigs}
                    externalError={error}
                    onRefreshExternal={refresh}
                    searchFields={['NOMBRE_ROL', 'DESCRIPCION']}
                    searchPlaceholder="Buscar por nombre o descripción..."
                    saveMode="auto"
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_ROL || 'Rol'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  />
                </div>
              )}

              <PermisosEditorModal
                isOpen={permisosModalOpen}
                onClose={handleClosePermisos}
                title={permisosEditingRow?.NOMBRE_ROL ? `Permisos del rol: ${permisosEditingRow.NOMBRE_ROL}` : 'Asignar permisos al nuevo rol'}
                selectedValues={(permisosEditingRow?.PERMISOS || []).map(p => p.id_permiso).filter(Boolean)}
                onSave={handleSavePermisos}
                loading={permisosSaving}
              />

              <SedesEditorModal
                isOpen={sedesModalOpen}
                onClose={handleCloseSedes}
                title={sedesEditingRow?.NOMBRE_ROL ? `Sedes del rol: ${sedesEditingRow.NOMBRE_ROL}` : 'Asignar sedes al rol'}
                selectedValues={(sedesEditingRow?.SEDES || []).map(s => s.id_sede).filter(Boolean)}
                onSave={handleSaveSedes}
                loading={sedesSaving}
              />
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default RolesPanel;
