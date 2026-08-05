import React from 'react';
import { useTableData } from '../hooks/useTableData';
import { useCrudForms } from '../hooks/useCrudForms';
import CrudMultiLevelManager from '../components/CrudMultiLevelManager';
import CrudHeader from './CrudHeader';
import CrudFooter from './CrudFooter';
import TableMultiLevel from '@/shared/components/table/views/TableMultiLevel';

/**
 * CrudMultiLevel — CRUD completo para una tabla multinivel.
 * Combina CrudMultiLevelManager (modales) con layout propio (header, tabla, footer).
 *
 * @param {Object} tableConfig  - { tableName, levelConfigs }
 * @param {Object} formConfig   - { tableName, primaryKey, fields, layout, multiStep, confirmSubmit, validation }
 * @param {Object} modalConfig  - { createTitle, editTitle, deleteTitle, deleteMessage, size }
 * @param {Object} headerProps  - { headerTitle, headerDescription, createButtonText, actions, ... }
 * @param {Object} footerProps  - opcional
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function CrudMultiLevel({
  tableConfig = {},
  formConfig = {},
  modalConfig = {},
  headerProps = {},
  footerProps = {},
  onSuccess,
  onError
}) {
  const { tableName, levelConfigs = [] } = tableConfig;
  const { records, loading, error, refresh } = useTableData(tableName);

  const crud = useCrudForms({
    tableName:  formConfig.tableName || tableName,
    primaryKey: formConfig.primaryKey || 'ID',
    onSuccess,
    onError,
    onRefresh: refresh
  });

  return (
    <CrudMultiLevelManager
      crudLevels={[{
        crud,
        tableName:     formConfig.tableName || tableName,
        primaryKey:    formConfig.primaryKey || 'ID',
        formFields:    formConfig.fields || [],
        formLayout:    formConfig.layout || null,
        multiStep:     formConfig.multiStep,
        validation:    formConfig.validation,
        confirmSubmit: formConfig.confirmSubmit ?? true,
        modalConfig
      }]}
    >
      {([h]) => {
        const enrichedLevelConfigs = levelConfigs.map(level => ({
          ...level,
          actions: level.actions ? {
            ...level.actions,
            edit:   level.actions.edit   ? { ...level.actions.edit,   onClick: h.handleEdit   } : undefined,
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
              actions={[
                ...(headerProps.actions || []),
                { text: headerProps.createButtonText || 'Nuevo', onClick: h.handleCreate, font: 'bg-green-600 hover:bg-green-700 text-white' }
              ]}
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

            <CrudFooter {...footerProps} />
          </div>
        );
      }}
    </CrudMultiLevelManager>
  );
}

export default CrudMultiLevel;
