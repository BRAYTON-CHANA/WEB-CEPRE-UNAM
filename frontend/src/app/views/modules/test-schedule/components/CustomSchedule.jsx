import React from 'react';
import Calendar from '@/features/schedule/components/Calendar';

/**
 * Componente CustomSchedule
 * Vista de calendario en modo custom blocks con bloques personalizados
 */
const CustomSchedule = ({
  selectedDate,
  onDateSelect,
  customStartHour,
  setCustomStartHour,
  customFinalHour,
  setCustomFinalHour,
  customBlocks,
  events = null,
  disableSelectionHighlight = false
}) => {
  return (
    <div>
      {/* Calendario */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Calendario Custom Blocks</h2>
        <Calendar 
          onDateSelect={onDateSelect}
          selectedDate={selectedDate}
          startHour={customStartHour}
          finalHour={customFinalHour}
          customBlocks={customBlocks}
          events={events}
          disableSelectionHighlight={disableSelectionHighlight}
        />
      </div>

      {/* Panel de info y config */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Información</h2>
        <SelectedDateInfo selectedDate={selectedDate} />
        
        {/* Configuración de horas - Modo Custom */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Configuración Custom Blocks</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hora Inicio Base</label>
              <select 
                value={customStartHour} 
                onChange={(e) => setCustomStartHour(Number(e.target.value))}
                className="w-full text-sm p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hora Final (Tope)</label>
              <select 
                value={customFinalHour} 
                onChange={(e) => setCustomFinalHour(Number(e.target.value))}
                className="w-full text-sm p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 25}, (_, i) => (
                  <option key={i} value={i}>
                    {i === 24 ? 'Sin límite' : `${i.toString().padStart(2, '0')}:00`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Preview de bloques */}
          <CustomBlocksPreview blocks={customBlocks} />
        </div>

        {/* Debug */}
        <DebugPanel 
          selectedDate={selectedDate}
          config={{ customStartHour, customFinalHour, customBlocks }}
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
 * Subcomponente: Preview de bloques personalizados
 */
const CustomBlocksPreview = ({ blocks }) => (
  <div className="bg-white rounded p-3 border border-gray-200">
    <h4 className="text-xs font-semibold text-gray-600 mb-2">Bloques definidos:</h4>
    <div className="space-y-1 max-h-32 overflow-auto">
      {blocks.map((block, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${
            block.type === 'break' ? 'bg-gray-400' : 'bg-blue-500'
          }`} />
          <span className="font-medium w-24">{block.label}</span>
          <span className="text-gray-500">{block.duration} min</span>
          <span className="text-gray-400">({block.type})</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-400 mt-2 italic">
      Nota: Los bloques que excedan el tope se truncarán u omitirán
    </p>
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
        activeTab: 'custom',
        config
      }, null, 2)}
    </pre>
  </div>
);

export default CustomSchedule;
