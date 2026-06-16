import React from 'react';
import { useCalendar, validateEvents } from '../hooks/useCalendar';
import ViewMenu from './ViewMenu';
import CalendarAnnual from './CalendarAnnual';
import CalendarMonthly from './CalendarMonthly';
import CalendarWeekly from './CalendarWeekly';
import CalendarDaily from './CalendarDaily';

/**
 * Componente Calendar - Contenedor principal del calendario
 * Usa hook useCalendar y componentes de vista separados
 *
 * @param {function} onDateSelect - Callback al seleccionar fecha
 * @param {Date|null} selectedDate - Fecha seleccionada
 * @param {number} startHour - Hora de inicio (0-23), default: 0
 * @param {number} finalHour - Hora final (0-23), default: 23
 * @param {number} blockSeparation - Minutos entre bloques (15, 30, 60), default: 60
 * @param {Array} customBlocks - Bloques personalizados [{duration, type, label}]
 * @param {Array} events - Eventos [{id, date, blockIndices, title, type, color?}]
 * @param {string} initialView - Vista inicial: 'year'|'month'|'week'|'day' (default: 'month')
 * @param {boolean} enableBlockSelection - Habilitar selección de bloques (default: false)
 * @param {function} onBlockSelectionChange - Callback cuando cambia la selección de bloques
 * @param {Array} selectedBlocks - Bloques seleccionados [{ date, blockIndex }]
 */
