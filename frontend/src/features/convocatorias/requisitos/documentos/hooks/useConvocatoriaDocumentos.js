import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTableLevelConfigs } from '@/features/convocatorias/requisitos/documentos/config/tableConfig.jsx';
import {
  documentosFormFields,
  documentosMultiStep,
  documentosValidation,
  documentosModalConfig
} from '@/features/convocatorias/requisitos/documentos/config/formConfig';
import {
  updateDocumento,
  swapOrdenDocumentos
} from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';
import { db } from '@/shared/api';

/**
 * useConvocatoriaDocumentos — lógica de la página de Documentos Docentes.
 * Lazy loading: level 1 carga clasificaciones, level 2 carga documentos al expandir.
 *
 * @param {string} activeCondicion - Condición laboral activa ('CONTRATADO' | 'EXTERNO' | 'ORDINARIO')
 */
export function useConvocatoriaDocumentos(activeCondicion) {
  // ===== Level 1: Clasificaciones =====
  const [clasificacionesData, setClasificacionesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clasificaciones para el form de crear documento (todas, sin filtrar por condición)
  const [clasificacionesRecords, setClasificacionesRecords] = useState([]);

  // ===== Level 2: Lazy loading de documentos =====
  const [childrenData, setChildrenData] = useState({});
  const [childrenLoading, setChildrenLoading] = useState({});

  const sortClasificaciones = useCallback((data) => {
    return [...(data || [])].sort((a, b) => {
      const cond = String(a.CONDICION_LABORAL || '').localeCompare(String(b.CONDICION_LABORAL || ''));
      if (cond !== 0) return cond;
      return String(a.NOMBRE || '').localeCompare(String(b.NOMBRE || ''));
    });
  }, []);

  // Cargar clasificaciones filtradas por condición activa
  const refreshClasificaciones = useCallback(async () => {
    if (!activeCondicion) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION', { CONDICION_LABORAL: activeCondicion });
      setClasificacionesData(sortClasificaciones(data || []));
    } catch (err) {
      console.error('[useConvocatoriaDocumentos] Error al cargar clasificaciones:', err);
      setError(err);
      setClasificacionesData([]);
    } finally {
      setLoading(false);
    }
  }, [activeCondicion, sortClasificaciones]);

  // Cargar todas las clasificaciones (para el form de crear documento — sin filtro de condición)
  const refreshAllClasificaciones = useCallback(async () => {
    try {
      const data = await db.select('VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION');
      setClasificacionesRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useConvocatoriaDocumentos] Error al cargar todas las clasificaciones:', err);
      setClasificacionesRecords([]);
    }
  }, []);

  useEffect(() => {
    refreshClasificaciones();
  }, [refreshClasificaciones]);

  useEffect(() => {
    refreshAllClasificaciones();
  }, [refreshAllClasificaciones]);

  // Limpiar children al cambiar de condición
  useEffect(() => {
    setChildrenData({});
    setChildrenLoading({});
  }, [activeCondicion]);

  // ===== onExpand: cargar documentos de una clasificación =====
  const onExpand = useCallback(async (level, parentValue) => {
    // level 1 = expandir clasificación → cargar documentos
    if (level !== 1 || !parentValue) return;
    const cacheKey = `1-${parentValue}`;

    // Si ya está en cache, no recargar
    if (childrenData[cacheKey]) return;

    setChildrenLoading(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const data = await db.select('VW_CONVOCATORIA_DOCUMENTOS', { ID_CLASIFICACION: parentValue });
      const sorted = [...(data || [])].sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
      setChildrenData(prev => ({ ...prev, [cacheKey]: sorted }));
    } catch (err) {
      console.error('[useConvocatoriaDocumentos] Error al cargar documentos:', err);
      setChildrenData(prev => ({ ...prev, [cacheKey]: [] }));
    } finally {
      setChildrenLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [childrenData]);

  // Refrescar children de una clasificación específica
  const refreshChildren = useCallback(async (idClasificacion) => {
    if (!idClasificacion) return;
    const cacheKey = `1-${idClasificacion}`;
    setChildrenLoading(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const data = await db.select('VW_CONVOCATORIA_DOCUMENTOS', { ID_CLASIFICACION: idClasificacion });
      const sorted = [...(data || [])].sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
      setChildrenData(prev => ({ ...prev, [cacheKey]: sorted }));
    } catch (err) {
      console.error('[useConvocatoriaDocumentos] Error al refrescar documentos:', err);
    } finally {
      setChildrenLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  // ===== handleSaveSuccess (inline edit) =====
  // (recordId, field, newValue, primaryKey, rowData, header)
  const handleSaveSuccess = useCallback((recordId, field, newValue, primaryKey) => {
    // Level 1 (clasificación): primaryKey === 'ID_CLASIFICACION'
    if (primaryKey === 'ID_CLASIFICACION') {
      setClasificacionesData(prev =>
        prev.map(row => String(row.ID_CLASIFICACION) === String(recordId) ? { ...row, [field]: newValue } : row)
      );
      // Si se cambió el NOMBRE, refrescar clasificaciones para reordenar
      if (field === 'NOMBRE') {
        refreshClasificaciones();
      }
      return;
    }
    // Level 2 (documento): primaryKey === 'ID_DOCUMENTO'
    // Refrescar children de la clasificación a la que pertenece el documento
    // Buscar en childrenData qué clasificación tiene este documento
    setChildrenData(prev => {
      const next = { ...prev };
      for (const [key, docs] of Object.entries(next)) {
        const updated = docs.map(row =>
          String(row.ID_DOCUMENTO) === String(recordId) ? { ...row, [field]: newValue } : row
        );
        next[key] = updated;
      }
      return next;
    });
  }, [refreshClasificaciones]);

  // ===== Modales =====
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [condicionesPreseleccionadas, setCondicionesPreseleccionadas] = useState([]);

  const [isClasificacionFormOpen, setIsClasificacionFormOpen] = useState(false);
  const [condicionesClasificacionPre, setCondicionesClasificacionPre] = useState([]);

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

  // ===== Handlers Create Documento =====
  const handleCreate = () => {
    setCondicionesPreseleccionadas(activeCondicion ? [activeCondicion] : []);
    setIsCreateFormOpen(true);
  };

  const handleCreateCancel = () => {
    setIsCreateFormOpen(false);
    setCondicionesPreseleccionadas([]);
  };

  const handleCreateSuccess = async () => {
    setIsCreateFormOpen(false);
    setCondicionesPreseleccionadas([]);
    // Refrescar clasificaciones y children de la condición activa
    await refreshClasificaciones();
    await refreshAllClasificaciones();
    // Invalidar todos los children (se recargarán al expandir)
    setChildrenData({});
    showNotification('success', 'Operación Exitosa', 'El documento ha sido creado correctamente.');
  };

  // ===== Handlers Create Clasificación =====
  const handleCreateClasificacion = () => {
    setCondicionesClasificacionPre(activeCondicion ? [activeCondicion] : []);
    setIsClasificacionFormOpen(true);
  };

  const handleCreateClasificacionCancel = () => {
    setIsClasificacionFormOpen(false);
    setCondicionesClasificacionPre([]);
  };

  const handleCreateClasificacionSuccess = async () => {
    setIsClasificacionFormOpen(false);
    setCondicionesClasificacionPre([]);
    await refreshClasificaciones();
    await refreshAllClasificaciones();
    showNotification('success', 'Operación Exitosa', 'La clasificación ha sido creada correctamente.');
  };

  // ===== Handlers Edit =====
  const handleEdit = (row) => {
    setSelectedRecord(row);
    setIsEditOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditOpen(false);
    setSelectedRecord(null);
    // Refrescar children de la clasificación del documento editado
    if (selectedRecord?.ID_CLASIFICACION) {
      await refreshChildren(selectedRecord.ID_CLASIFICACION);
    }
    showNotification('success', 'Operación Exitosa', 'El documento ha sido guardado correctamente.');
  };

  const handleError = (err) => {
    // El error ya se muestra dentro del formulario
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  // ===== Handlers Delete Documento =====
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
      await db.delete('CONVOCATORIA_DOCUMENTOS', rowToDelete.ID_DOCUMENTO, 'ID_DOCUMENTO');
      // Refrescar children de la clasificación
      if (rowToDelete.ID_CLASIFICACION) {
        await refreshChildren(rowToDelete.ID_CLASIFICACION);
      }
      setIsDeleteOpen(false);
      setRowToDelete(null);
      showNotification('success', 'Operación Exitosa', 'El documento ha sido eliminado.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al eliminar el documento.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===== Handlers Delete Clasificación =====
  const [isDeleteClasificacionOpen, setIsDeleteClasificacionOpen] = useState(false);
  const [clasificacionToDelete, setClasificacionToDelete] = useState(null);
  const [deleteClasificacionLoading, setDeleteClasificacionLoading] = useState(false);

  const handleDeleteClasificacion = useCallback((row) => {
    setClasificacionToDelete(row);
    setIsDeleteClasificacionOpen(true);
  }, []);

  const handleCancelDeleteClasificacion = useCallback(() => {
    setIsDeleteClasificacionOpen(false);
    setClasificacionToDelete(null);
  }, []);

  const handleConfirmDeleteClasificacion = useCallback(async () => {
    if (!clasificacionToDelete?.ID_CLASIFICACION) return;
    setDeleteClasificacionLoading(true);
    try {
      await db.delete('CONVOCATORIA_DOCUMENTOS_CLASIFICACION', clasificacionToDelete.ID_CLASIFICACION, 'ID_CLASIFICACION');
      // Limpiar children de esa clasificación
      const cacheKey = `1-${clasificacionToDelete.ID_CLASIFICACION}`;
      setChildrenData(prev => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
      await refreshClasificaciones();
      await refreshAllClasificaciones();
      setIsDeleteClasificacionOpen(false);
      setClasificacionToDelete(null);
      showNotification('success', 'Operación Exitosa', 'La clasificación y sus documentos han sido eliminados.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al eliminar la clasificación.');
    } finally {
      setDeleteClasificacionLoading(false);
    }
  }, [clasificacionToDelete, refreshClasificaciones, refreshAllClasificaciones]);

  // ===== Add documento a clasificación específica (level 1 → modal) =====
  const [isAddDocumentoToClasOpen, setIsAddDocumentoToClasOpen] = useState(false);
  const [clasificacionToAddTo, setClasificacionToAddTo] = useState(null);
  const [addDocumentoLoading, setAddDocumentoLoading] = useState(false);
  const [addDocumentoForm, setAddDocumentoForm] = useState({ NOMBRE: '', DESCRIPCION: '' });

  const handleAddDocumentoToClasificacion = useCallback((row) => {
    setClasificacionToAddTo(row);
    setAddDocumentoForm({ NOMBRE: '', DESCRIPCION: '' });
    setIsAddDocumentoToClasOpen(true);
  }, []);

  const handleCancelAddDocumentoToClasificacion = useCallback(() => {
    setIsAddDocumentoToClasOpen(false);
    setClasificacionToAddTo(null);
    setAddDocumentoForm({ NOMBRE: '', DESCRIPCION: '' });
  }, []);

  const handleAddDocumentoFormChange = useCallback((field, value) => {
    setAddDocumentoForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleConfirmAddDocumentoToClasificacion = useCallback(async () => {
    if (!clasificacionToAddTo?.ID_CLASIFICACION) return;
    if (!addDocumentoForm.NOMBRE?.trim()) return;
    setAddDocumentoLoading(true);
    try {
      // Calcular ORDEN desde la BD
      const existingDocs = await db.select('VW_CONVOCATORIA_DOCUMENTOS', { ID_CLASIFICACION: clasificacionToAddTo.ID_CLASIFICACION });
      const maxOrden = (Array.isArray(existingDocs) ? existingDocs : [])
        .reduce((max, r) => Math.max(max, Number(r.ORDEN ?? 0)), 0);
      const orden = maxOrden + 1;

      const insertResult = await db.insert('CONVOCATORIA_DOCUMENTOS', {
        ID_CLASIFICACION: clasificacionToAddTo.ID_CLASIFICACION,
        NOMBRE: addDocumentoForm.NOMBRE.trim(),
        DESCRIPCION: addDocumentoForm.DESCRIPCION?.trim() || null,
        ORDEN: orden,
        ACTIVO: true
      });
      const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;

      // Refrescar children de esta clasificación
      await refreshChildren(clasificacionToAddTo.ID_CLASIFICACION);

      setIsAddDocumentoToClasOpen(false);
      setClasificacionToAddTo(null);
      setAddDocumentoForm({ NOMBRE: '', DESCRIPCION: '' });
      showNotification('success', 'Operación Exitosa', 'El documento ha sido agregado a la clasificación.');
    } catch (err) {
      showNotification('error', 'Error', err.message || 'Ocurrió un error al agregar el documento.');
    } finally {
      setAddDocumentoLoading(false);
    }
  }, [clasificacionToAddTo, addDocumentoForm, refreshChildren]);

  // ===== Reordenamiento con flechas =====
  // Busca los documentos de una clasificación en childrenData
  const getDocumentosForClasificacion = useCallback((idClasificacion) => {
    const cacheKey = `1-${idClasificacion}`;
    return childrenData[cacheKey] || [];
  }, [childrenData]);

  const handleMoveDocumento = useCallback(async (documento, direccion) => {
    if (!documento?.ID_DOCUMENTO || !documento?.ID_CLASIFICACION) return;
    const mismoGrupo = getDocumentosForClasificacion(documento.ID_CLASIFICACION)
      .sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
    const idx = mismoGrupo.findIndex(d => d.ID_DOCUMENTO === documento.ID_DOCUMENTO);
    if (idx < 0) return;
    const targetIdx = direccion === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= mismoGrupo.length) return;
    const adyacente = mismoGrupo[targetIdx];
    try {
      await swapOrdenDocumentos(documento, adyacente);
      await refreshChildren(documento.ID_CLASIFICACION);
    } catch (err) {
      showNotification('error', 'Error', err.message || 'No se pudo reordenar el documento.');
    }
  }, [getDocumentosForClasificacion, refreshChildren]);

  const handleMoveUp = useCallback((row) => handleMoveDocumento(row, 'up'), [handleMoveDocumento]);
  const handleMoveDown = useCallback((row) => handleMoveDocumento(row, 'down'), [handleMoveDocumento]);

  const tableLevelConfigs = getTableLevelConfigs({
    handleEdit, handleDelete, handleMoveUp, handleMoveDown,
    handleDeleteClasificacion, handleAddDocumentoToClasificacion,
    getDocumentosForClasificacion
  });

  // Campos para el modal de editar documento
  const editFormFields = useMemo(() => {
    return documentosFormFields.map(field => {
      if (field.name === 'CONDICION_LABORAL') {
        return { ...field, defaultValue: selectedRecord?.CONDICION_LABORAL, disabled: true, ignoreField: true };
      }
      if (field.name === 'CLASIFICACION') {
        return { ...field, defaultValue: selectedRecord?.CLASIFICACION, disabled: true, ignoreField: true };
      }
      if (field.name === 'ORDEN') {
        return { ...field, defaultValue: selectedRecord?.ORDEN ?? 0, disabled: true, ignoreField: true };
      }
      return field;
    });
  }, [selectedRecord]);

  const editFunctionWrapper = (data, id, formData) =>
    updateDocumento(id, data, formData, selectedRecord);

  return {
    // Data — level 1 (clasificaciones filtradas por condición)
    clasificacionesData,
    clasificacionesRecords,
    loading,
    error,
    // Data — level 2 (lazy loading)
    childrenData,
    childrenLoading,
    onExpand,
    // Inline save
    handleSaveSuccess,
    tableLevelConfigs,
    // Create documento
    isCreateFormOpen,
    condicionesPreseleccionadas,
    handleCreate,
    handleCreateSuccess,
    handleCreateCancel,
    // Create clasificación
    isClasificacionFormOpen,
    condicionesClasificacionPre,
    handleCreateClasificacion,
    handleCreateClasificacionSuccess,
    handleCreateClasificacionCancel,
    // Edit
    isEditOpen,
    selectedRecord,
    editFormFields,
    editFunctionWrapper,
    handleCloseEdit,
    handleEditSuccess,
    handleError,
    // Delete documento
    isDeleteOpen,
    rowToDelete,
    deleteLoading,
    handleCancelDelete,
    handleConfirmDelete,
    // Delete clasificación
    isDeleteClasificacionOpen,
    clasificacionToDelete,
    deleteClasificacionLoading,
    handleCancelDeleteClasificacion,
    handleConfirmDeleteClasificacion,
    // Add documento a clasificación específica
    isAddDocumentoToClasOpen,
    clasificacionToAddTo,
    addDocumentoLoading,
    addDocumentoForm,
    handleAddDocumentoFormChange,
    handleCancelAddDocumentoToClasificacion,
    handleConfirmAddDocumentoToClasificacion,
    // Reordenar
    handleMoveDocumento,
    // Notification
    notification,
    closeNotification,
    // Config
    documentosMultiStep,
    documentosValidation,
    documentosModalConfig
  };
}
