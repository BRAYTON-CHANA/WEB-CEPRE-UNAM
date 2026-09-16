import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { headerProps, getHeaderActions } from '@/features/turnos/fechasBloqueadas/config/headerConfig';
import { useFechasBloqueadas } from '@/features/turnos/fechasBloqueadas/hooks/useFechasBloqueadas';

export default function FechasBloqueadasPanel() {
  const {
    records,
    loading,
    error,
    refresh,
    crud,
    tableLevelConfigs,
    crudLevels
  } = useFechasBloqueadas();

  return (
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
              actions={getHeaderActions(crud)}
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
                  data={records}
                  levelConfigs={enrichedLevelConfigs}
                  saveMode="auto"
                  tableProps={{ pagination: true, itemsPerPage: 100 }}
                  externalLoading={loading}
                  externalError={error}
                  onRefreshExternal={refresh}
                />
              </div>
            )}
          </div>
        );
      }}
    </CrudMultiLevelManager>
  );
}
