import React, { useState, useCallback } from 'react';
import Layout from '@/shared/components/layout/Layout';
import Calendar from '@/features/schedule/components/Calendar';
import { headerProps } from './config/headerFooterConfig';
import DocenteSelectors from './components/DocenteSelectors';
import { useAsignacionHorarioDocente } from './hooks/useAsignacionHorarioDocente';

/**
 * Asignación de Horario por Docente (solo lectura).
 * Cascada: Periodo → Sede → Turno → Docente.
 * Al elegir docente se carga el calendario con sus bloques (filtrado por turno).
 */
function AsignacionHorarioDocente() {
  const [selectorValues, setSelectorValues] = useState({
    ID_PERIODO: '',
    ID_SEDE: '',
    ID_TURNO: '',
    ID_DOCENTE_PERIODO: ''
  });

  const [docenteNombre, setDocenteNombre] = useState(null);
  const [customBlocks, setCustomBlocks] = useState(null);
  const [calendarStartHour, setCalendarStartHour] = useState(7);
  const [calendarFinalHour, setCalendarFinalHour] = useState(19);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [events, setEvents] = useState(null);

  const { loadHorarioByDocente, resetHorario } = useAsignacionHorarioDocente({
    setLoadingCalendar,
    setCustomBlocks,
    setCalendarStartHour,
    setCalendarFinalHour,
    setEvents,
    setDocenteNombre
  });

  // Manejador cascada: reset hijos al cambiar padre
  const handleSelectorChange = useCallback((name, value) => {
    setSelectorValues(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'ID_PERIODO') {
        next.ID_SEDE = '';
        next.ID_TURNO = '';
        next.ID_DOCENTE_PERIODO = '';
        resetHorario();
      } else if (name === 'ID_SEDE') {
        next.ID_TURNO = '';
        next.ID_DOCENTE_PERIODO = '';
        resetHorario();
      } else if (name === 'ID_TURNO') {
        next.ID_DOCENTE_PERIODO = '';
        resetHorario();
      } else if (name === 'ID_DOCENTE_PERIODO') {
        if (value) {
          loadHorarioByDocente({
            ID_DOCENTE_PERIODO: value,
            ID_PERIODO: prev.ID_PERIODO,
            ID_SEDE: prev.ID_SEDE,
            ID_TURNO: prev.ID_TURNO
          });
        } else {
          resetHorario();
        }
      }
      return next;
    });
  }, [resetHorario, loadHorarioByDocente]);

  const showCalendar = !!selectorValues.ID_DOCENTE_PERIODO && !!customBlocks;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{headerProps.headerTitle}</h1>
          {headerProps.headerDescription && (
            <p className="text-sm text-gray-600 mt-1">{headerProps.headerDescription}</p>
          )}
        </div>

        {/* Selectores cascada */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <DocenteSelectors values={selectorValues} onChange={handleSelectorChange} />
        </div>

        {/* Contenido */}
        {loadingCalendar ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando horario del docente...</p>
          </div>
        ) : showCalendar ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                Horario del Docente{docenteNombre ? `: ${docenteNombre}` : ''}
              </h3>
            </div>

            <Calendar
              customBlocks={customBlocks}
              events={events}
              startHour={calendarStartHour}
              finalHour={calendarFinalHour}
              disableSelectionHighlight={true}
              initialView='week'
              enableBlockSelection={false}
            />

            {events && events.length === 0 && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Este docente no tiene asignaciones en este turno.
              </p>
            )}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-600 font-medium">Seleccione un docente</p>
            <p className="mt-1 text-sm text-gray-500">Elija periodo, sede, turno y docente para ver su horario.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AsignacionHorarioDocente;
