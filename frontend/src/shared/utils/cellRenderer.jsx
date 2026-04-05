import React from 'react';

/**
 * Utilidades reutilizables para renderizado de celdas
 */

/**
 * Renderiza una celda según el tipo de dato (reutilizable)
 * @param {*} value - Valor a renderizar
 * @param {number} rowIndex - Índice de la fila
 * @param {string} header - Nombre de la columna
 * @returns {React.ReactNode} - Elemento React renderizado
 */
export const renderCell = (value, rowIndex, header) => {
  // Manejo de valores nulos o indefinidos
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  
  // Manejo de booleanos
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Sí' : 'No'}
      </span>
    );
  }
  
  // Manejo de objetos (no arrays)
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (
      <span className="text-xs text-gray-600">
        {JSON.stringify(value)}
      </span>
    );
  }
  
  // Manejo de arrays
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {item}
          </span>
        ))}
      </div>
    );
  }
  
  // Manejo de strings y números (por defecto)
  return String(value);
};

/**
 * Formatea un valor para mostrar en la tabla (reutilizable)
 * @param {*} value - Valor a formatear
 * @param {string} type - Tipo de formateo ('currency', 'date', 'percentage')
 * @param {string} locale - Configuración regional (por defecto 'es-ES')
 * @returns {string} - Valor formateado
 */
export const formatCellValue = (value, type = 'text', locale = 'es-ES') => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString(locale);
      }
      return new Date(value).toLocaleDateString(locale);
    
    case 'percentage':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2
      }).format(value);
    
    case 'number':
      return new Intl.NumberFormat(locale).format(value);
    
    default:
      return String(value);
  }
};
