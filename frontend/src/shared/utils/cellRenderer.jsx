import React from 'react';

/**
 * Utilidades reutilizables para renderizado de celdas
 */

/**
 * Renderiza una celda según el tipo de dato (reutilizable)
 * @param {*} value - Valor a renderizar
 * @param {number} rowIndex - Índice de la fila
 * @param {string} header - Nombre de la columna
 * @param {string} columnType - Tipo de la columna (opcional)
 * @returns {React.ReactNode} - Elemento React renderizado
 */
export const renderCell = (value, rowIndex, header, columnType) => {
  // Manejo de valores nulos o indefinidos
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  
  // Manejo de booleanos - SOLO si la columna es de tipo boolean
  if (columnType === 'boolean' && (typeof value === 'boolean' || value === 1 || value === 0)) {
    const isTrue = value === true || value === 1;
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
        isTrue ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {isTrue ? '✓' : '✕'}
      </span>
    );
  }
  
  // Manejo de fechas (date y datetime) - Formato: YYYY/MM/DD
  if ((columnType === 'date' || columnType === 'datetime') && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return <span>{`${year}/${month}/${day}`}</span>;
      }
    } catch (e) {
      // Si falla el parsing, retornar el valor original
    }
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
