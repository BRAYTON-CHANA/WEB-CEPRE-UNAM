import React from 'react';

/**
 * Componente CalendarDaily - Vista diaria con bloques de tiempo
 * @param {Date} currentDate - Fecha actual del calendario
 * @param {Date|null} selectedDate - Fecha seleccionada
 * @param {string[]} fullWeekDays - Nombres completos de días de semana
 * @param {string[]} monthNames - Nombres de meses
 * @param {Array} timeBlocks - Array de bloques de tiempo generados por useCalendar.generateTimeBlocks()
 * @param {function} onDateSelect - Callback al seleccionar fecha
 * @param {boolean} useCustomMode - Si está usando bloques personalizados
 * @param {Array} events - Array de eventos validados [{id, date, blockIndices, title, type, color}]
 * @param {boolean} disableSelectionHighlight - Deshabilitar resaltado de selección
 * @param {boolean} enableBlockSelection - Habilitar selección de bloques
 * @param {Array} selectedBlocks - Bloques seleccionados [{ date, blockIndex }]
 * @param {function} onBlockSelectionToggle - Callback al togglear selección de bloque
 */
const CalendarDaily = ({
  currentDate,
  selectedDate,
  fullWeekDays,
  monthNames,
  timeBlocks,
  useCustomMode,
  events,
  onDateSelect,
  disableSelectionHighlight = false,
  enableBlockSelection = false,
  selectedBlocks = [],
  onBlockSelectionToggle,
  enableEventDelete = false,
  onEventDelete = null,
  autoMerge = true
}) => {
  const today = new Date();
  const isToday = currentDate.toDateString() === today.toDateString();
  const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();

  // Obtener eventos para el día actual
  const getEventsForDay = () => {
    return events.filter(event => 
      event.date.toDateString() === currentDate.toDateString()
    );
  };

  // Obtener eventos para un bloque específico
  const getEventsForBlock = (blockIndex) => {
    return getEventsForDay().filter(event =>
      event.blockIndices.includes(blockIndex)
    );
  };

  // Agrupar eventos en grupos consecutivos para renderizado continuo
  const getConsecutiveEventGroups = () => {
    const dayEvents = getEventsForDay();
    const groups = [];
    
    dayEvents.forEach(event => {
      // Ordenar blockIndices
      const sortedIndices = [...event.blockIndices].sort((a, b) => a - b);
      
      // Dividir en grupos consecutivos (separados por breaks)
      let currentGroup = [sortedIndices[0]];
      
      for (let i = 1; i < sortedIndices.length; i++) {
        const prevIndex = sortedIndices[i - 1];
        const currentIndex = sortedIndices[i];
        
        // Si hay un salto (break en medio), crear nuevo grupo
        if (currentIndex !== prevIndex + 1) {
          groups.push({
            event,
            blockIndices: currentGroup,
            startIndex: currentGroup[0],
            endIndex: currentGroup[currentGroup.length - 1],
            span: currentGroup.length
          });
          currentGroup = [currentIndex];
        } else {
          currentGroup.push(currentIndex);
        }
      }
      
      // Agregar el último grupo
      if (currentGroup.length > 0) {
        groups.push({
          event,
          blockIndices: currentGroup,
          startIndex: currentGroup[0],
          endIndex: currentGroup[currentGroup.length - 1],
          span: currentGroup.length
        });
      }
    });
    
    return groups;
  };

  // Convertir hex a RGBA
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleBlockClick = (blockIndex, hasEvent, isBreak) => {
    if (enableBlockSelection) {
      if (isBreak) {
        alert('Los bloques tipo BREAK no son seleccionables');
        return;
      }
      onBlockSelectionToggle(currentDate, blockIndex, hasEvent);
    } else {
      onDateSelect(currentDate);
    }
  };

  const isBlockSelected = (blockIndex) => {
    return selectedBlocks.some(
      b => b.date.toDateString() === currentDate.toDateString() && b.blockIndex === blockIndex
    );
  };

  const handleEventDelete = (e, eventId) => {
    e.stopPropagation();
    onEventDelete(eventId);
  };

  return (
    <div className="p-4 max-h-[400px] overflow-auto bg-white/50 rounded-b-2xl">
      {/* Header del día */}
      <div
        onClick={() => onDateSelect(currentDate)}
        className={`
          p-4 rounded-lg border cursor-pointer transition-colors text-center mb-4
          ${!disableSelectionHighlight && isSelected 
            ? 'bg-indigo-50 border-indigo-500' 
            : isToday 
              ? 'bg-blue-50/60 border-indigo-300' 
              : 'bg-gray-50 border-gray-200'}
        `}
      >
        <p className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
          {fullWeekDays[currentDate.getDay()]}
        </p>
        <p className={`text-sm font-semibold ${!disableSelectionHighlight && isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
          {currentDate.getDate()}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </p>
      </div>

      {/* Lista de bloques de tiempo - CSS Grid */}
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: '80px 1fr',
          gridTemplateRows: `repeat(${timeBlocks.length}, auto)`
        }}
      >
        {timeBlocks.map((block, blockIndex) => {
          const isBreak = useCustomMode && block.type === 'break';
          const blockEvents = useCustomMode && block.index !== undefined ? getEventsForBlock(block.index) : [];
          const hasEvent = blockEvents.length > 0;
          const blockSelected = enableBlockSelection && isBlockSelected(blockIndex);

          return (
            <React.Fragment key={block.key}>
              {/* Time label column */}
              <div
                style={{ gridRow: `${blockIndex + 1} / ${blockIndex + 2}`, gridColumn: '1 / 2' }}
                onClick={() => onDateSelect(currentDate)}
                className={`
                  py-2 px-2 text-right text-xs border-r border-gray-100 cursor-pointer
                  ${useCustomMode && block.type === 'break' ? 'bg-gray-100 text-gray-600' : 'text-gray-500'}
                  ${block.isTruncated ? 'bg-red-50 text-red-600' : ''}
                `}
              >
                <div className="leading-tight">
                  {isBreak && block.label && (
                    <span className="text-xs text-gray-500 font-medium">
                      {block.label}
                    </span>
                  )}
                  <span className={block.isTruncated ? 'line-through opacity-50' : ''}>
                    {block.timeRange}
                  </span>
                  {block.isTruncated && (
                    <span className="text-red-500 ml-1">(truncado)</span>
                  )}
                </div>
              </div>

              {/* Event column */}
              <div
                style={{ gridRow: `${blockIndex + 1} / ${blockIndex + 2}`, gridColumn: '2 / 3' }}
                onClick={() => handleBlockClick(blockIndex, hasEvent, isBreak)}
                title={useCustomMode && block.type === 'clase' && block.label ? block.label : undefined}
                className={`
                  py-1 px-1 border-b cursor-pointer transition-colors min-h-[60px] relative
                  ${blockSelected
                    ? 'bg-emerald-200/50 border-emerald-500'
                    : isSelected
                      ? 'bg-indigo-100/50 border-indigo-300'
                      : isBreak
                        ? 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                        : 'hover:bg-gray-100 border-gray-200'}
                `}
              />
            </React.Fragment>
          );
        })}
        
        {/* Renderizar eventos continuos usando grid-row spanning */}
        {useCustomMode && getConsecutiveEventGroups().map((group, groupIndex) => (
          <div
            key={`${group.event.id}-${groupIndex}`}
            style={{ 
              gridRow: `${group.startIndex + 1} / ${group.endIndex + 2}`, 
              gridColumn: '2 / 3',
              backgroundColor: hexToRgba(group.event.color, 0.25),
              border: '2px solid',
              borderColor: hexToRgba(group.event.color, 0.5),
              zIndex: 200,
              backdropFilter: 'blur(4px)'
            }}
            className="m-1 flex flex-col items-center justify-center text-black px-2 py-1 rounded cursor-pointer transition-opacity relative hover:scale-105 shadow-lg shadow-gray-900/10"
            title={`${group.event.title}${group.event.description ? '\n' + group.event.description : ''}\nTipo: ${group.event.type}\nBloques: ${group.blockIndices.join(', ')}`}
          >
            {enableEventDelete && onEventDelete && (
              <button
                onClick={(e) => handleEventDelete(e, group.event.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors z-20"
                title="Eliminar asignación"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <span className={`text-center whitespace-normal break-words ${group.event.titleClassName || 'text-xs font-bold'}`}>
              {group.event.title}
            </span>
            {group.event.description && (
              <span className={`text-center whitespace-normal break-words ${group.event.descriptionClassName || 'text-xs'}`}>
                {group.event.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarDaily;
