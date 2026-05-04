import { useState, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Hook para manejar edición inline batch en EditableTable
 * @param {Object} config
 * @param {Array}  config.data        - Registros originales
 * @param {string} config.primaryKey  - Campo PK de cada fila
 * @param {string} config.tableName   - Tabla destino del updateBatch
 * @param {Function} config.onRefresh - Callback tras guardar exitosamente
 */
export function useEditableTable({ data, primaryKey, tableName, onRefresh }) {
  // Map<rowId, { field: newValue }> — solo filas con cambios
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: null, message: '' });

  const isDirty = pendingChanges.size > 0;

  /**
   * Retorna el valor actual de una celda:
   * si hay cambio pendiente para esa fila+campo, devuelve el pendiente; si no, el original.
   */
  const getCellValue = useCallback((row, field) => {
    const rowId = row[primaryKey];
    const pending = pendingChanges.get(rowId);
    if (pending && Object.prototype.hasOwnProperty.call(pending, field)) {
      return pending[field];
    }
    return row[field];
  }, [pendingChanges, primaryKey]);

  /**
   * Registra un cambio en una celda
   */
  const handleCellChange = useCallback((rowId, field, value) => {
    setPendingChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(rowId) || {};
      next.set(rowId, { ...existing, [field]: value });
      return next;
    });
  }, []);

  /**
   * Descarta todos los cambios pendientes
   */
  const cancelAll = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  /**
   * Guarda todos los cambios usando db.updateBatch
   */
  const saveAll = useCallback(async () => {
    if (!isDirty || isSaving) return;

    const updates = [...pendingChanges.entries()].map(([id, fields]) => ({
      id,
      data: fields
    }));

    setIsSaving(true);
    try {
      await db.updateBatch(tableName, updates, primaryKey);
      cacheService.invalidateAll();
      setPendingChanges(new Map());
      setNotification({ isOpen: true, type: 'success', message: 'Cambios guardados exitosamente.' });
      onRefresh?.();
    } catch (err) {
      console.error('[useEditableTable] Error en updateBatch:', err);
      setNotification({ isOpen: true, type: 'error', message: err.message || 'Error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, pendingChanges, tableName, primaryKey, onRefresh]);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Retorna la fila completa con cambios pendientes aplicados (para formData de selects dinámicos)
   */
  const getMergedRow = useCallback((row) => {
    const rowId = row[primaryKey];
    const pending = pendingChanges.get(rowId);
    if (!pending) return row;
    return { ...row, ...pending };
  }, [pendingChanges, primaryKey]);

  /**
   * Número de filas con cambios pendientes
   */
  const dirtyCount = useMemo(() => pendingChanges.size, [pendingChanges]);

  return {
    pendingChanges,
    isDirty,
    isSaving,
    dirtyCount,
    notification,
    getCellValue,
    getMergedRow,
    handleCellChange,
    cancelAll,
    saveAll,
    closeNotification
  };
}
