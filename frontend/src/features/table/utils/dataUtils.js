import { getUniqueValues } from '../../../shared/utils/dataUtils';

/**
 * Función para obtener valores únicos contextuales para una columna específica
 * @param {Array} data - Datos originales
 * @param {Object} activeFilters - Filtros activos
 * @param {string} columnHeader - Columna a analizar (puede ser title o header original)
 * @returns {Array} - Valores únicos contextuales
 */
export const getContextualUniqueValues = (data, activeFilters, columnHeader) => {
  // Crear una copia de los filtros activos sin incluir la columna actual
  const otherColumnFilters = { ...activeFilters };
  delete otherColumnFilters[columnHeader];
  
  // Aplicar filtros de otras columnas para obtener datos contextuales
  let contextualData = [...data];
  if (Object.keys(otherColumnFilters).length > 0) {
    contextualData = contextualData.filter(row => {
      return Object.entries(otherColumnFilters).every(([column, values]) => {
        if (!values || values.length === 0) return true;
        // CORRECCIÓN: Usar 'column' en lugar de 'columnHeader'
        const rowValue = row[column];
        return values.includes(rowValue);
      });
    });
  }
  
  return getUniqueValues(contextualData, columnHeader);
};

/**
 * Función para obtener valores originales (sin filtros de otras columnas)
 * @param {Array} data - Datos originales
 * @param {string} columnHeader - Columna a analizar
 * @returns {Array} - Valores únicos originales
 */
export const getOriginalUniqueValues = (data, columnHeader) => {
  return getUniqueValues(data, columnHeader);
};
