import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/correos/config/password-reset/headerConfig';
import { usePasswordReset } from '@/features/correos/hooks/usePasswordReset';

/**
 * PasswordResetPanel — página de códigos de reset de password.
 * CRUD + acción de limpieza (clean) de códigos usados/expirados.
 */
function PasswordResetPanel() {
  const {
    records, loading, error,
    passwordResetCrud, tableLevelConfigs, crudLevels,
    handleClean, cleanLoading
  } = usePasswordReset();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => (
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
                  levelConfigs={tableLevelConfigs}
                />
              </div>
            )}
          </div>
        )}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default PasswordResetPanel;