const Calendar = ({
  onDateSelect,
  selectedDate,
  startHour = 0,
  finalHour = 23,
  blockSeparation = 60,
  customBlocks = null,
  events = null,
  disableSelectionHighlight = false,
  initialView = 'month',
  enableBlockSelection = false,
  onBlockSelectionChange,
  selectedBlocks: externalSelectedBlocks,
  enableEventDelete = false,
  onEventDelete = null,
  autoMerge = true
}) => {
  // Ref para rastrear si ya se mostró alert para los customBlocks actuales
  const lastAlertedBlocksRef = React.useRef(null);
  // Ref para rastrear si ya se mostraron warnings para los eventos actuales
  const lastAlertedEventsRef = React.useRef(null);

  // Estado interno para bloques seleccionados (controlado o no controlado)
  const [internalSelectedBlocks, setInternalSelectedBlocks] = React.useState([]);
  const selectedBlocks = externalSelectedBlocks !== undefined ? externalSelectedBlocks : internalSelectedBlocks;

  const {
    currentDate,
    viewMode,
    setViewMode,
    setDate,
    goToPrevious,
    goToNext,
    goToToday,
    generateMonthDays,
    generateWeekDays,
    generateTimeBlocks,
    generateCustomBlocks,
    headerTitle,
    monthNames,
    fullWeekDays,
    weekDays
  } = useCalendar(new Date(), initialView);

  // Detectar modo: custom vs automático
  const useCustomMode = customBlocks && customBlocks.length > 0;
  
  // Generar bloques según el modo
  const blockResult = useCustomMode
    ? generateCustomBlocks(customBlocks, startHour, finalHour !== 23 ? finalHour : null)
    : { blocks: generateTimeBlocks(startHour, finalHour, blockSeparation), truncated: [], omitted: [] };
  
  const { blocks: timeBlocks, truncated, omitted } = blockResult;
  
  // Validar eventos y filtrar bloques tipo 'break'
  const { validEvents, warnings } = React.useMemo(() => {
    if (!events || !useCustomMode) {
      return { validEvents: [], warnings: [] };
    }
    return validateEvents(events, customBlocks);
  }, [events, customBlocks, useCustomMode]);
  
  // Mostrar alertas solo cuando cambian los customBlocks (no en cada render)
  React.useEffect(() => {
    // Crear un ID único basado en los customBlocks actuales
    const currentBlocksId = useCustomMode && customBlocks
      ? customBlocks.map(b => `${b.duration}-${b.type}-${b.label}`).join('|')
      : 'auto';
    
    // Si ya mostramos alert para estos mismos customBlocks, no hacer nada
    if (lastAlertedBlocksRef.current === currentBlocksId) {
      return;
    }
    
    // Si hay truncamientos u omisiones, mostrar alert y registrar
    if (truncated.length > 0 || omitted.length > 0) {
      if (truncated.length > 0) {
        const messages = truncated.map(t => 
          `'${t.label}' truncado de ${t.originalDuration}min a ${t.newDuration}min`
        );
        alert(`Atención:\n${messages.join('\n')}\n\nLímite: ${truncated[0].reason}`);
      }
      if (omitted.length > 0) {
        const labels = omitted.map(o => o.label).join(', ');
        alert(`Se omitieron ${omitted.length} bloque(s): ${labels}\nPor exceder el horario límite.`);
      }
      // Registrar que ya mostramos alert para estos customBlocks
      lastAlertedBlocksRef.current = currentBlocksId;
    }
  }, [truncated, omitted, customBlocks, useCustomMode]);

  // Mostrar warnings para eventos que incluyeron bloques tipo 'break'
  React.useEffect(() => {
    if (warnings.length === 0) {
      return;
    }
    
    // Crear ID único basado en los eventos actuales
    const eventsId = validEvents.map(e => `${e.id}-${e.blockIndices.join(',')}`).join('|');
    
    // Si ya mostramos warnings para estos mismos eventos, no hacer nada
    if (lastAlertedEventsRef.current === eventsId) {
      return;
    }
    
    // Mostrar warnings
    const warningMessages = warnings.map(w => w.message).join('\n\n');
    alert(`Advertencia:\n\n${warningMessages}`);
    
    // Registrar que ya mostramos warnings
    lastAlertedEventsRef.current = eventsId;
  }, [warnings, validEvents]);

  const handleDateSelect = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleMonthSelect = (date, newView) => {
    setDate(date);
    setViewMode(newView);
  };

  const handleDrillDown = (newView, date) => {
    setDate(date);
    setViewMode(newView);
  };

  const handleBlockSelectionToggle = (date, blockIndex, hasEvent) => {
    if (!enableBlockSelection) return;

    if (hasEvent) {
      alert('Solo se puede seleccionar bloques SIN EVENTO');
      return;
    }

    const blockKey = `${date.toDateString()}-${blockIndex}`;
    const isSelected = selectedBlocks.some(
      b => b.date.toDateString() === date.toDateString() && b.blockIndex === blockIndex
    );

    let newSelectedBlocks;
    if (isSelected) {
      newSelectedBlocks = selectedBlocks.filter(
        b => !(b.date.toDateString() === date.toDateString() && b.blockIndex === blockIndex)
      );
    } else {
      newSelectedBlocks = [...selectedBlocks, { date, blockIndex }];
    }

    if (externalSelectedBlocks === undefined) {
      setInternalSelectedBlocks(newSelectedBlocks);
    }

    if (onBlockSelectionChange) {
      onBlockSelectionChange(newSelectedBlocks);
    }
  };

  const renderView = () => {
    switch (viewMode) {
      case 'year':
        return (
          <CalendarAnnual
            currentDate={currentDate}
            events={validEvents}
            onMonthSelect={handleMonthSelect}
            monthNames={monthNames}
          />
        );
      case 'month':
        return (
          <CalendarMonthly
            days={generateMonthDays(currentDate)}
            selectedDate={selectedDate}
            weekDays={weekDays}
            events={validEvents}
            onDateSelect={handleDateSelect}
            onDrillDown={handleDrillDown}
            autoMerge={autoMerge}
          />
        );
      case 'week':
        return (
          <CalendarWeekly
            days={generateWeekDays(currentDate)}
            selectedDate={selectedDate}
            timeBlocks={timeBlocks}
            useCustomMode={useCustomMode}
            events={validEvents}
            onDateSelect={handleDateSelect}
            onDrillDown={handleDrillDown}
            disableSelectionHighlight={disableSelectionHighlight}
            enableBlockSelection={enableBlockSelection}
            selectedBlocks={selectedBlocks}
            onBlockSelectionToggle={handleBlockSelectionToggle}
            enableEventDelete={enableEventDelete}
            onEventDelete={onEventDelete}
            autoMerge={autoMerge}
          />
        );
      case 'day':
        return (
          <CalendarDaily
            currentDate={currentDate}
            selectedDate={selectedDate}
            fullWeekDays={fullWeekDays}
            monthNames={monthNames}
            timeBlocks={timeBlocks}
            useCustomMode={useCustomMode}
            events={validEvents}
            onDateSelect={handleDateSelect}
            disableSelectionHighlight={disableSelectionHighlight}
            enableBlockSelection={enableBlockSelection}
            selectedBlocks={selectedBlocks}
            onBlockSelectionToggle={handleBlockSelectionToggle}
            enableEventDelete={enableEventDelete}
            onEventDelete={onEventDelete}
            autoMerge={autoMerge}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-200/60">
      {/* Header - Fila superior: Menú de vista */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
        <ViewMenu currentView={viewMode} onViewChange={setViewMode} />
        
        {/* Espacio vacío a la derecha para balance */}
        <div className="w-20" />
      </div>

      {/* Header - Fila inferior: Navegación */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
        <button
          onClick={goToPrevious}
          className="p-2 hover:bg-indigo-50 rounded-full transition-colors"
          aria-label="Anterior"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center flex-1 mx-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {headerTitle}
          </h3>
        </div>

        <button
          onClick={goToNext}
          className="p-2 hover:bg-indigo-50 rounded-full transition-colors"
          aria-label="Siguiente"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Vista actual */}
      <div className="min-h-[300px]">
        {renderView()}
      </div>

      {/* Botón Hoy */}
      <div className="p-3 border-t border-gray-200/60 flex justify-center">
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 rounded-md transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 tracking-wide"
        >
          Hoy
        </button>
      </div>
    </div>
  );
};

export default Calendar;
