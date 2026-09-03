import { useState, useEffect, useCallback } from 'react';
import { useTableData } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/convocatorias/requisitos/preguntas/config/tableConfig.jsx';
import {
  updatePregunta,
  swapOrdenPreguntas
} from '@/features/convocatorias/requisitos/preguntas/services/convocatoriaPreguntasService';
import { db } from '@/shared/api';

/**
 * useConvocatoriaPreguntas — lógica de la página de Preguntas Docentes.
 * CRUD simple (sin archivos).
 */
export function useConvocatoriaPreguntas() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState([]);

  const sortRecords = useCallback((data) => {
    return [...(data || [])].sort((a, b) => {
      const cond = String(a.CONDICION_LABORAL || '').localeCompare(String(b.CONDICION_LABORAL || ''));
      if (cond !== 0) return cond;
      const ordA = Number(a.ORDEN ?? 0);
      const ordB = Number(b.ORDEN ?? 0);
      if (ordA !== ordB) return ordA - ordB;
      return String(a.NOMBRE || '').localeCompare(String(b.NOMBRE || ''));
    });
  }, []);

  useEffect(() => {
    setTableRecords(sortRecords(records));
  }, [records, sortRecords]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev => {
      const updated = prev.map(row =>
        String(row.ID_PREGUNTA) === String(recordId) ? { ...row, [field]: newValue } : row
      );
      return sortRecords(updated);
    });
  }, [sortRecords]);

  // ===== Modales =====
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [condicionesPreseleccionadas, setCondicionesPreseleccionadas] = useState([]);

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
    setCondicionesPreseleccionadas([]);
    setIsCreateFormOpen(true);
  };

  const handleAddPregunta = (row) => {
    setCondicionesPreseleccionadas([row.CONDICION_LABORAL]);
    setIsCreateFormOpen(true);
  };

  const handleCreateCancel = () => {
    setIsCreateFormOpen(false);
    setCondicionesPreseleccionadas([]);
  };

  const handleCreateSuccess = async () => {
    setIsCreateFormOpen(false);
    setCondicionesPreseleccionadas([]);
    await refresh();
    showNotification('success', 'Operación Exitosa', 'La pregunta ha sido creada correctamente.');
  };

  const handleDelete = (row) => {
    setRowToDelete(row);
    setIsDeleteOpen(true);
  };

  // ===== Edición inline (estilo Google Forms) =====
  // Guarda cambios de una pregunta editada inline desde PreguntaCard.
  // Recibe el record original y el payload ya construido por PreguntaEditForm.
  const [inlineSaving, setInlineSaving] = useState(false);

  const handleSaveInline = useCallback(async (originalRecord, payload) => {
    setInlineSaving(true);
    try {
      // updatePregunta(id, data, formData, originalRecord)
      // formData = payload (ya tiene restricciones aplicadas por buildPayloadConRestricciones)
      await updatePregunta(originalRecord.ID_PREGUNTA, payload, payload, originalRecord);
      await refresh();
      showNotification('success', 'Operación Exitosa', 'La pregunta ha sido guardada correctamente.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al guardar la pregunta.');
      throw err; // re-lanzar para que PreguntaEditForm muestre el error inline
    } finally {
      setInlineSaving(false);
    }
  }, [refresh]);

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setRowToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleteLoading(true);
    try {
      await db.delete('CONVOCATORIA_PREGUNTAS', rowToDelete.ID_PREGUNTA, 'ID_PREGUNTA');
      await refresh();
      setIsDeleteOpen(false);
      setRowToDelete(null);
      showNotification('success', 'Operación Exitosa', 'La pregunta ha sido eliminada.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al eliminar la pregunta.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tableLevelConfigs = getTableLevelConfigs({ handleEdit: () => {}, handleDelete, handleAddPregunta });

  // ===== Reordenamiento con flechas =====
  // Mueve una pregunta arriba o abajo dentro de su misma condición laboral.
  // Intercambia el ORDEN con la pregunta adyacente usando swap de 3 pasos.
  const handleMovePregunta = useCallback(async (pregunta, direccion) => {
    if (!pregunta?.ID_PREGUNTA) return;
    const condicion = pregunta.CONDICION_LABORAL;
    // Filtrar por misma condición y ordenar por ORDEN
    const mismaCondicion = (tableRecords || [])
      .filter(p => p.CONDICION_LABORAL === condicion)
      .sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
    const idx = mismaCondicion.findIndex(p => p.ID_PREGUNTA === pregunta.ID_PREGUNTA);
    if (idx < 0) return;
    const targetIdx = direccion === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= mismaCondicion.length) return;
    const adyacente = mismaCondicion[targetIdx];
    try {
      await swapOrdenPreguntas(pregunta, adyacente);
      await refresh();
    } catch (err) {
      showNotification('error', 'Error', err.message || 'No se pudo reordenar la pregunta.');
    }
  }, [tableRecords, refresh]);

  return {
    // Data
    tableRecords,
    loading,
    error,
    handleSaveSuccess,
    tableLevelConfigs,
    // Create
    isCreateFormOpen,
    condicionesPreseleccionadas,
    handleCreate,
    handleAddPregunta,
    handleCreateSuccess,
    handleCreateCancel,
    // Row actions (para cards)
    handleDelete,
    handleMovePregunta,
    // Edit inline
    handleSaveInline,
    inlineSaving,
    // Delete
    isDeleteOpen,
    rowToDelete,
    deleteLoading,
    handleCancelDelete,
    handleConfirmDelete,
    // Notification
    notification,
    closeNotification
  };
}
