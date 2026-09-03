import { useState, useMemo, useCallback } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { db } from '@/shared/api';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/password-reset/tableConfig';
import {
  passwordResetFormFields,
  passwordResetMultiStep,
  passwordResetValidation,
  passwordResetModalConfig
} from '@/features/correos/config/password-reset/formConfig';

/**
 * usePasswordReset — lógica de la página de códigos de reset de password.
 * CRUD estándar + acción custom de limpieza (clean).
 */
export function usePasswordReset() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const passwordResetCrud = useCrudForms({
    tableName: 'PASSWORD_RESET_CODES',
    primaryKey: 'ID_RESET',
    onRefresh: refresh
  });

  const [cleanLoading, setCleanLoading] = useState(false);

  const handleClean = useCallback(async () => {
    if (cleanLoading) return;
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar todos los códigos usados o expirados?'
    );
    if (!confirmed) return;
    setCleanLoading(true);
    try {
      await db.query(
        'DELETE FROM "PASSWORD_RESET_CODES" WHERE "USADO" = true OR "EXPIRA_EN" < NOW()'
      );
      refresh();
      passwordResetCrud.showNotification(
        'success',
        'Limpieza Exitosa',
        'Se eliminaron los códigos usados o expirados.'
      );
    } catch (error) {
      passwordResetCrud.showNotification(
        'error',
        'Error al Limpiar',
        error.message || 'No se pudieron eliminar los códigos.'
      );
    } finally {
      setCleanLoading(false);
    }
  }, [cleanLoading, refresh, passwordResetCrud]);

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(passwordResetCrud),
    [passwordResetCrud]
  );

  const crudLevels = useMemo(() => [
    {
      crud: passwordResetCrud,
      tableName: 'PASSWORD_RESET_CODES',
      primaryKey: 'ID_RESET',
      formFields: passwordResetFormFields,
      formLayout: null,
      multiStep: passwordResetMultiStep,
      validation: passwordResetValidation,
      confirmSubmit: true,
      modalConfig: passwordResetModalConfig
    }
  ], [passwordResetCrud]);

  return {
    records,
    loading,
    error,
    passwordResetCrud,
    tableLevelConfigs,
    crudLevels,
    handleClean,
    cleanLoading
  };
}
