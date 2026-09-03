import { useState, useEffect, useRef, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { sendEmailById } from '@/features/correos/services/correosService';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/correos/tableConfig';
import {
  correosFormFields,
  correosMultiStep,
  correosValidation,
  correosModalConfig
} from '@/features/correos/config/correos/formConfig';

/**
 * Calcula los ms hasta el próximo ciclo de cron (cada 15 min: :00, :15, :30, :45) + 10s de margen.
 */
function msUntilNextCronRefresh() {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMark = Math.ceil((minutes + 1) / 15) * 15;

  const next = new Date(now);
  if (nextMark >= 60) {
    next.setHours(now.getHours() + 1);
    next.setMinutes(0);
  } else {
    next.setMinutes(nextMark);
  }
  next.setSeconds(0);
  next.setMilliseconds(0);

  return (next.getTime() - now.getTime()) + 10000;
}

/**
 * useCorreos — lógica de la página de correos.
 * State + handlers + CRUD wiring + auto-refresh cron + composer/view/enviar.
 */
export function useCorreos() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Auto-refresh: después de cada ciclo de 15 min del cron, recargar la tabla.
  useEffect(() => {
    let timeoutId;

    const scheduleNext = () => {
      const ms = msUntilNextCronRefresh();
      timeoutId = setTimeout(() => {
        refreshRef.current?.();
        scheduleNext();
      }, ms);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const correosCrud = useCrudForms({
    tableName: 'CORREOS',
    primaryKey: 'ID_CORREO',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(correosCrud),
    [correosCrud]
  );

  const [viewEmail, setViewEmail] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(null);

  const handleView = (row) => setViewEmail(row);

  const handleEditComposer = (row) => {
    setEditEmail(row);
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    setComposerOpen(false);
    setEditEmail(null);
  };

  const handleOpenComposer = () => {
    setEditEmail(null);
    setComposerOpen(true);
  };

  const handleEnviar = async (row) => {
    if (!row?.ID_CORREO) return;
    const ok = window.confirm(`¿Enviar el correo "${row.ASUNTO || '(sin asunto)'}" ahora?`);
    if (!ok) return;
    try {
      await sendEmailById(row.ID_CORREO);
      refresh();
    } catch (err) {
      alert(`Error al enviar: ${err.message}`);
    }
  };

  const crudLevels = useMemo(() => [
    {
      crud: correosCrud,
      tableName: 'CORREOS',
      primaryKey: 'ID_CORREO',
      formFields: correosFormFields,
      formLayout: null,
      multiStep: correosMultiStep,
      validation: correosValidation,
      confirmSubmit: true,
      modalConfig: correosModalConfig
    }
  ], [correosCrud]);

  return {
    records,
    loading,
    error,
    refresh,
    correosCrud,
    tableLevelConfigs,
    crudLevels,
    // Composer
    composerOpen,
    editEmail,
    handleOpenComposer,
    handleEditComposer,
    handleCloseComposer,
    // View modal
    viewEmail,
    handleView,
    handleCloseView: () => setViewEmail(null),
    // Enviar
    handleEnviar
  };
}
