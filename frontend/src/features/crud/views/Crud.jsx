import React, { useState } from 'react';
import CrudLayout from './CrudLayout';
import { Modal } from '@/features/modal';
import { CrudForm } from '@/features/form';

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
    }
  } = formConfig;
  
  const {
    createTitle = 'Crear Nuevo Registro',
    editTitle = 'Editar Registro',
    size = 'large'
  } = modalConfig;

  // Estados de modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handlers de acciones
  const handleCreate = () => setIsCreateModalOpen(true);
  
  const handleEdit = (row, rowIndex) => {
    setSelectedRow({ row, rowIndex });
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (row, rowIndex) => {
    const recordId = row[boundColumn];
    alert(`Se elimina el registro con "${boundColumn}": ${recordId}`);
  };
  
  const handleCloseCreate = () => setIsCreateModalOpen(false);
  
  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };
  
  const handleFormSuccess = (result) => {
    if (isCreateModalOpen) handleCloseCreate();
    else if (isEditModalOpen) handleCloseEdit();
    
    setRefreshTrigger(prev => prev + 1);
    onSuccess?.(result);
  };
  
  const handleFormError = (error) => {
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
      />

      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreate} title={createTitle} size={size}>
        <div className="p-6">
          <CrudForm
            tableName={formTableName}
            mode="create"
            fields={formFields}
            primaryKey={primaryKey}
            layout={formLayout}
            multiStep={multiStepConfig}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
          />
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEdit} title={editTitle} size={size}>
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
              onSuccess={handleFormSuccess}
              onError={handleFormError}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

export default Crud;
