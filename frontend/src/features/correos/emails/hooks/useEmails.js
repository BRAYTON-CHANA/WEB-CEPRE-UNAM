import { useState, useEffect, useRef, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { sendEmailById, getCorreoDetalle } from '../services/emailsService';
import { formatList } from '@/shared/utils';
import { tableConfig, getTableLevelConfigs, CORREOS_LIST_FIELDS } from '../config/tableConfig';
import {
  correosFormFields,
  correosMultiStep,
  correosValidation,
  correosModalConfig
} from '../config/formConfig';

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
 * useEmails — lógica de la página de correos.
 * State + handlers + CRUD wiring + auto-refresh cron + composer/view/enviar.
 */
export function useEmails() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName, {}, CORREOS_LIST_FIELDS);
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
  const [recipientsEmail, setRecipientsEmail] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(null);
  const [pendingView, setPendingView] = useState(null);
  const [editPendienteEmail, setEditPendienteEmail] = useState(null);
  const [editPendienteOpen, setEditPendienteOpen] = useState(false);
  const [pendientesRefreshKey, setPendientesRefreshKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('CREADO_EN');
  const [sortOrder, setSortOrder] = useState('desc');

  const displayRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = records || [];

    if (q) {
      filtered = filtered.filter((row) => {
        const haystack = [
          row.ASUNTO,
          formatList(row.DESTINATARIOS),
          formatList(row.CC),
          formatList(row.BCC),
          row.CUENTA_SMTP_NOMBRE,
          row.CREADOR_NOMBRE || row.CREADO_POR,
          row.ESTADO,
          row.PRIORIDAD,
          row.REMITENTE,
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (!aVal && !bVal) return 0;
      if (!aVal) return sortOrder === 'asc' ? -1 : 1;
      if (!bVal) return sortOrder === 'asc' ? 1 : -1;
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      if (isNaN(aDate) || isNaN(bDate)) return 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    return sorted;
  }, [records, searchTerm, sortBy, sortOrder]);

  const handleView = (row) => setViewEmail(row);
  const handleViewRecipients = (row) => setRecipientsEmail(row);

  const handleEditComposer = async (row) => {
    let data = row;
    try {
      const detalle = await getCorreoDetalle(row.ID_CORREO);
      if (detalle) data = { ...row, ...detalle };
    } catch (err) {
      console.error('[useEmails] Error cargando detalle del correo:', err);
    }
    setEditEmail(data);
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    setComposerOpen(false);
    setEditEmail(null);
  };

  const handleOpenComposer = () => {
    setEditEmail(null);
    setComposerOpen(true);
    setPendingView(null);
  };

  const handleOpenPendientes = (ids) => {
    setComposerOpen(false);
    setPendingView({ ids });
  };
  const handleOpenPendientesFromTable = () => setPendingView({ ids: null });
  const handleClosePendientes = () => setPendingView(null);

  const handleOpenEditPendiente = async (row) => {
    setComposerOpen(false);
    let data = row;
    try {
      const detalle = await getCorreoDetalle(row.ID_CORREO);
      if (detalle) data = { ...row, ...detalle };
    } catch (err) {
      console.error('[useEmails] Error cargando detalle del correo:', err);
    }
    setEditPendienteEmail(data);
    setEditPendienteOpen(true);
  };

  const handleCloseEditPendiente = () => {
    setEditPendienteEmail(null);
    setEditPendienteOpen(false);
  };

  const handleSuccessEditPendiente = () => {
    handleCloseEditPendiente();
    refresh();
    setPendientesRefreshKey((k) => k + 1);
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
    displayRecords,
    loading,
    error,
    refresh,
    // Búsqueda y orden
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    // CRUD
    correosCrud,
    tableLevelConfigs,
    crudLevels,
    // Composer
    composerOpen,
    editEmail,
    handleOpenComposer,
    handleEditComposer,
    handleCloseComposer,
    // Pendientes
    pendingView,
    handleOpenPendientes,
    handleOpenPendientesFromTable,
    handleClosePendientes,
    editPendienteEmail,
    editPendienteOpen,
    handleOpenEditPendiente,
    handleCloseEditPendiente,
    handleSuccessEditPendiente,
    pendientesRefreshKey,
    // View modal
    viewEmail,
    handleView,
    handleCloseView: () => setViewEmail(null),
    // Recipients modal
    recipientsEmail,
    handleViewRecipients,
    handleCloseRecipients: () => setRecipientsEmail(null),
    // Enviar
    handleEnviar
  };
}
