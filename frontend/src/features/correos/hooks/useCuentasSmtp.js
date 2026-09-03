import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableData } from '@/shared/components/crud';
import { cuentasSmtpService } from '@/features/correos/services/cuentasSmtpService';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/cuentas-smtp/tableConfig';

/**
 * useCuentasSmtp — lógica de la página de cuentas SMTP.
 * No usa useCrudForms estándar porque maneja un service custom
 * (cuentasSmtpService) y un form custom (CuentasSmtpForm).
 */
export function useCuentasSmtp() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_CUENTA) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: null, title: '', message: '' });

  const showNotification = useCallback((type, title, message) => {
    setNotification({ isOpen: true, type, title, message });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedRecord(null);
    setIsCreateOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    setSelectedRecord(row);
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback((row) => {
    setRowToDelete(row);
    setIsDeleteOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setRowToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [rowToDelete, refresh, showNotification]);

  const handleSuccess = useCallback(async () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setSelectedRecord(null);
    await refresh();
    showNotification('success', 'Operación Exitosa', 'La cuenta SMTP ha sido guardada correctamente.');
  }, [refresh, showNotification]);

  const handleError = useCallback((err) => {
    // El error ya se muestra dentro del formulario
  }, []);

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs({ handleEdit, handleDelete }),
    [handleEdit, handleDelete]
  );

  return {
    records,
    tableRecords,
    loading,
    error,
    refresh,
    handleSaveSuccess,
    // Modales
    isCreateOpen,
    isEditOpen,
    selectedRecord,
    isDeleteOpen,
    rowToDelete,
    deleteLoading,
    notification,
    // Setters para cerrar modales desde el view
    setIsCreateOpen,
    setIsEditOpen,
    setSelectedRecord,
    // Handlers
    handleCreate,
    handleEdit,
    handleDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleSuccess,
    handleError,
    showNotification,
    closeNotification,
    // Table
    tableLevelConfigs
  };
}
