import React, { useState, useEffect, useCallback } from 'react';
import { useTableData } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { CrudHeader } from '@/shared/components/crud';
import { ConfigLayout } from '@/features/layout';
import { Modal } from '@/shared/components/modal';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import CuentasSmtpForm from '@/features/correos/components/CuentasSmtpForm';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/cuentas-smtp/tableConfig';
import { headerProps, getHeaderActions } from '@/features/correos/config/cuentas-smtp/headerConfig';
import { cuentasSmtpService } from '@/features/correos/services/cuentasSmtpService';

function CuentasSmtpConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_CUENTA) === String(recordId) ? { ...row, [field]: newValue } : row)
    );
  }, []);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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
    setSelectedRecord(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (row) => {
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
      await cuentasSmtpService.remove(rowToDelete.ID_CUENTA);
      await refresh();
      setIsDeleteOpen(false);
      setRowToDelete(null);
      showNotification('success', 'Operación Exitosa', 'La cuenta SMTP ha sido eliminada.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al eliminar la cuenta.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setSelectedRecord(null);
    await refresh();
    showNotification('success', 'Operación Exitosa', 'La cuenta SMTP ha sido guardada correctamente.');
  };

  const handleError = (err) => {
    // El error ya se muestra dentro del formulario; aquí se puede dejar para futuras extensiones
  };

  const tableLevelConfigs = getTableLevelConfigs({ handleEdit, handleDelete });

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

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Cuenta SMTP"
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          <CuentasSmtpForm mode="create" onSuccess={handleSuccess} onError={handleError} />
        </div>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRecord(null);
        }}
        title="Editar Cuenta SMTP"
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {selectedRecord && (
            <CuentasSmtpForm
              key={selectedRecord.ID_CUENTA}
              mode="edit"
              record={selectedRecord}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>
      </Modal>

      <FormConfirmModal
        isOpen={isDeleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        config={{
          title: '¿Eliminar cuenta SMTP?',
          message: rowToDelete ? `¿Estás seguro de que deseas eliminar la cuenta "${rowToDelete.NOMBRE_CUENTA}"?` : '¿Eliminar esta cuenta SMTP?',
          confirmText: deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      <Modal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        closeOnOutsideClick={true}
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

export default CuentasSmtpConfig;
