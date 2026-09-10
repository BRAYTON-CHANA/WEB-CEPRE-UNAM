import { useState, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { tableConfig, getTableLevelConfigs } from '@/features/roles/config/tableConfig';
import { rolesFormFields, rolesFormLayout, rolesValidation, rolesModalConfig } from '@/features/roles/config/formConfig';

/**
 * useRoles — lógica de la página de Roles.
 * CRUD simple (datos del rol) + modal separado de permisos.
 * Al crear un rol exitosamente, abre automáticamente el modal de permisos.
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

  const handleClosePermisos = useCallback(() => {
    setPermisosModalOpen(false);
    setPermisosEditingRow(null);
  }, []);

  const handleSavePermisos = useCallback(async (newIds) => {
    if (!permisosEditingRow) return;
    setPermisosSaving(true);
    try {
      const idRol = permisosEditingRow.ID_ROL;
      const permisosArr = '{' + newIds.map(Number).filter(Boolean).join(',') + '}';
      await db.query(
        `SELECT upsert_rol($1, NULL, NULL, NULL, $2)`,
        idRol,
        permisosArr
      );
      cacheService.invalidateAll();
      await refresh();
      setPermisosModalOpen(false);
      setPermisosEditingRow(null);
    } catch (err) {
      console.error('Error guardando permisos:', err);
    } finally {
      setPermisosSaving(false);
    }
  }, [permisosEditingRow, refresh]);

  // ===== Create: upsert_rol(NULL, ..., NULL) — sin permisos al crear =====
  const createFunction = useCallback(async (data, id, formData) => {
    const result = await db.query(
      `SELECT upsert_rol(NULL, $1, $2, $3, NULL)`,
      data.NOMBRE_ROL,
      data.DESCRIPCION || null,
      data.NIVEL_ACCESO || null
    );
    cacheService.invalidateAll();
    return result;
  }, []);

  // ===== Edit: upsert_rol(id, ..., NULL) — no toca permisos =====
  const editFunction = useCallback(async (data, id, formData) => {
    const result = await db.query(
      `SELECT upsert_rol($1, $2, $3, $4, NULL)`,
      id,
      data.NOMBRE_ROL || null,
      data.DESCRIPCION || null,
      data.NIVEL_ACCESO || null
    );
    cacheService.invalidateAll();
    return result;
  }, []);

  // ===== Tras crear rol exitosamente → abre modal de permisos =====
  const handleCreateSuccess = useCallback((result) => {
    // result es [{ upsert_rol: idRol }] o similar
    const newId = Array.isArray(result) ? result[0]?.upsert_rol : result?.upsert_rol;
    if (newId) {
      // Buscar el rol recién creado en los records tras refresh
      // Usar un row temporal con el ID; el modal cargará los permisos (vacíos)
      const tempRow = { ID_ROL: newId, NOMBRE_ROL: '', PERMISOS: [] };
      setPermisosEditingRow(tempRow);
      setPermisosModalOpen(true);
    }
  }, []);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs(rolesCrud, handleEditPermisos), [rolesCrud, handleEditPermisos]);

  const crudLevels = useMemo(() => [
    {
      crud: rolesCrud,
      tableName: 'ROLES',
      primaryKey: 'ID_ROL',
      viewName: 'VW_ROLES',
      formFields: rolesFormFields,
      formLayout: rolesFormLayout,
      validation: rolesValidation,
      confirmSubmit: true,
      modalConfig: rolesModalConfig,
      createFunction,
      editFunction,
      onCreateSuccess: handleCreateSuccess
    }
  ], [rolesCrud, createFunction, editFunction, handleCreateSuccess]);

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
