import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import ErrorAlert from '@/shared/components/ui/ErrorAlert';
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
    records, displayRecords, loading, error, refresh,
    searchTerm, setSearchTerm,
    sortBy, setSortBy, sortOrder, setSortOrder,
    correosCrud, tableLevelConfigs, crudLevels,
    composerOpen, editEmail,
    handleOpenComposer, handleEditComposer, handleCloseComposer,
    pendingView, handleOpenPendientes, handleOpenPendientesFromTable, handleClosePendientes,
    editPendienteEmail, editPendienteOpen,
    handleOpenEditPendiente, handleCloseEditPendiente, handleSuccessEditPendiente,
    pendientesRefreshKey,
    viewEmail, handleView, handleCloseView,
    recipientsEmail, handleViewRecipients, handleCloseRecipients,
    handleEnviar, sendingIds
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
              enviar: level.actions.enviar ? { ...level.actions.enviar, onClick: handleEnviar, disabled: () => sendingIds.size > 0 } : undefined,
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

              <ErrorAlert error={error} loading={loading} onRetry={refresh} />

              {!loading && !error && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-gray-100 bg-slate-50/40">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por asunto, destinatario, creador, estado..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none bg-white"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <select
                      value={`${sortBy}:${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split(':');
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none bg-white"
                    >
                      <option value="CREADO_EN:desc">Creación: más reciente primero</option>
                      <option value="CREADO_EN:asc">Creación: más antiguo primero</option>
                      <option value="ENVIADO_EN:desc">Envío: más reciente primero</option>
                      <option value="ENVIADO_EN:asc">Envío: más antiguo primero</option>
                    </select>
                    <button
                      type="button"
                      onClick={refresh}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refrescar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <TableMultiLevel
                      key={h.refreshTrigger}
                      data={displayRecords}
                      levelConfigs={enrichedLevelConfigs}
                    />
                  </div>
                </div>
              )}

              <ViewCorreoModal email={viewEmail} onClose={handleCloseView} />
              <RecipientsModal email={recipientsEmail} onClose={handleCloseRecipients} />

              {sendingIds.size > 0 && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25346A] text-white px-5 py-3 rounded-xl shadow-lg">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm font-medium">Enviando correo...</span>
                </div>
              )}
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
