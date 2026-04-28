import React, { useState, useMemo } from 'react';
import AutomaticSchedule from './components/AutomaticSchedule';
import CustomSchedule from './components/CustomSchedule';

/**
 * Vista de prueba para el calendario de horarios
 * Usada para desarrollo y testing del feature schedule
 */
const TestSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('automatic'); // 'automatic' | 'custom'
  
  // Configuración de horas para testing - Modo Automático
  const [startHour, setStartHour] = useState(8);
  const [finalHour, setFinalHour] = useState(18);
  const [blockSeparation, setBlockSeparation] = useState(60);
  
  // Configuración para Modo Custom Blocks
  const [customStartHour, setCustomStartHour] = useState(7);
  const [customFinalHour, setCustomFinalHour] = useState(19);
  
  // Ejemplo de bloques personalizados (jornada escolar típica)
  const customBlocksExample = useMemo(() => [
    { duration: 50, type: 'clase', label: 'Bloque 1' },
    { duration: 50, type: 'clase', label: 'Bloque 2' },
    { duration: 20, type: 'clase', label: 'Bloque 3' }, // Para llegar al break de 9:00
    { duration: 15, type: 'break', label: 'Recreo 9:00' },
    { duration: 50, type: 'clase', label: 'Bloque 4' },
    { duration: 50, type: 'clase', label: 'Bloque 5' },
    { duration: 50, type: 'clase', label: 'Bloque 6' },
    { duration: 50, type: 'clase', label: 'Bloque 7' },
    { duration: 50, type: 'clase', label: 'Bloque 8' },
    { duration: 50, type: 'clase', label: 'Bloque 9' },
    { duration: 50, type: 'clase', label: 'Bloque 10' },
    { duration: 50, type: 'clase', label: 'Bloque 11' },
    { duration: 50, type: 'clase', label: 'Bloque 12' },
    { duration: 15, type: 'clase', label: 'Bloque 13' }, // Para llegar al break de 17:00
    { duration: 15, type: 'break', label: 'Recreo 17:00' },
    { duration: 50, type: 'clase', label: 'Bloque 14' },
    { duration: 55, type: 'clase', label: 'Bloque 15' } // Último bloque hasta 19:00
  ], []);
  
  // Ejemplo de eventos de prueba
  const exampleEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
      {
        id: 'event-1',
        date: today,
        blockIndices: [0], // Solo bloque 1 (clase)
        title: 'Matemáticas',
        description: 'Álgebra lineal y matrices',
        titleClassName: 'text-sm font-bold',
        descriptionClassName: 'text-xs',
        type: 'clase',
        color: '#3B82F6'
      },
      {
        id: 'event-2',
        date: today,
        blockIndices: [1, 2], // Bloques 4 y 5 (saltando el break del medio)
        title: 'Proyecto Integrador',
        description: 'Investigación y desarrollo',
        type: 'proyecto',
        color: '#10B981'
      },
      {
        id: 'event-3',
        date: today,
        blockIndices: [4,5], // Intenta incluir break (bloque 3 es break)
        title: 'Física ',
        description: 'Mecánica clásica y termodinámica',
        type: 'clase',
        color: '#EF4444'
      },
      {
        id: 'event-4',
        date: tomorrow,
        blockIndices: [0,1,2, 4],
        title: 'Sesión Completa',
        description: 'Taller intensivo de programación',
        type: 'taller',
        // Sin color - se generará aleatorio
      },
      {
        id: 'event-5',
        date: nextWeek,
        blockIndices: [4],
        title: 'Química',
        type: 'clase',
        color: '#8B5CF6'
      }
    ];
  }, []);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    console.log('Fecha seleccionada:', date.toISOString());
  };
  
  return (
    <div className="bg-white p-6 w-full max-w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Test - Calendario de Horarios</h1>
      <p className="text-gray-600 mb-6">Vista de prueba para el componente Calendar</p>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('automatic')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'automatic'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Modo Automático
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Modo Custom Blocks
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'automatic' ? (
          <AutomaticSchedule
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            startHour={startHour}
            setStartHour={setStartHour}
            finalHour={finalHour}
            setFinalHour={setFinalHour}
            blockSeparation={blockSeparation}
            setBlockSeparation={setBlockSeparation}
          />
        ) : (
          <CustomSchedule
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            customStartHour={customStartHour}
            setCustomStartHour={setCustomStartHour}
            customFinalHour={customFinalHour}
            setCustomFinalHour={setCustomFinalHour}
            customBlocks={customBlocksExample}
            events={exampleEvents}
            disableSelectionHighlight={true}
          />
        )}
      </div>
    </div>
  );
};

export default TestSchedule;
