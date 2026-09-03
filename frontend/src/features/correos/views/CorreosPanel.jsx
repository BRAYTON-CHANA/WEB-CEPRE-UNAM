import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import ViewCorreoModal from '@/features/correos/components/ViewCorreoModal';
import CorreoComposer from '@/features/correos/components/CorreoComposer';
import { headerProps, getHeaderActions } from '@/features/correos/config/correos/headerConfig';
import { useCorreos } from '@/features/correos/hooks/useCorreos';

/**
 * CorreosPanel — página de gestión de correos.
 * Tabla CORREOS + CRUD + composer + view modal + enviar.
 */
function CorreosPanel() {
  const {
    records, loading, error, refresh,
    correosCrud, tableLevelConfigs, crudLevels,
    composerOpen, editEmail,
    handleOpenComposer, handleEditComposer, handleCloseComposer,
    viewEmail, handleView, handleCloseView,
    handleEnviar
  } = useCorreos();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
            ...level,
            actions: level.actions ? {
              ...level.actions,
              edit: level.actions.edit ? { ...level.actions.edit, onClick: handleEditComposer } : undefined,
              observaciones: level.actions.observaciones ? { ...level.actions.observaciones, onClick: handleEditComposer } : undefined,
              delete: level.actions.delete ? { ...level.actions.delete, onClick: h.handleDelete } : undefined,
              enviar: level.actions.enviar ? { ...level.actions.enviar, onClick: handleEnviar } : undefined,
              ver: level.actions.ver ? level.actions.ver.map(action => ({ ...action, onClick: handleView })) : undefined
            } : undefined
          }));

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions(correosCrud, handleOpenComposer)}
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

              <ViewCorreoModal email={viewEmail} onClose={handleCloseView} />
              <CorreoComposer
                isOpen={composerOpen}
                editMode={!!editEmail}
                editData={editEmail}
                onClose={handleCloseComposer}
                onSuccess={() => { refresh(); handleCloseComposer(); }}
              />
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default CorreosPanel;
