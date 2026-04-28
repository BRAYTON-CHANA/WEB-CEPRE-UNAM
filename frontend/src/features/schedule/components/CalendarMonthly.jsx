import React from 'react';
import { countEventBlocksForDay } from '../hooks/useCalendar';

/**
 * Componente CalendarMonthly - Vista mensual tradicional
 * @param {Array} days - Array de días generados por useCalendar.generateMonthDays()
 * @param {Date|null} selectedDate - Fecha seleccionada
 * @param {string[]} weekDays - Nombres cortos de días de semana
 * @param {function} onDateSelect - Callback al seleccionar fecha
 * @param {function} onDrillDown - Callback para navegar a vista semanal
 * @param {Array} events - Array de eventos validados [{id, date, blockIndices, title, type, color}]
 */
const CalendarMonthly = ({ days, selectedDate, weekDays, onDateSelect, onDrillDown, events = [], autoMerge = true }) => {
  const isDateSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getEventBlockCount = (date) => {
    return countEventBlocksForDay(events, date);
  };

  const handleDayClick = (date) => {
    if (onDrillDown) {
      // Navegar directamente a vista semanal
      onDrillDown('week', date);
    } else {
      // Selección normal si no hay drill-down
      onDateSelect(date);
    }
  };

  return (
    <>
      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {days.map((item) => {
          if (item.type === 'empty') {
            return <div key={item.key} className="h-10" />;
          }

          const isSelected = isDateSelected(item.date);
          const eventBlockCount = getEventBlockCount(item.date);
          const baseClasses = "h-10 flex items-center justify-center text-sm cursor-pointer transition-colors relative";
          const dayClasses = isSelected
            ? "bg-blue-500 text-white font-semibold rounded-full mx-1"
            : item.isToday
              ? "bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 rounded-full mx-1"
              : "text-gray-700 hover:bg-gray-100 rounded-full mx-1";

          return (
            <div
              key={item.key}
              onClick={() => handleDayClick(item.date)}
              className={`${baseClasses} ${dayClasses}`}
            >
              {item.day}
              {/* Indicador de notificación de eventos */}
              {eventBlockCount > 0 && (
                <div className="absolute top-1 right-1 flex items-center justify-center">
                  <div className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {eventBlockCount}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CalendarMonthly;
