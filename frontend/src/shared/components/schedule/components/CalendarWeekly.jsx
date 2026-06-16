import React from 'react';

/**
 * Componente CalendarWeekly - Vista semanal tipo timetable con bloques de tiempo
 * @param {Array} days - Array de días generados por useCalendar.generateWeekDays()
 * @param {Array} timeBlocks - Array de bloques de tiempo generados por useCalendar.generateTimeBlocks()
 * @param {Date|null} selectedDate - Fecha seleccionada
 * @param {function} onDateSelect - Callback al seleccionar fecha
 * @param {function} onDrillDown - Callback para navegar a vista diaria
 * @param {boolean} useCustomMode - Si está usando bloques personalizados
 * @param {Array} events - Array de eventos validados [{id, date, blockIndices, title, type, color}]
 * @param {boolean} disableSelectionHighlight - Deshabilitar resaltado de selección
 * @param {boolean} enableBlockSelection - Habilitar selección de bloques
 * @param {Array} selectedBlocks - Bloques seleccionados [{ date, blockIndex }]
 * @param {function} onBlockSelectionToggle - Callback al togglear selección de bloque
 */
const CalendarWeekly = ({
  timeBlocks,
  events = [],
  days,
  selectedDate,
  onDateSelect,
  useCustomMode,
  onDrillDown,
  disableSelectionHighlight = false,
  enableBlockSelection = false,
  selectedBlocks = [],
  onBlockSelectionToggle,
  enableEventDelete = false,
  onEventDelete = null,
  autoMerge = true
}) => {
  const isDateSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Obtener eventos para un día específico
  const getEventsForDay = (date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Obtener eventos para un bloque específico
  const getEventsForBlock = (dayDate, blockIndex) => {
    return getEventsForDay(dayDate).filter(event =>
      event.blockIndices.includes(blockIndex)
    );
  };

  // Agrupar eventos en grupos consecutivos para renderizado continuo
  const getConsecutiveEventGroups = (dayDate) => {
    const dayEvents = getEventsForDay(dayDate);
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
    
    // Si autoMerge está activo, fusionar grupos consecutivos con la misma descripción
    if (autoMerge) {
      const mergedGroups = [];
      
      for (let i = 0; i < groups.length; i++) {
        const currentGroup = groups[i];
        const currentDescription = currentGroup.event.description;
        
        // Buscar grupos posteriores consecutivos con la misma descripción
        let mergedGroup = { ...currentGroup };
        let j = i + 1;
        
        while (j < groups.length) {
          const nextGroup = groups[j];
          
          // Verificar si son consecutivos y tienen la misma descripción
          const areConsecutive = nextGroup.startIndex === mergedGroup.endIndex + 1;
          const sameDescription = nextGroup.event.description === currentDescription;
          
          if (areConsecutive && sameDescription && currentDescription) {
            // Fusionar: combinar blockIndices y actualizar span
            mergedGroup = {
              ...mergedGroup,
              blockIndices: [...mergedGroup.blockIndices, ...nextGroup.blockIndices],
              endIndex: nextGroup.endIndex,
              span: mergedGroup.span + nextGroup.span
            };
            j++;
          } else {
            break;
          }
        }
        
        mergedGroups.push(mergedGroup);
        i = j - 1; // Saltar los grupos fusionados
      }
      
      return mergedGroups;
    }
    
    return groups;
  };

  // Convertir hex a RGBA
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleDayClick = (date) => {
    // Solo selección normal - drill-down desactivado
    onDateSelect(date);
  };

  const handleBlockClick = (date, blockIndex, hasEvent, isBreak) => {
    if (enableBlockSelection) {
      if (isBreak) {
        alert('Los bloques tipo BREAK no son seleccionables');
        return;
      }
      onBlockSelectionToggle(date, blockIndex, hasEvent);
    } else {
      onDateSelect(date);
    }
  };

  const isBlockSelected = (date, blockIndex) => {
    return selectedBlocks.some(
      b => b.date.toDateString() === date.toDateString() && b.blockIndex === blockIndex
    );
  };

  const handleEventDelete = (e, eventId) => {
    e.stopPropagation();
    onEventDelete(eventId);
  };

  return (
    <div className="p-3 overflow-auto bg-white/50 rounded-b-2xl">
      {/* Grid container with time column + 7 day columns */}
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gridTemplateRows: `repeat(${timeBlocks.length + 1}, auto)`,
          minWidth: '600px'
        }}
      >
        {/* Header row - empty corner + day headers */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10" style={{ gridRow: '1 / 2', gridColumn: '1 / 2' }} />
        {days.map((item, dayIndex) => {
          const isSelected = isDateSelected(item.date);
          return (
            <div
              key={item.key}
              onClick={() => handleDayClick(item.date)}
              style={{ gridRow: '1 / 2', gridColumn: `${dayIndex + 2} / ${dayIndex + 3}` }}
              className={`
                sticky top-0 z-10 p-2 text-center cursor-pointer transition-colors border-b-2
                ${!disableSelectionHighlight && isSelected 
                  ? 'bg-indigo-50 border-indigo-500' 
                  : item.isToday 
                    ? 'bg-blue-50/60 border-indigo-300' 
                    : 'bg-gray-50 border-gray-200'}
              `}
            >
              <p className={`text-xs font-medium ${item.isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                {item.weekday}
              </p>
              <p className={`text-sm font-semibold ${!disableSelectionHighlight && isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
                {item.day}
              </p>
            </div>
          );
        })}

        {/* Time slots rows */}
        {timeBlocks.map((block, blockIndex) => (
          <React.Fragment key={block.key}>
            {/* Time label column */}
            <div 
              style={{ gridRow: `${blockIndex + 2} / ${blockIndex + 3}`, gridColumn: '1 / 2' }}
              className={`
                py-2 px-1 text-right text-xs border-r border-gray-200 font-mono tracking-tight
                ${useCustomMode && block.type === 'break' ? 'bg-gray-100 text-gray-500 italic' : 'text-gray-600'}
                ${block.isTruncated ? 'bg-red-50 text-red-600' : ''}
              `}
            >
              <div className="leading-tight">
                <span className={block.isTruncated ? 'line-through opacity-50' : ''}>
                  {block.timeRange}
                </span>
                {block.isTruncated && (
                  <span className="text-red-500 ml-1">(truncado)</span>
                )}
              </div>
            </div>
            
            {/* 7 day columns for this time slot */}
            {days.map((dayItem, dayIndex) => {
              const isSelected = isDateSelected(dayItem.date);
              const isBreak = useCustomMode && block.type === 'break';
              const isClase = useCustomMode && block.type === 'clase';
              const blockEvents = useCustomMode && block.index !== undefined ? getEventsForBlock(dayItem.date, block.index) : [];
              const hasEvent = blockEvents.length > 0;
              const blockSelected = enableBlockSelection && isBlockSelected(dayItem.date, blockIndex);

              return (
                <div
                  key={`${dayItem.key}-${block.key}`}
                  onClick={() => handleBlockClick(dayItem.date, blockIndex, hasEvent, isBreak)}
                  title={isClase && block.label ? block.label : undefined}
                  style={{ gridRow: `${blockIndex + 2} / ${blockIndex + 3}`, gridColumn: `${dayIndex + 2} / ${dayIndex + 3}` }}
                  className={`
                    py-1 px-1 border-b border-r cursor-pointer transition-colors min-h-[80px] relative
                    ${blockSelected
                      ? 'bg-emerald-200/50 border-emerald-500'
                      : !disableSelectionHighlight && isSelected
                        ? 'bg-indigo-100/50 border-indigo-300'
                        : isBreak
                          ? 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                          : dayItem.isToday
                            ? 'bg-blue-50/60 hover:bg-blue-100'
                            : 'hover:bg-gray-100 border-gray-200'}
                    ${block.isTruncated ? 'bg-red-50 border-red-200' : ''}
                  `}
                >
                  {isBreak && block.label && (
                    <span className="text-xs text-gray-500 font-medium">
                      {block.label}
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
        
        {/* Renderizar eventos continuos usando grid-row spanning */}
        {useCustomMode && days.map((dayItem, dayIndex) => {
          const eventGroups = getConsecutiveEventGroups(dayItem.date);
          
          return eventGroups.map((group, groupIndex) => (
            <div
              key={`${dayItem.key}-${group.event.id}-${groupIndex}`}
              style={{ 
                gridRow: `${group.startIndex + 2} / ${group.endIndex + 3}`, 
                gridColumn: `${dayIndex + 2} / ${dayIndex + 3}`,
                backgroundColor: hexToRgba(group.event.color, 0.25),
                border: '2px solid',
                borderColor: hexToRgba(group.event.color, 0.5),
                zIndex: 10,
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
          ));
        })}
      </div>
    </div>
  );
};

export default CalendarWeekly;
