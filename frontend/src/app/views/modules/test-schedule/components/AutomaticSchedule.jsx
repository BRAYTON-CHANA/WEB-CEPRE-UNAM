import React from 'react';
import Calendar from '@/features/schedule/components/Calendar';

/**
 * Componente AutomaticSchedule
 * Vista de calendario en modo automático con configuración de horas
 * Nota: Los eventos no funcionan en modo automático (solo con custom blocks)
 */
const AutomaticSchedule = ({
  selectedDate,
  onDateSelect,
  startHour,
  setStartHour,
  finalHour,
  setFinalHour,
  blockSeparation,
  setBlockSeparation
}) => {
  return (
    <div>
      {/* Calendario */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Calendario Automático</h2>
        <Calendar 
          onDateSelect={onDateSelect}
          selectedDate={selectedDate}
          startHour={startHour}
          finalHour={finalHour}
          blockSeparation={blockSeparation}
        />
        <p className="text-xs text-gray-400 mt-2 italic">
          Nota: Los eventos solo están disponibles en modo Custom Blocks
        </p>
      </div>

      {/* Panel de info y config */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Información</h2>
        <SelectedDateInfo selectedDate={selectedDate} />
        
        {/* Configuración de horas - Modo Automático */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Configuración Automática</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hora Inicio</label>
              <select 
                value={startHour} 
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full text-sm p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hora Final</label>
              <select 
                value={finalHour} 
                onChange={(e) => setFinalHour(Number(e.target.value))}
                className="w-full text-sm p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 25}, (_, i) => (
                  <option key={i} value={i}>
                    {i === 24 ? '23:59 (Fin del día)' : `${i.toString().padStart(2, '0')}:00`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Separación (min)</label>
              <select 
                value={blockSeparation} 
                onChange={(e) => setBlockSeparation(Number(e.target.value))}
                className="w-full text-sm p-2 border border-gray-300 rounded"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={50}>50 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Debug */}
        <DebugPanel 
          selectedDate={selectedDate}
          config={{ startHour, finalHour, blockSeparation }}
        />
      </div>
    </div>
  );
};

/**
 * Subcomponente: Info de fecha seleccionada
 */
const SelectedDateInfo = ({ selectedDate }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
    {selectedDate ? (
      <div>
        <p className="text-sm text-gray-500 mb-1">Fecha seleccionada:</p>
        <p className="text-lg font-medium text-gray-800">
          {selectedDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          ISO: {selectedDate.toISOString().split('T')[0]}
        </p>
      </div>
    ) : (
      <p className="text-gray-500 text-sm">
        Haz clic en una fecha del calendario
      </p>
    )}
  </div>
);

/**
 * Subcomponente: Panel de debug
 */
const DebugPanel = ({ selectedDate, config }) => (
  <div className="mt-4 bg-gray-800 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-300 mb-2">Debug</h3>
    <pre className="text-xs text-green-400 overflow-auto">
      {JSON.stringify({
        selectedDate: selectedDate?.toISOString() || null,
        timestamp: selectedDate?.getTime() || null,
        activeTab: 'automatic',
        config
      }, null, 2)}
    </pre>
  </div>
);

export default AutomaticSchedule;
