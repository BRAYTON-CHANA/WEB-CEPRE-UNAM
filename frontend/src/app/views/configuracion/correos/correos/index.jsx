import React from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/correos/tableConfig';
import { correosFormFields, correosMultiStep, correosValidation, correosModalConfig } from '@/features/correos/config/correos/formConfig';
import { headerProps, getHeaderActions } from '@/features/correos/config/correos/headerConfig';

/**
 * Configuración de CORREOS
 * CRUD completo para la tabla CORREOS usando CrudMultiLevelManager con un solo nivel.
 */
function CorreosConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  const correosCrud = useCrudForms({
    tableName: 'CORREOS',
    primaryKey: 'ID_CORREO',
    onRefresh: refresh
  });

  const tableLevelConfigs = getTableLevelConfigs(correosCrud);

  const crudLevels = [
    {
      crud: correosCrud,
      tableName: 'CORREOS',
      primaryKey: 'ID_CORREO',
      formFields: correosFormFields,
      formLayout: null,
      multiStep: correosMultiStep,
      validation: correosValidation,
      confirmSubmit: true,
      modalConfig: correosModalConfig
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
                actions={getHeaderActions(correosCrud)}
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

export default CorreosConfig;
