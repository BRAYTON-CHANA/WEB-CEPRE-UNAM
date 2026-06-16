import React, { useState } from 'react';
import Calendar from '../components/Calendar';

/**
 * Vista Schedule - Página principal de horarios/programación
 * Muestra un calendario mensual simple con navegación
 */
const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Manejar selección de fecha
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    console.log('Fecha seleccionada:', date);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Horarios</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y gestiona la programación de sesiones
          </p>
        </div>
        
        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2">
            <Calendar 
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>
          
          {/* Panel lateral (placeholder para futuro) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detalles del día
              </h3>
              
              {selectedDate ? (
                <div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Fecha seleccionada:</span>
                  </p>
                  <p className="text-gray-800">
                    {selectedDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-500">
                    Aquí se mostrarán las sesiones programadas para esta fecha.
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Selecciona una fecha en el calendario para ver los detalles.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
