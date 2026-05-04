import { useState, useCallback } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Hook reutilizable para manejar estados y lógica de modales CRUD
 * (crear, editar, eliminar, notificaciones)
 * @param {Object} config
 * @param {string} config.tableName - Nombre de la tabla para delete
 * @param {string} config.primaryKey - Nombre del campo PK
 * @param {Function} config.onSuccess - Callback tras éxito
 * @param {Function} config.onError - Callback tras error
 * @param {Function} config.onRefresh - Callback para refrescar tabla externa
 * @returns {Object} Estados y handlers para usar con CrudFormsManager o manualmente
 */
export function useCrudForms({
  tableName,
  primaryKey = 'ID',
  onSuccess,
  onError,
  onRefresh
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: null,
    title: '',
    message: ''
  });

  const showNotification = useCallback((type, title, message) => {
    setNotification({ isOpen: true, type, title, message });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const handleEdit = useCallback((row) => {
    setSelectedRow(row);
    setIsEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditOpen(false);
    setSelectedRow(null);
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
    if (!rowToDelete || !tableName || !primaryKey) return;

    setDeleteLoading(true);
    try {
      const recordId = rowToDelete[primaryKey];
      await db.delete(tableName, recordId, primaryKey);
      cacheService.invalidateAll();
      setIsDeleteOpen(false);
      setRowToDelete(null);
      setRefreshTrigger(prev => prev + 1);
      onRefresh?.();
      showNotification('success', 'Operación Exitosa', 'El registro ha sido eliminado exitosamente.');
      onSuccess?.({ action: 'delete', recordId });
    } catch (error) {
      console.error('Error eliminando registro:', error);
      showNotification('error', 'Error', error.message || 'Ocurrió un error al eliminar el registro.');
      onError?.(error);
    } finally {
      setDeleteLoading(false);
    }
  }, [rowToDelete, tableName, primaryKey, onRefresh, onSuccess, onError, showNotification]);

  const handleFormSuccess = useCallback((result) => {
    const wasCreate = isCreateOpen;
    if (wasCreate) setIsCreateOpen(false);
    else if (isEditOpen) {
      setIsEditOpen(false);
      setSelectedRow(null);
    }
    setRefreshTrigger(prev => prev + 1);
    onRefresh?.();
    showNotification(
      'success',
      'Operación Exitosa',
      wasCreate ? 'El registro ha sido creado exitosamente.' : 'El registro ha sido actualizado exitosamente.'
    );
    onSuccess?.(result);
  }, [isCreateOpen, isEditOpen, onRefresh, onSuccess, showNotification]);

  const handleFormError = useCallback((error) => {
    showNotification('error', 'Error', error.message || 'Ocurrió un error al procesar la solicitud.');
    onError?.(error);
  }, [onError, showNotification]);

  return {
    // Modal states
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedRow,
    rowToDelete,
    deleteLoading,
    refreshTrigger,
    notification,

    // Actions
    handleCreate,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseCreate,
    handleCloseEdit,
    handleFormSuccess,
    handleFormError,
    showNotification,
    closeNotification
  };
}
