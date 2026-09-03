import { useState, useMemo, useCallback } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { getTableLevelConfigs } from '@/features/docentes/config/tableConfig';

/**
 * useDocentes — lógica de la página de docentes.
 * State + handlers + CRUD wiring para la tabla VW_DOCENTES.
 *
 * El modal de crear/editar usa DocenteForm (custom 2 páginas),
 * no CrudForm del framework. El delete y las notificaciones
 * se manejan con useCrudForms estándar.
 *
 * Además maneja 4 modales de visor de archivos:
 * DNI, Grado Académico, Título Profesional, Constancia SUNEDU/DRE.
 */
export function useDocentes() {
  const { records, loading, error, refresh } = useTableData('VW_DOCENTES');
  const [tableRecords, setTableRecords] = useState(records || []);

  // Estado para modales de archivos
  const [archivoViewerOpen, setArchivoViewerOpen] = useState(false);
  const [archivoViewerDocente, setArchivoViewerDocente] = useState(null);
  const [archivoViewerTipo, setArchivoViewerTipo] = useState(null);

  // Estado para modal de tablas relacionadas
  const [tablasModalOpen, setTablasModalOpen] = useState(false);
  const [tablasModalDocente, setTablasModalDocente] = useState(null);

  const docentesCrud = useCrudForms({
    tableName: 'DOCENTES',
    primaryKey: 'ID_DOCENTE',
    onRefresh: refresh
  });

  // Handler genérico para abrir visor de archivos
  const handleVerArchivo = useCallback((tipo) => (row) => {
    setArchivoViewerDocente(row);
    setArchivoViewerTipo(tipo);
    setArchivoViewerOpen(true);
  }, []);

  const handleVerDni = useMemo(() => handleVerArchivo('dni'), [handleVerArchivo]);
  const handleVerGrado = useMemo(() => handleVerArchivo('grado_academico'), [handleVerArchivo]);
  const handleVerConstancia = useMemo(() => handleVerArchivo('constancia_sunedu_dre'), [handleVerArchivo]);

  const handleCloseArchivoViewer = useCallback(() => {
    setArchivoViewerOpen(false);
    setArchivoViewerDocente(null);
    setArchivoViewerTipo(null);
  }, []);

  const handleArchivoUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handler para abrir modal de tablas relacionadas
  const handleEditarTablas = useCallback((row) => {
    setTablasModalDocente(row);
    setTablasModalOpen(true);
  }, []);

  const handleCloseTablasModal = useCallback(() => {
    setTablasModalOpen(false);
    setTablasModalDocente(null);
  }, []);

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs({
      docentesCrud,
      onVerDni: handleVerDni,
      onVerGrado: handleVerGrado,
      onVerConstancia: handleVerConstancia,
      onEditarTablas: handleEditarTablas
    }),
    [docentesCrud, handleVerDni, handleVerGrado, handleVerConstancia, handleEditarTablas]
  );

  // Actualizar records locales cuando llega data nueva
  const updateRecords = useCallback((newRecords) => {
    setTableRecords(newRecords);
  }, []);

  // Success del DocenteForm (create o edit)
  const handleFormSuccess = useCallback((result) => {
    docentesCrud.handleFormSuccess(result);
    refresh();
  }, [docentesCrud, refresh]);

  const handleFormError = useCallback((err) => {
    docentesCrud.handleFormError(err);
  }, [docentesCrud]);

  // Success de edición inline de tabla (toggle ACTIVO)
  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_DOCENTE) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  return {
    // Data
    records,
    tableRecords,
    loading,
    error,
    refresh,
    updateRecords,
    // CRUD
    docentesCrud,
    tableLevelConfigs,
    // Handlers del form custom
    handleFormSuccess,
    handleFormError,
    // Handler de edición inline
    handleSaveSuccess,
    // Visor de archivos
    archivoViewerOpen,
    archivoViewerDocente,
    archivoViewerTipo,
    handleCloseArchivoViewer,
    handleArchivoUpdated,
    // Modal de tablas relacionadas
    tablasModalOpen,
    tablasModalDocente,
    handleEditarTablas,
    handleCloseTablasModal
  };
}
