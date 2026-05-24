import React from 'react';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function FechaCard({ fechaInfo, seleccionada, onClick }) {
  const { fecha, totalClases, totalGrupos } = fechaInfo;
  
  const fechaObj = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const esHoy = fechaObj.getTime() === hoy.getTime();
  const esPasado = fechaObj < hoy;
  const esFuturo = fechaObj > hoy;
  
  const diaNombre = diasSemana[fechaObj.getDay()];
  const diaNumero = fechaObj.getDate();
  const mesNombre = meses[fechaObj.getMonth()];
  
  const baseClasses = "cursor-pointer rounded-xl border p-5 transition-all duration-200 hover:shadow-lg";
  const stateClasses = seleccionada
    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
    : esHoy
      ? "border-green-400 bg-green-50 hover:border-green-500"
      : esPasado
        ? "border-gray-200 bg-gray-50 opacity-60"
        : "border-gray-200 bg-white hover:border-blue-300";

  return (
    <div 
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Fecha grande */}
          <div className={`text-center min-w-[60px] ${esHoy ? 'text-green-700' : 'text-gray-700'}`}>
            <div className="text-xs font-medium uppercase tracking-wide">{mesNombre}</div>
            <div className="text-3xl font-bold">{diaNumero}</div>
            <div className="text-xs text-gray-500">{diaNombre}</div>
          </div>
          
          {/* Badge Hoy */}
          {esHoy && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              HOY
            </span>
          )}
        </div>
        
        {/* Stats */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="text-lg font-bold text-blue-600">{totalClases}</span>
            <span className="text-sm">clases</span>
          </div>
          <div className="text-xs text-gray-500">
            en {totalGrupos} grupo{totalGrupos !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
