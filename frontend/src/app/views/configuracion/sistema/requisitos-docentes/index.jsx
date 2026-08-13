import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableData } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { CrudHeader } from '@/shared/components/crud';
import { ConfigLayout } from '@/features/layout';
import { Modal } from '@/shared/components/modal';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import { CrudForm } from '@/shared/components/form';
import { tableConfig, getTableLevelConfigs } from '@/features/requisitos_docentes/config/tableConfig';
import { requisitosFormFields, requisitosMultiStep, requisitosValidation, requisitosModalConfig } from '@/features/requisitos_docentes/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/requisitos_docentes/config/headerConfig';
import { createRequisito, updateRequisito, getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';
import { db } from '@/shared/api';

/**
 * Configuración de REQUISITOS_DOCENTES
 * Biblioteca de documentos/plantillas con TableMultiLevelEditable (ACTIVO editable inline).
 */
function RequisitosDocentesConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState([]);

  // Ordenar por CONDICION_LABORAL, CLASIFICACION, NOMBRE
  const sortRecords = useCallback((data) => {
    return [...(data || [])].sort((a, b) => {
      const cond = String(a.CONDICION_LABORAL || '').localeCompare(String(b.CONDICION_LABORAL || ''));
      if (cond !== 0) return cond;
      const clas = String(a.CLASIFICACION || '').localeCompare(String(b.CLASIFICACION || ''));
      if (clas !== 0) return clas;
      return String(a.NOMBRE || '').localeCompare(String(b.NOMBRE || ''));
    });
  }, []);

  useEffect(() => {
    setTableRecords(sortRecords(records));
  }, [records, sortRecords]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev => {
      const updated = prev.map(row =>
        String(row.ID_REQUISITO) === String(recordId) ? { ...row, [field]: newValue } : row
      );
      return sortRecords(updated);
    });
  }, [sortRecords]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editInitialValues, setEditInitialValues] = useState({});
  const [selectedCondicionLaboral, setSelectedCondicionLaboral] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, type: null, title: '', message: '' });

  const showNotification = (type, title, message) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
  };

  const handleCreate = () => {
    setSelectedCondicionLaboral(null);
    setSelectedRecord(null);
    setIsCreateOpen(true);
  };

  const handleAddRequisito = (row) => {
    setSelectedCondicionLaboral(row.CONDICION_LABORAL);
    setSelectedRecord(null);
    setIsCreateOpen(true);
  };

  const handleEdit = async (row) => {
    const fileInitial = {};
    if (row.STORAGE_PATH) {
      try {
        const url = await getRequisitoUrl(row.STORAGE_PATH);
        fileInitial.ARCHIVO = {
          name: row.FILENAME || row.STORAGE_PATH.split('/').pop(),
          type: row.CONTENT_TYPE || '',
          size: row.TAMAÑO_BYTES || 0,
          url
        };
      } catch (err) {
        console.error('Error obteniendo URL del archivo:', err);
      }
    }

    setEditInitialValues(fileInitial);
    setSelectedRecord(row);
    setIsEditOpen(true);
  };

  const handleDelete = (row) => {
    setRowToDelete(row);
    setIsDeleteOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setRowToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleteLoading(true);
    try {
      await db.delete('REQUISITOS_DOCENTES', rowToDelete.ID_REQUISITO, 'ID_REQUISITO');
      await refresh();
      setIsDeleteOpen(false);
      setRowToDelete(null);
      showNotification('success', 'Operación Exitosa', 'El requisito ha sido eliminado.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al eliminar el requisito.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setSelectedRecord(null);
    await refresh();
    showNotification('success', 'Operación Exitosa', 'El requisito ha sido guardado correctamente.');
  };

  const handleError = (err) => {
    // El error ya se muestra dentro del formulario
  };

  const tableLevelConfigs = getTableLevelConfigs({ handleEdit, handleDelete, handleAddRequisito });

  // Form dinámico: si se crea desde un grupo, CONDICION_LABORAL viene pre-seleccionada y bloqueada
  const dynamicFormFields = useMemo(() => {
    if (!selectedCondicionLaboral) return requisitosFormFields;
    return requisitosFormFields.map(field => {
      if (field.name === 'CONDICION_LABORAL') {
        return {
          ...field,
          defaultValue: selectedCondicionLaboral,
          disabled: true
        };
      }
      return field;
    });
  }, [selectedCondicionLaboral]);

  return (
    <ConfigLayout>
      <div className="px-8 py-8 space-y-8 pb-12">
        <CrudHeader
          headerTitle={headerProps.headerTitle}
          headerDescription={headerProps.headerDescription}
          actions={getHeaderActions({ handleCreate })}
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
              levelConfigs={tableLevelConfigs}
              saveMode="auto"
              externalLoading={loading}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedCondicionLaboral(null);
        }}
        title={requisitosModalConfig.createTitle}
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          <CrudForm
            key={`create-requisitos-${selectedCondicionLaboral || 'global'}`}
            tableName="REQUISITOS_DOCENTES"
            mode="create"
            fields={dynamicFormFields}
            primaryKey="ID_REQUISITO"
            multiStep={requisitosMultiStep}
            confirmSubmit
            validation={requisitosValidation}
            createFunction={createRequisito}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRecord(null);
          setEditInitialValues({});
        }}
        title={requisitosModalConfig.editTitle}
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {selectedRecord && (
            <CrudForm
              key={`edit-requisitos-${selectedRecord.ID_REQUISITO}`}
              tableName="REQUISITOS_DOCENTES"
              mode="edit"
              recordId={selectedRecord.ID_REQUISITO}
              fields={requisitosFormFields}
              primaryKey="ID_REQUISITO"
              multiStep={requisitosMultiStep}
              confirmSubmit
              validation={requisitosValidation}
              editFunction={(data, id, formData) => updateRequisito(id, data, formData, selectedRecord)}
              initialFormValues={editInitialValues}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <FormConfirmModal
        isOpen={isDeleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        config={{
          title: requisitosModalConfig.deleteTitle,
          message: rowToDelete ? requisitosModalConfig.deleteMessage(rowToDelete) : '¿Estás seguro?',
          confirmText: deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Notificación */}
      <Modal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        closeOnOutsideClick={true}
        closeOnEscapeKey={true}
      >
        <div className="text-center py-4 px-6">
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
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
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
    </ConfigLayout>
  );
}

export default RequisitosDocentesConfig;
