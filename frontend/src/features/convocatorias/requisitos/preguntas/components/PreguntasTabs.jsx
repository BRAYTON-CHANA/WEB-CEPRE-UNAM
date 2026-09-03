import React from 'react';

/**
 * PreguntasTabs — pestañas fijas por CONDICION_LABORAL.
 *
 * @param {Array} condiciones - [{ value, label }]
 * @param {string} activeCondicion - valor de la condición activa
 * @param {Function} onChange - callback(valor)
 */
function PreguntasTabs({ condiciones, activeCondicion, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 overflow-x-auto">
      {condiciones.map((cond) => {
        const isActive = cond.value === activeCondicion;
        return (
          <button
            key={cond.value}
            onClick={() => onChange(cond.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-[#25346A] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-pressed={isActive}
          >
            {cond.label}
          </button>
        );
      })}
    </div>
  );
}

export default PreguntasTabs;
