import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import ViewCorreoModal from '../components/ViewCorreoModal';
import RecipientsModal from '../components/RecipientsModal';
import CorreoComposer from '../components/CorreoComposer';
import PendientesView from '../components/PendientesView';
import EditPendienteModal from '../components/EditPendienteModal';
import { headerProps, getHeaderActions } from '../config/headerConfig';
import { useEmails } from '../hooks/useEmails';

/**
 * EmailsPanel — página de gestión de correos.
 * Tabla CORREOS + CRUD + composer + pendientes + view modal + enviar.
 */
function EmailsPanel() {
  const {
    records, loading, error, refresh,
    correosCrud, tableLevelConfigs, crudLevels,
    composerOpen, editEmail,
    handleOpenComposer, handleEditComposer, handleCloseComposer,
    pendingView, handleOpenPendientes, handleOpenPendientesFromTable, handleClosePendientes,
    editPendienteEmail, editPendienteOpen,
    handleOpenEditPendiente, handleCloseEditPendiente, handleSuccessEditPendiente,
    pendientesRefreshKey,
    viewEmail, handleView, handleCloseView,
    recipientsEmail, handleViewRecipients, handleCloseRecipients,
    handleEnviar
  } = useEmails();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          if (composerOpen) {
            return (
              <CorreoComposer
                key={editEmail?.ID_CORREO || 'nuevo-correo'}
                editMode={!!editEmail}
                editData={editEmail}
                onBack={handleCloseComposer}
                onSuccess={(result) => {
                  if (editEmail) {
                    handleCloseComposer();
                    refresh();
                  } else {
                    handleOpenPendientes(result?.ids || []);
                  }
                }}
              />
            );
          }

          if (pendingView) {
            return (
              <PendientesView
                ids={pendingView.ids}
                onBack={handleClosePendientes}
                onEdit={handleOpenEditPendiente}
                refreshTrigger={pendientesRefreshKey}
              />
            );
          }

          const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
            ...level,
            actions: level.actions ? {
              ...level.actions,
              edit: level.actions.edit ? { ...level.actions.edit, onClick: handleOpenEditPendiente } : undefined,
              observaciones: level.actions.observaciones ? { ...level.actions.observaciones, onClick: handleEditComposer } : undefined,
              delete: level.actions.delete ? { ...level.actions.delete, onClick: h.handleDelete } : undefined,
              enviar: level.actions.enviar ? { ...level.actions.enviar, onClick: handleEnviar } : undefined,
              ver: level.actions.ver ? level.actions.ver.map(action => ({
                ...action,
                onClick: action.label === 'Ver destinatarios' ? handleViewRecipients : handleView
              })) : undefined
            } : undefined
          }));

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions(correosCrud, handleOpenComposer, handleOpenPendientesFromTable)}
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
              <RecipientsModal email={recipientsEmail} onClose={handleCloseRecipients} />
            </div>
          );
        }}
      </CrudMultiLevelManager>

      <EditPendienteModal
        key={editPendienteEmail?.ID_CORREO ?? 'closed'}
        email={editPendienteEmail}
        isOpen={editPendienteOpen}
        onClose={handleCloseEditPendiente}
        onSuccess={handleSuccessEditPendiente}
      />
    </ConfigLayout>
  );
}

export default EmailsPanel;
