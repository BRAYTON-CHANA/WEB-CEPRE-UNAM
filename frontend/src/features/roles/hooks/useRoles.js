import { useState, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { db } from '@/shared/api';
import { tableConfig, getTableLevelConfigs } from '@/features/roles/config/tableConfig';
import { rolesFormFields, rolesValidation, rolesModalConfig } from '@/features/roles/config/formConfig';

/**
 * useRoles — lógica de la página de Roles.
 * CRUD + edición de permisos via ArrayEditorModal + ACTIVO editable inline.
 */
export function useRoles() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const rolesCrud = useCrudForms({
    tableName: 'ROLES',
    primaryKey: 'ID_ROL',
    onRefresh: refresh
  });

  // ===== Modal de permisos =====
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

  const handleClosePermisos = useCallback(() => {
    setPermisosModalOpen(false);
    setPermisosEditingRow(null);
  }, []);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs(rolesCrud, handleEditPermisos), [rolesCrud, handleEditPermisos]);

  const crudLevels = useMemo(() => [
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
  ], [rolesCrud]);

  return {
    records,
    loading,
    error,
    rolesCrud,
    tableLevelConfigs,
    crudLevels,
    // Permisos modal
    permisosModalOpen,
    permisosEditingRow,
    permisosSaving,
    handleEditPermisos,
    handleSavePermisos,
    handleClosePermisos
  };
}
