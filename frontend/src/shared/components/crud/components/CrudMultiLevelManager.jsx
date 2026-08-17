import React from 'react';
import { CrudForm } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';

/**
 * CrudMultiLevelManager — render prop que gestiona modales CRUD para N tablas.
 * El caller es dueño del layout, tabla y header.
 *
 * @param {Array} crudLevels — configs CRUD por tabla:
 *   [{
 *     crud: useCrudFormsResult,
 *     tableName, primaryKey, formFields,
 *     formLayout, multiStep, validation, confirmSubmit,
 *     modalConfig: { createTitle, editTitle, deleteTitle, deleteMessage, size,
 *                    createFormKey, editFormKey },
 *     onCreateSuccess, onEditSuccess, onCreateClose, onEditClose
 *   }]
 * @param {Function} children — ({ handlers }) => JSX
 *   handlers: array con { handleCreate, handleEdit, handleDelete, refreshTrigger,
 *                          notification, closeNotification } por nivel
 */
function CrudMultiLevelManager({ crudLevels = [], children }) {
  const handlers = crudLevels.map(level => ({
    handleCreate:      level.crud.handleCreate,
    handleEdit:        level.crud.handleEdit,
    handleDelete:      level.crud.handleDelete,
    refreshTrigger:    level.crud.refreshTrigger,
    notification:      level.crud.notification,
    closeNotification: level.crud.closeNotification
  }));

  return (
    <>
      {children?.(handlers)}

      {/* ===== MODALES POR CADA NIVEL CRUD ===== */}
      {crudLevels.map((level, idx) => {
        const {
          crud,
          tableName,
          primaryKey,
          formFields,
          editFormFields,
          formLayout = null,
          multiStep,
          validation,
          editValidation,
          confirmSubmit = true,
          modalConfig = {},
          editModalConfig = {},
          createFunction = null,
          editFunction = null
        } = level;

        const {
          createTitle = 'Crear Nuevo Registro',
          editTitle = 'Editar Registro',
          deleteTitle = '¿Eliminar registro?',
          deleteMessage = (row) => `¿Estás seguro de que deseas eliminar este registro?`,
          size = 'lg',
          createFormKey = 'free',
          editFormKey = 'free'
        } = modalConfig;

        const {
          editTitle: editTitleOverride = editTitle,
          size: editSize = size,
          editFormKey: editFormKeyOverride = editFormKey
        } = editModalConfig;

        const createKey = typeof createFormKey === 'function'
          ? createFormKey(crud)
          : createFormKey;
        const editKey = typeof editFormKey === 'function'
          ? editFormKey(crud)
          : editFormKey;

        return (
          <React.Fragment key={`crud-level-${idx}`}>
            {/* Crear */}
            <Modal
              isOpen={crud.isCreateOpen}
              onClose={() => {
                level.onCreateClose?.();
                crud.handleCloseCreate();
              }}
              title={createTitle}
              size={size}
              closeOnOutsideClick={false}
            >
              <div className="p-6">
                <CrudForm
                  key={`create-${tableName}-${createKey}`}
                  tableName={tableName}
                  mode="create"
                  fields={formFields}
                  primaryKey={primaryKey}
                  layout={formLayout}
                  multiStep={multiStep}
                  confirmSubmit={confirmSubmit}
                  validation={validation}
                  createFunction={createFunction}
                  onSuccess={(result) => {
                    level.onCreateSuccess?.(result);
                    crud.handleFormSuccess(result);
                  }}
                  onError={crud.handleFormError}
                />
              </div>
            </Modal>

            {/* Editar */}
            <Modal
              isOpen={crud.isEditOpen}
              onClose={() => {
                level.onEditClose?.();
                crud.handleCloseEdit();
              }}
              title={editTitleOverride}
              size={editSize}
              closeOnOutsideClick={false}
            >
              <div className="p-6">
                {crud.selectedRow && (
                  <CrudForm
                    key={`edit-${tableName}-${crud.selectedRow[primaryKey]}-${editFormKeyOverride}`}
                    tableName={tableName}
                    mode="edit"
                    recordId={crud.selectedRow[primaryKey]}
                    fields={editFormFields || formFields}
                    primaryKey={primaryKey}
                    layout={formLayout}
                    multiStep={multiStep}
                    confirmSubmit={confirmSubmit}
                    validation={editValidation || validation}
                    editFunction={editFunction}
                    onSuccess={(result) => {
                      level.onEditSuccess?.(result);
                      crud.handleFormSuccess(result);
                    }}
                    onError={crud.handleFormError}
                  />
                )}
              </div>
            </Modal>

            {/* Eliminar */}
            <FormConfirmModal
              isOpen={crud.isDeleteOpen}
              onConfirm={crud.handleConfirmDelete}
              onCancel={crud.handleCancelDelete}
              config={{
                title: deleteTitle,
                message: crud.rowToDelete
                  ? deleteMessage(crud.rowToDelete)
                  : '¿Estás seguro de que deseas eliminar este registro?',
                confirmText: crud.deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
                cancelText: 'Cancelar'
              }}
            />

            {/* Notificación */}
            <Modal
              isOpen={crud.notification.isOpen}
              onClose={crud.closeNotification}
              title={crud.notification.title}
              closeOnOutsideClick={true}
              closeOnEscapeKey={true}
            >
              <div className="text-center py-4 px-6">
                {crud.notification.type === 'success' ? (
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
                <p className={`text-sm ${crud.notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {crud.notification.message}
                </p>
                <button
                  onClick={crud.closeNotification}
                  className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${crud.notification.type === 'success'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  Aceptar
                </button>
              </div>
            </Modal>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default CrudMultiLevelManager;
