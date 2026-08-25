import React, { useState, useEffect, useRef } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import ViewCorreoModal from '@/features/correos/components/ViewCorreoModal';
import CorreoComposer from '@/features/correos/components/CorreoComposer';
import { sendEmailById } from '@/features/correos/services/correosService';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/correos/config/correos/tableConfig';
import { correosFormFields, correosMultiStep, correosValidation, correosModalConfig } from '@/features/correos/config/correos/formConfig';
import { headerProps, getHeaderActions } from '@/features/correos/config/correos/headerConfig';
import { useCronCountdown } from '@/features/correos/hooks/useCronCountdown';

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

  // +10 segundos de margen para que el cron termine de procesar
  return (next.getTime() - now.getTime()) + 10000;
}

/**
 * Configuración de CORREOS
 * CRUD completo para la tabla CORREOS usando CrudMultiLevelManager con un solo nivel.
 */
function CorreosConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const { timeLabel, countdown } = useCronCountdown();
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

  const tableLevelConfigs = getTableLevelConfigs(correosCrud);
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

  const crudLevels = [
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
  ];

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
            ...level,
            actions: level.actions ? {
              ...level.actions,
              edit: level.actions.edit ? { ...level.actions.edit, onClick: handleEditComposer } : undefined,
              observaciones: level.actions.observaciones ? { ...level.actions.observaciones, onClick: handleEditComposer } : undefined,
              delete: level.actions.delete ? { ...level.actions.delete, onClick: h.handleDelete } : undefined,
              enviar: level.actions.enviar ? { ...level.actions.enviar, onClick: handleEnviar } : undefined,
              ver: level.actions.ver ? level.actions.ver.map(action => ({ ...action, onClick: handleView })) : undefined
            } : undefined
          }));

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions(correosCrud, () => setComposerOpen(true))}
              />

              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Envío automático cada 15 min. Próximo: <strong>{timeLabel}</strong> (en {countdown})
                </span>
              </div>

              {loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando datos...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevel
                    key={h.refreshTrigger}
                    data={records}
                    levelConfigs={enrichedLevelConfigs}
                  />
                </div>
              )}

              <ViewCorreoModal email={viewEmail} onClose={() => setViewEmail(null)} />
              <CorreoComposer
                isOpen={composerOpen}
                editMode={!!editEmail}
                editData={editEmail}
                onClose={handleCloseComposer}
                onSuccess={() => { refresh(); handleCloseComposer(); }}
              />
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default CorreosConfig;
