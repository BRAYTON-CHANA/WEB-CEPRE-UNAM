import React, { useState } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { db } from '@/shared/api';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/password-reset/tableConfig';
import { passwordResetFormFields, passwordResetMultiStep, passwordResetValidation, passwordResetModalConfig } from '@/features/correos/config/password-reset/formConfig';
import { headerProps, getHeaderActions } from '@/features/correos/config/password-reset/headerConfig';

/**
 * Configuración de PASSWORD_RESET_CODES
 * CRUD completo usando CrudMultiLevelManager con un solo nivel.
 */
function PasswordResetConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const passwordResetCrud = useCrudForms({
    tableName: 'PASSWORD_RESET_CODES',
    primaryKey: 'ID_RESET',
    onRefresh: refresh
  });

  const [cleanLoading, setCleanLoading] = useState(false);

  const handleClean = async () => {
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
  };

  const tableLevelConfigs = getTableLevelConfigs(passwordResetCrud);

  const crudLevels = [
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
  ];

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          const enrichedLevelConfigs = tableLevelConfigs;

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions({ onClean: handleClean, loading: cleanLoading })}
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
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default PasswordResetConfig;
