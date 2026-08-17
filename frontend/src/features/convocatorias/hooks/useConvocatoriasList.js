import { useState, useMemo, useCallback } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getConvocatoriasListLevelConfig } from '@/features/convocatorias/config/tableConfig';
import { getListCrudLevels } from '@/features/convocatorias/config/crudLevels';
import { createConvocatoriaConPlazas } from '@/features/convocatorias/services/convocatoriaService';

/**
 * useConvocatoriasList — lógica de la página 1 (lista de convocatorias).
 * State + handlers + CRUD wiring para la tabla plana + modal custom 2 pasos.
 *
 * @param {Function} onManage — callback al click "Manejar Convocatoria"
 */
export function useConvocatoriasList({ onManage }) {
  // ===== Estado del modal custom de creación (2 pasos) =====
  const [isCustomCreateOpen, setIsCustomCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [plazas, setPlazas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const FETCH_CONFIGS = useMemo(() => [
    { tableName: 'VW_CONVOCATORIAS', primaryKey: 'ID_CONVOCATORIA', filters: {} }
  ], []);

  const {
    records,
    loading,
    error,
    refresh,
    updateRecord
  } = useMultiLevelFetch(FETCH_CONFIGS);

  const convocatoriaCrud = useCrudForms({
    tableName: 'CONVOCATORIA',
    primaryKey: 'ID_CONVOCATORIA',
    onRefresh: () => refresh()
  });

  // ===== Modal custom de creación =====
  const customHandleCreate = useCallback(() => {
    setIsCustomCreateOpen(true);
    setCreateStep(1);
    setStep1Data(null);
    setPlazas([]);
    setSubmitError(null);
    setSubmitting(false);
  }, []);

  const closeCustomCreate = useCallback(() => {
    setIsCustomCreateOpen(false);
    setCreateStep(1);
    setStep1Data(null);
    setPlazas([]);
    setSubmitError(null);
    setSubmitting(false);
  }, []);

  const handleStep1Submit = useCallback((formData) => {
    setStep1Data(formData);
    setSubmitError(null);
    setCreateStep(2);
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (!step1Data) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createConvocatoriaConPlazas({ ...step1Data, PLAZAS: plazas });
      closeCustomCreate();
      refresh();
      convocatoriaCrud.showNotification(
        'success',
        'Operación Exitosa',
        'La convocatoria ha sido creada exitosamente.'
      );
    } catch (err) {
      const msg = err?.message || 'Ocurrió un error al crear la convocatoria.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [step1Data, plazas, closeCustomCreate, refresh, convocatoriaCrud]);

  const tableLevelConfigs = useMemo(() => [
    getConvocatoriasListLevelConfig(convocatoriaCrud, onManage)
  ], [convocatoriaCrud, onManage]);

  const crudLevels = useMemo(() => [
    ...getListCrudLevels(convocatoriaCrud, refresh)
  ], [convocatoriaCrud, refresh]);

  return {
    // Data
    records,
    loading,
    error,
    updateRecord,
    // CRUD
    convocatoriaCrud,
    tableLevelConfigs,
    crudLevels,
    // Modal custom
    isCustomCreateOpen,
    createStep,
    plazas,
    submitting,
    submitError,
    customHandleCreate,
    closeCustomCreate,
    handleStep1Submit,
    handleFinalSubmit,
    setPlazas,
    setCreateStep
  };
}
