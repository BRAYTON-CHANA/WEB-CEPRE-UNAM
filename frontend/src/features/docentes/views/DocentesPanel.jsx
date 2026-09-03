import React, { useEffect } from 'react';
import { Modal } from '@/shared/components/modal';
import { TableMultiLevelEditable } from '@/shared/components/table';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/docentes/config/headerConfig';
import { docentesModalConfig } from '@/features/docentes/config/formConfig';
import { useDocentes } from '@/features/docentes/hooks/useDocentes';
import DocenteForm from '@/features/docentes/components/DocenteForm';
import DocenteArchivoViewerModal from '@/features/docentes/components/DocenteArchivoViewerModal';
import DocenteTablasModal from '@/features/docentes/components/DocenteTablasModal';

/**
 * DocentesPanel — página de gestión de docentes.
 * Tabla VW_DOCENTES + modal custom DocenteForm (2 páginas).
 * Delete y notificaciones via useCrudForms estándar.
 */
function DocentesPanel() {
  const {
    records, tableRecords, loading, error,
    docentesCrud, tableLevelConfigs,
    handleFormSuccess, handleFormError, handleSaveSuccess,
    updateRecords,
    archivoViewerOpen, archivoViewerDocente, archivoViewerTipo,
    handleCloseArchivoViewer, handleArchivoUpdated,
    tablasModalOpen, tablasModalDocente, handleCloseTablasModal
  } = useDocentes();

  // Sincronizar records de la API con tableRecords locales
  useEffect(() => {
    updateRecords(records || []);
  }, [records, updateRecords]);

  return (
    <ConfigLayout>
      <div className="px-8 py-8 space-y-8 pb-12">
        <CrudHeader
          headerTitle={headerProps.headerTitle}
          headerDescription={headerProps.headerDescription}
          titleClassName={headerProps.titleClassName}
          descriptionClassName={headerProps.descriptionClassName}
          actions={getHeaderActions(docentesCrud)}
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
              levelConfigs={tableLevelConfigs.map(level => ({
                ...level,
                actions: level.actions ? {
                  ...level.actions,
                  edit: level.actions.edit ? { ...level.actions.edit, onClick: docentesCrud.handleEdit } : undefined,
                  delete: level.actions.delete ? { ...level.actions.delete, onClick: docentesCrud.handleDelete } : undefined
                } : undefined
              }))}
              saveMode="auto"
              onSaveSuccess={handleSaveSuccess}
              formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                `${rowData?.NOMBRE_COMPLETO || 'Docente'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
              }
              toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
            />
          </div>
        )}
      </div>

      {/* === Modal Crear Docente === */}
      <Modal
        isOpen={docentesCrud.isCreateOpen}
        onClose={docentesCrud.handleCloseCreate}
        title={docentesModalConfig.createTitle}
        size={docentesModalConfig.size}
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          <DocenteForm
            key="create-docente"
            mode="create"
            onSuccess={handleFormSuccess}
            onError={handleFormError}
          />
        </div>
      </Modal>

      {/* === Modal Editar Docente === */}
      <Modal
        isOpen={docentesCrud.isEditOpen}
        onClose={docentesCrud.handleCloseEdit}
        title={docentesModalConfig.editTitle}
        size={docentesModalConfig.size}
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {docentesCrud.selectedRow && (
            <DocenteForm
              key={`edit-docente-${docentesCrud.selectedRow.ID_DOCENTE}`}
              mode="edit"
              recordId={docentesCrud.selectedRow.ID_DOCENTE}
              selectedRow={docentesCrud.selectedRow}
              onSuccess={handleFormSuccess}
              onError={handleFormError}
            />
          )}
        </div>
      </Modal>

      {/* === Modal Eliminar === */}
      <FormConfirmModal
        isOpen={docentesCrud.isDeleteOpen}
        onConfirm={docentesCrud.handleConfirmDelete}
        onCancel={docentesCrud.handleCancelDelete}
        config={{
          title: docentesModalConfig.deleteTitle,
          message: docentesCrud.rowToDelete
            ? docentesModalConfig.deleteMessage(docentesCrud.rowToDelete)
            : '¿Estás seguro de que deseas eliminar este registro?',
          confirmText: docentesCrud.deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* === Notificación === */}
      <Modal
        isOpen={docentesCrud.notification.isOpen}
        onClose={docentesCrud.closeNotification}
        title={docentesCrud.notification.title}
        closeOnOutsideClick={true}
        closeOnEscapeKey={true}
      >
        <div className="text-center py-4 px-6">
          {docentesCrud.notification.type === 'success' ? (
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`text-sm ${docentesCrud.notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {docentesCrud.notification.message}
          </p>
          <button
            onClick={docentesCrud.closeNotification}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${docentesCrud.notification.type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
              }`}
          >
            Aceptar
          </button>
        </div>
      </Modal>

      {/* === Modal Visor de Archivos (DNI, Grado, Título, Constancia) === */}
      <DocenteArchivoViewerModal
        open={archivoViewerOpen}
        docente={archivoViewerDocente}
        tipoArchivo={archivoViewerTipo}
        onClose={handleCloseArchivoViewer}
        onUpdated={handleArchivoUpdated}
      />

      {/* === Modal Tablas Relacionadas (standalone) === */}
      <DocenteTablasModal
        open={tablasModalOpen}
        docente={tablasModalDocente}
        onClose={handleCloseTablasModal}
        onSuccess={handleFormSuccess}
      />
    </ConfigLayout>
  );
}

export default DocentesPanel;
