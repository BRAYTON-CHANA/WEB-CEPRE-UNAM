import React from 'react';
import { CrudForm } from '@/features/form';
import { Modal } from '@/features/modal';
import FormConfirmModal from '@/features/form/components/FormConfirmModal';
import { useCrudForms } from '../hooks/useCrudForms';

/**
 * CrudFormsManager
 * Componente reutilizable que encapsula los modales de crear, editar, eliminar
 * y notificaciones para operaciones CRUD.
 *
 * La página renderiza su propia tabla y usa los handlers expuestos.
 *
 * @param {string} tableName - Tabla para operaciones delete
 * @param {string} primaryKey - Campo PK
 * @param {Array} formFields - Campos del formulario
 * @param {Object} formLayout - Layout del formulario
 * @param {Object} formMultiStep - Config multi-step
 * @param {Object} formValidation - Validaciones
 * @param {boolean} confirmSubmit - Confirmar antes de submit
 * @param {string} modalWidthClass - Clase CSS del ancho del modal (ej: 'w-1/2')
 * @param {string} createTitle - Título modal crear
 * @param {string} editTitle - Título modal editar
 * @param {string} deleteTitle - Título modal confirmación eliminar
 * @param {Function|string} deleteMessage - Mensaje de confirmación (función recibe row)
 * @param {Function} onSuccess - Callback éxito
 * @param {Function} onError - Callback error
 * @param {Function} onRefresh - Callback para refrescar datos externos
 * @param {Function} children - Render prop: ({ handleCreate, handleEdit, handleDelete, refreshTrigger, notification, closeNotification }) => JSX
 */
function CrudFormsManager({
  tableName,
  primaryKey = 'ID',
  formFields = [],
  formLayout = null,
  formMultiStep,
  formValidation,
  confirmSubmit = true,
  modalWidthClass = 'w-1/2',
  createTitle = 'Crear Nuevo Registro',
  editTitle = 'Editar Registro',
  deleteTitle = '¿Eliminar registro?',
  deleteMessage = (row) => `¿Estás seguro de que deseas eliminar este registro?`,
  onSuccess,
  onError,
  onRefresh,
  children
}) {
  const crud = useCrudForms({ tableName, primaryKey, onSuccess, onError, onRefresh });

  const getDeleteMessage = () => {
    if (!crud.rowToDelete) return '¿Estás seguro de que deseas eliminar este registro?';
    return typeof deleteMessage === 'function'
      ? deleteMessage(crud.rowToDelete)
      : deleteMessage;
  };

  return (
    <>
      {children({
        handleCreate: crud.handleCreate,
        handleEdit: crud.handleEdit,
        handleDelete: crud.handleDelete,
        refreshTrigger: crud.refreshTrigger,
        notification: crud.notification,
        closeNotification: crud.closeNotification
      })}

      {/* Modal Crear */}
      <Modal
        isOpen={crud.isCreateOpen}
        onClose={crud.handleCloseCreate}
        title={createTitle}
        widthClass={modalWidthClass}
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          <CrudForm
            tableName={tableName}
            mode="create"
            fields={formFields}
            primaryKey={primaryKey}
            layout={formLayout}
            multiStep={formMultiStep}
            confirmSubmit={confirmSubmit}
            validation={formValidation}
            onSuccess={crud.handleFormSuccess}
            onError={crud.handleFormError}
          />
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={crud.isEditOpen}
        onClose={crud.handleCloseEdit}
        title={editTitle}
        widthClass={modalWidthClass}
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {crud.selectedRow && (
            <CrudForm
              key={`edit-form-${crud.selectedRow[primaryKey]}`}
              tableName={tableName}
              mode="edit"
              recordId={crud.selectedRow[primaryKey]}
              fields={formFields}
              primaryKey={primaryKey}
              layout={formLayout}
              multiStep={formMultiStep}
              confirmSubmit={confirmSubmit}
              validation={formValidation}
              onSuccess={crud.handleFormSuccess}
              onError={crud.handleFormError}
            />
          )}
        </div>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <FormConfirmModal
        isOpen={crud.isDeleteOpen}
        onConfirm={crud.handleConfirmDelete}
        onCancel={crud.handleCancelDelete}
        config={{
          title: deleteTitle,
          message: getDeleteMessage(),
          confirmText: crud.deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Modal Notificación */}
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
    </>
  );
}

export default CrudFormsManager;
