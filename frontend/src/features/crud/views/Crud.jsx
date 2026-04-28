import React, { useState } from 'react';
import CrudLayout from './CrudLayout';
import { Modal } from '@/features/modal';
import { CrudForm } from '@/features/form';
import FormConfirmModal from '@/features/form/components/FormConfirmModal';
import crudService from '@/shared/services/crudService';
import cacheService from '@/shared/services/cacheService';

/**
 * Crud - Componente CRUD completo y reutilizable
 * Incluye: tabla, modales de crear/editar, formularios, refresh automático
 * 
 * @param {Object} tableConfig - { tableName, headers, boundColumn }
 * @param {Object} formConfig - { tableName, primaryKey, fields, layout, multiStep }
 * @param {Object} tableComponentParameters - Props para Table (sortable, filterable, etc.)
 * @param {Object} modalConfig - Configuración de modales (opcional)
 * @param {Object} actions - Acciones personalizadas (opcional)
 * @param {function} onSuccess - Callback de éxito (opcional)
 * @param {function} onError - Callback de error (opcional)
 */
function Crud({
  tableConfig = {},
  formConfig = {},
  tableComponentParameters = {},
  modalConfig = {},
  actions = {},
  headerProps = {},
  footerProps = {},
  menuFilters = null,  // ← NUEVO: Configuración de filtros dinámicos
  onSuccess,
  onError
}) {
  const {
    tableName: crudTableName,
    headers: headersTable,
    boundColumn = 'ID'
  } = tableConfig;
  
  const {
    tableName: formTableName = crudTableName,
    primaryKey = 'ID',
    fields: formFields,
    layout: formLayout = null,
    multiStep: multiStepConfig = {
      showDots: true,
      persistData: false,
      nextText: 'Siguiente',
      prevText: 'Atrás',
      submitText: 'Guardar Registro'
    },
    confirmSubmit = false,
    confirmConfig = {},
    validation
  } = formConfig;
  
  const {
    createTitle = 'Crear Nuevo Registro',
    editTitle = 'Editar Registro',
    size = 'md',
    widthClass
  } = modalConfig;

  // Estados de modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState({
    isOpen: false,
    type: null, // 'success' | 'error'
    title: '',
    message: ''
  });

  // Handlers de acciones
  const handleCreate = () => setIsCreateModalOpen(true);
  
  const handleEdit = (row, rowIndex) => {
    console.log('[Crud] handleEdit called:', { row, rowIndex, primaryKey, recordId: row[primaryKey] });
    setSelectedRow({ row, rowIndex });
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (row, rowIndex) => {
    setRowToDelete({ row, rowIndex });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;

    const recordId = rowToDelete.row[boundColumn];
    setDeleteLoading(true);

    try {
      // ← CAMBIO: Usar formTableName (tabla real) en lugar de crudTableName (vista)
      // para operaciones de eliminación
      const deleteTableName = formTableName || crudTableName;
      await crudService.deleteRecord(deleteTableName, recordId);
      // crudService ya invalida el cache (cacheService.invalidateAll)

      setRefreshTrigger(prev => prev + 1);
      
      // Mostrar notificación de éxito
      showNotification(
        'success',
        'Operación Exitosa',
        'El registro ha sido eliminado exitosamente.'
      );
      
      onSuccess?.({ action: 'delete', recordId });
    } catch (error) {
      console.error('Error eliminando registro:', error);
      
      // Mostrar notificación de error
      showNotification(
        'error',
        'Error',
        error.message || 'Ocurrió un error al eliminar el registro.'
      );
      
      onError?.(error);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setRowToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRowToDelete(null);
  };
  
  const handleCloseCreate = () => setIsCreateModalOpen(false);
  
  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };
  
  // Función para mostrar notificación
  const showNotification = (type, title, message) => {
    setNotification({ isOpen: true, type, title, message });
  };
  
  // Función para cerrar notificación
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleFormSuccess = (result) => {
    // Mostrar notificación de éxito primero
    showNotification(
      'success',
      'Operación Exitosa',
      isCreateModalOpen 
        ? 'El registro ha sido creado exitosamente.'
        : 'El registro ha sido actualizado exitosamente.'
    );
    
    // Luego cerrar el modal del formulario
    if (isCreateModalOpen) handleCloseCreate();
    else if (isEditModalOpen) handleCloseEdit();
    
    setRefreshTrigger(prev => prev + 1);
    onSuccess?.(result);
  };
  
  const handleFormError = (error) => {
    // Mostrar notificación de error
    showNotification(
      'error',
      'Error',
      error.message || 'Ocurrió un error al procesar la solicitud.'
    );
    
    onError?.(error);
  };

  // Acciones por defecto
  const defaultActions = {
    create: {
      enabled: true,
      label: 'Nuevo',
      icon: 'plus',
      className: 'bg-green-600 text-white',
      onClick: handleCreate
    },
    edit: {
      enabled: true,
      label: 'Editar',
      icon: 'edit',
      className: 'text-blue-600 hover:bg-blue-100',
      onClick: handleEdit
    },
    delete: {
      enabled: true,
      label: 'Eliminar',
      icon: 'trash',
      className: 'text-red-600 hover:bg-red-100',
      onClick: handleDelete
    },
    custom: []
  };
  
  const mergedActions = { ...defaultActions, ...actions };

  return (
    <>
      <CrudLayout 
        tableName={crudTableName}
        headers={headersTable}
        tableActions={mergedActions}
        boundColumn={boundColumn}
        refreshTrigger={refreshTrigger}
        tableComponentParameters={tableComponentParameters}
        headerProps={headerProps}
        footerProps={footerProps}
        menuFilters={menuFilters}  // ← PASAR a CrudLayout
      />

      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreate} title={createTitle} size={size} widthClass={widthClass} closeOnOutsideClick={false}>
        <div className="p-6">
          <CrudForm
            tableName={formTableName}
            mode="create"
            fields={formFields}
            primaryKey={primaryKey}
            layout={formLayout}
            multiStep={multiStepConfig}
            confirmSubmit={confirmSubmit}
            confirmConfig={confirmConfig}
            validation={validation}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
          />
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEdit} title={editTitle} size={size} widthClass={widthClass} closeOnOutsideClick={false}>
        <div className="p-6">
          {selectedRow && (
            <CrudForm
              key={`edit-form-${selectedRow.row[primaryKey]}`}
              tableName={formTableName}
              mode="edit"
              recordId={selectedRow.row[primaryKey]}
              fields={formFields}
              primaryKey={primaryKey}
              layout={formLayout}
              multiStep={multiStepConfig}
              confirmSubmit={confirmSubmit}
              confirmConfig={confirmConfig}
              validation={validation}
              onSuccess={handleFormSuccess}
              onError={handleFormError}
            />
          )}
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <FormConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        config={{
          title: '¿Eliminar registro?',
          message: rowToDelete 
            ? `¿Estás seguro de que deseas eliminar el registro con ${boundColumn}: ${rowToDelete.row[boundColumn]}?`
            : '¿Estás seguro de que deseas eliminar este registro?',
          confirmText: deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Modal de notificación */}
      <Modal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        size="sm"
        closeOnOutsideClick={true}
        closeOnEscapeKey={true}
      >
        <div className="text-center py-4 px-6">
          {/* Ícono según tipo */}
          {notification.type === 'success' ? (
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
          
          {/* Mensaje */}
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
          
          {/* Botón cerrar */}
          <button
            onClick={closeNotification}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${notification.type === 'success' 
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

export default Crud;
