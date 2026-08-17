import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableData } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/requisitos_docentes/config/tableConfig';
import {
  requisitosFormFields,
  requisitosMultiStep,
  requisitosValidation,
  requisitosModalConfig
} from '@/features/requisitos_docentes/config/formConfig';
import {
  createRequisito,
  updateRequisito
} from '@/features/requisitos_docentes/services/requisitosDocentesService';
import { db } from '@/shared/api';

/**
 * useRequisitosDocentes — lógica de la página de Requisitos Docentes.
 * CRUD manual con custom create/edit functions (file handling).
 */
export function useRequisitosDocentes() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState([]);

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

  // ===== Modales =====
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
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

  // ===== Handlers =====
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

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setSelectedCondicionLaboral(null);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  const tableLevelConfigs = getTableLevelConfigs({ handleEdit, handleDelete, handleAddRequisito });

  const dynamicFormFields = useMemo(() => {
    if (!selectedCondicionLaboral) return requisitosFormFields;
    return requisitosFormFields.map(field => {
      if (field.name === 'CONDICION_LABORAL') {
        return { ...field, defaultValue: selectedCondicionLaboral, disabled: true };
      }
      return field;
    });
  }, [selectedCondicionLaboral]);

  const editFunctionWrapper = (data, id, formData) =>
    updateRequisito(id, data, formData, selectedRecord);

  return {
    // Data
    tableRecords,
    loading,
    error,
    handleSaveSuccess,
    tableLevelConfigs,
    // Create
    isCreateOpen,
    dynamicFormFields,
    handleCloseCreate,
    handleCreate,
    handleSuccess,
    handleError,
    // Edit
    isEditOpen,
    selectedRecord,
    editFunctionWrapper,
    handleCloseEdit,
    // Delete
    isDeleteOpen,
    rowToDelete,
    deleteLoading,
    handleCancelDelete,
    handleConfirmDelete,
    // Notification
    notification,
    closeNotification,
    // Config
    requisitosFormFields,
    requisitosMultiStep,
    requisitosValidation,
    requisitosModalConfig,
    createRequisito
  };
}
