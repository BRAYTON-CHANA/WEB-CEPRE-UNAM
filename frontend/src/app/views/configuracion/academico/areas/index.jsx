import React, { useState, useEffect, useCallback } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/areas/config/tableConfig';
import { areasFormFields, areasMultiStep, areasValidation, areasModalConfig } from '@/features/areas/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/areas/config/headerConfig';

/**
 * Configuración de ÁREAS
 * CRUD completo para la tabla AREAS usando CrudMultiLevelManager con un solo nivel.
 */
function AreasConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  const areasCrud = useCrudForms({
    tableName: 'AREAS',
    primaryKey: 'ID_AREA',
    onRefresh: refresh
  });

  const tableLevelConfigs = getTableLevelConfigs(areasCrud);

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_AREA) === String(recordId) ? { ...row, [field]: newValue } : row)
    );
  }, []);

  const crudLevels = [
    {
      crud: areasCrud,
      tableName: 'AREAS',
      primaryKey: 'ID_AREA',
      formFields: areasFormFields,
      formLayout: null,
      multiStep: areasMultiStep,
      validation: areasValidation,
      confirmSubmit: true,
      modalConfig: areasModalConfig
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
                actions={getHeaderActions(areasCrud)}
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
                    data={tableRecords}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    onSaveSuccess={handleSaveSuccess}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) => `${rowData?.NOMBRE_AREA || 'Área'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`}
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
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

export default AreasConfig;
