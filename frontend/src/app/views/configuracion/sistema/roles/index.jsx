import React, { useState, useCallback } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ArrayEditorModal } from '@/shared/components';
import { db } from '@/shared/api';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/roles/config/tableConfig';
import { rolesFormFields, rolesValidation, rolesModalConfig } from '@/features/roles/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/roles/config/headerConfig';

/**
 * Configuración de ROLES
 * CRUD completo para la tabla ROLES usando CrudMultiLevelManager con un solo nivel.
 * Incluye modal de edición de permisos con ArrayEditorModal.
 */
function RolesConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const rolesCrud = useCrudForms({
    tableName: 'ROLES',
    primaryKey: 'ID_ROL',
    onRefresh: refresh
  });

  // Estado para modal de permisos
  const [permisosModalOpen, setPermisosModalOpen] = useState(false);
  const [permisosEditingRow, setPermisosEditingRow] = useState(null);
  const [permisosSaving, setPermisosSaving] = useState(false);

  const handleEditPermisos = useCallback((row) => {
    setPermisosEditingRow(row);
    setPermisosModalOpen(true);
  }, []);

  const handleSavePermisos = useCallback(async (newIds) => {
    if (!permisosEditingRow) return;
    setPermisosSaving(true);
    try {
      await db.update('ROLES', permisosEditingRow.ID_ROL, { ID_PERMISOS: newIds }, 'ID_ROL');
      setPermisosModalOpen(false);
      setPermisosEditingRow(null);
      refresh();
    } catch (err) {
      console.error('Error guardando permisos:', err);
    } finally {
      setPermisosSaving(false);
    }
  }, [permisosEditingRow, refresh]);

  const tableLevelConfigs = getTableLevelConfigs(rolesCrud, handleEditPermisos);

  const crudLevels = [
    {
      crud: rolesCrud,
      tableName: 'ROLES',
      primaryKey: 'ID_ROL',
      formFields: rolesFormFields,
      formLayout: null,
      validation: rolesValidation,
      confirmSubmit: true,
      modalConfig: rolesModalConfig
    }
  ];

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
                  <TableMultiLevel
                    key={h.refreshTrigger}
                    data={records}
                    levelConfigs={enrichedLevelConfigs}
                  />
                </div>
              )}

              <ArrayEditorModal
                isOpen={permisosModalOpen}
                onClose={() => {
                  setPermisosModalOpen(false);
                  setPermisosEditingRow(null);
                }}
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
