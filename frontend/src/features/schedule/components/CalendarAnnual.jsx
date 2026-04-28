import React from 'react';
import { countEventBlocksForMonth } from '../hooks/useCalendar';

/**
 * Componente CalendarAnnual - Vista anual (grid de 12 meses)
 * @param {Date} currentDate - Fecha actual del calendario
 * @param {function} onMonthSelect - Callback al seleccionar un mes (recibe fecha y vista)
 * @param {string[]} monthNames - Nombres de los meses
 * @param {Array} events - Array de eventos validados [{id, date, blockIndices, title, type, color}]
 */
const CalendarAnnual = ({ currentDate, onMonthSelect, monthNames, events = [] }) => {
  const year = currentDate.getFullYear();
  const today = new Date();
  const isCurrentYear = today.getFullYear() === year;

  const getEventBlockCount = (monthIndex) => {
    return countEventBlocksForMonth(events, year, monthIndex);
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-3">
      {monthNames.map((monthName, index) => {
        const monthDate = new Date(year, index, 1);
        const isCurrentMonth = isCurrentYear && today.getMonth() === index;
        const eventBlockCount = getEventBlockCount(index);

        return (
          <div
            key={monthName}
            onClick={() => onMonthSelect(monthDate, 'month')}
            className={`
              p-3 rounded-lg border cursor-pointer transition-colors text-center relative
              ${isCurrentMonth 
                ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
                : 'bg-white border-gray-200 hover:bg-gray-50'}
            `}
          >
            <h4 className={`text-sm font-medium truncate ${isCurrentMonth ? 'text-blue-600' : 'text-gray-700'}`}>
              {monthName}
            </h4>
            <p className="text-xs text-gray-400 mt-1">{year}</p>
            {/* Indicador de notificación de eventos */}
            {eventBlockCount > 0 && (
              <div className="absolute top-2 right-2 flex items-center justify-center">
                <div className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {eventBlockCount}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarAnnual;
