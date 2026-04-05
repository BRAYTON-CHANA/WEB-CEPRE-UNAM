/**
 * Utilidades para manejo de datos en tablas
 */

/**
 * Determina el tipo de dato de una columna basado en una muestra de datos
 * @param {Array} data - Array de datos
 * @param {string} header - Nombre de la columna
 * @returns {string} - Tipo de dato: 'string', 'number', 'boolean', 'date'
 */
export const getDataType = (data, header) => {
  if (data.length === 0) return 'string';
  
  const sampleValue = data.find(row => row[header] !== null && row[header] !== undefined)?.[header];
  
  // Console log para debug de detección de tipos (solo en desarrollo y para primeras columnas)
  if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
    console.log(`🔍 Analizando tipo para columna "${header}":`, {
      sampleValue,
      sampleValueType: typeof sampleValue,
      dataLength: data.length,
      nonNullValues: data.filter(row => row[header] !== null && row[header] !== undefined).length
    });
  }
  
  if (sampleValue === null || sampleValue === undefined) return 'string';
  
  // Detectar booleanos primero (incluyendo representaciones como strings y números)
  if (typeof sampleValue === 'boolean') {
    if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
      console.log(`✅ Columna "${header}" detectada como BOOLEAN (nativo)`);
    }
    return 'boolean';
  }
  
  // Detectar booleanos representados como strings
  if (typeof sampleValue === 'string') {
    const lowerValue = sampleValue.toLowerCase().trim();
    if (lowerValue === 'true' || lowerValue === 'false') {
      if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
        console.log(`✅ Columna "${header}" detectada como BOOLEAN (string)`);
      }
      return 'boolean';
    }
    
    // Intentar detectar fecha en string
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (dateRegex.test(sampleValue)) {
      if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
        console.log(`✅ Columna "${header}" detectada como DATE (string)`);
      }
      return 'date';
    }
  }
  
  // Detectar booleanos representados como números (0/1)
  if (typeof sampleValue === 'number') {
    // Verificar si todos los valores en la columna son 0 o 1
    const isBooleanColumn = data.every(row => {
      const value = row[header];
      return value === null || value === undefined || value === 0 || value === 1;
    });
    
    if (isBooleanColumn) {
      if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
        console.log(`✅ Columna "${header}" detectada como BOOLEAN (number)`);
      }
      return 'boolean';
    }
    if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
      console.log(`✅ Columna "${header}" detectada como NUMBER`);
    }
    return 'number';
  }
  
  if (sampleValue instanceof Date) {
    if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
      console.log(`✅ Columna "${header}" detectada como DATE (object)`);
    }
    return 'date';
  }
  
  if (process.env.NODE_ENV === 'development' && (header === 'name' || header === 'age')) {
    console.log(`✅ Columna "${header}" detectada como STRING (default)`);
  }
  return 'string';
};

/**
 * Procesa un header para extraer title y type de manera uniforme
 * @param {string|Object} header - Header como string u objeto {title, type}
 * @returns {Object} - Objeto con title y type
 */
export const processHeader = (header) => {
  // Procesamiento sin logs para evitar spam
  if (typeof header === 'string') {
    return { title: header, type: 'string' };
  }
  
  return {
    title: header.title || 'Unknown',
    type: header.type || 'string'
  };
};

/**
 * Obtiene valores únicos de una columna
 * @param {Array} data - Array de datos
 * @param {string} header - Nombre de la columna
 * @returns {Array} - Array de valores únicos
 */
export const getUniqueValues = (data, header) => {
  const values = new Set();
  
  data.forEach(row => {
    const value = row[header];
    if (value !== null && value !== undefined) {
      values.add(value);
    }
  });
  
  return Array.from(values).sort((a, b) => {
    // Ordenamiento por tipo
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    return String(a).localeCompare(String(b));
  });
};

/**
 * Ordena datos según columna y tipo
 * @param {Array} data - Array de datos
 * @param {string} key - Columna para ordenar
 * @param {string} type - Tipo de ordenamiento
 * @returns {Array} - Datos ordenados
 */
export const sortData = (data, key, type) => {
  const sortedData = [...data];
  
  switch (type) {
    case 'numeric-asc':
      return sortedData.sort((a, b) => (a[key] || 0) - (b[key] || 0));
    case 'numeric-desc':
      return sortedData.sort((a, b) => (b[key] || 0) - (a[key] || 0));
    case 'date-asc':
      return sortedData.sort((a, b) => new Date(a[key] || 0) - new Date(b[key] || 0));
    case 'date-desc':
      return sortedData.sort((a, b) => new Date(b[key] || 0) - new Date(a[key] || 0));
    case 'boolean-true':
      return sortedData.sort((a, b) => {
        const aVal = a[key] === true || a[key] === 'true' || a[key] === 1 ? 1 : 0;
        const bVal = b[key] === true || b[key] === 'true' || b[key] === 1 ? 1 : 0;
        return bVal - aVal;
      });
    case 'boolean-false':
      return sortedData.sort((a, b) => {
        const aVal = a[key] === true || a[key] === 'true' || a[key] === 1 ? 1 : 0;
        const bVal = b[key] === true || b[key] === 'true' || b[key] === 1 ? 1 : 0;
        return aVal - bVal;
      });
    case 'az':
      return sortedData.sort((a, b) => String(a[key] || '').localeCompare(String(b[key] || '')));
    case 'za':
      return sortedData.sort((a, b) => String(b[key] || '').localeCompare(String(a[key] || '')));
    default:
      return sortedData;
  }
};

/**
 * Filtra datos según múltiples criterios
 * @param {Array} data - Array de datos
 * @param {Object} filters - Objeto de filtros {columna: [valores]}
 * @returns {Array} - Datos filtrados
 */
export const filterData = (data, filters) => {
  return data.filter(row => {
    return Object.entries(filters).every(([column, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(row[column]);
    });
  });
};

/**
 * Busca texto en múltiples campos
 * @param {Array} data - Array de datos
 * @param {string} query - Texto a buscar
 * @param {Array} fields - Campos donde buscar (opcional)
 * @returns {Array} - Datos filtrados
 */
export const searchData = (data, query, fields = null) => {
  if (!query || query.trim() === '') return data;
  
  const searchTerm = query.toLowerCase().trim();
  const searchFields = fields || Object.keys(data[0] || {});
  
  return data.filter(row => {
    return searchFields.some(field => {
      const value = row[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm);
    });
  });
};

/**
 * Pagina datos
 * @param {Array} data - Array de datos
 * @param {number} page - Página actual (1-based)
 * @param {number} itemsPerPage - Items por página
 * @returns {Array} - Datos paginados
 */
export const paginateData = (data, page, itemsPerPage) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
};

/**
 * Calcula estadísticas básicas de una columna numérica
 * @param {Array} data - Array de datos
 * @param {string} column - Columna a analizar
 * @returns {Object} - Estadísticas {count, sum, avg, min, max}
 */
export const getColumnStats = (data, column) => {
  const numericData = data
    .map(row => row[column])
    .filter(value => value !== null && value !== undefined && !isNaN(Number(value)))
    .map(Number);
  
  if (numericData.length === 0) {
    return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
  }
  
  const sum = numericData.reduce((acc, val) => acc + val, 0);
  const avg = sum / numericData.length;
  const min = Math.min(...numericData);
  const max = Math.max(...numericData);
  
  return {
    count: numericData.length,
    sum,
    avg: Number(avg.toFixed(2)),
    min,
    max
  };
};

/**
 * Exporta datos a diferentes formatos
 * @param {Array} data - Array de datos
 * @param {string} format - Formato: 'csv', 'json', 'xlsx'
 * @param {string} filename - Nombre del archivo
 */
export const exportData = (data, format, filename = 'export') => {
  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    default:
      console.warn('Formato no soportado:', format);
  }
};

/**
 * Exporta datos a CSV
 */
const exportToCSV = (data, filename) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvData = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escapar comillas y manejar valores con comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');
  
  const csv = `${csvHeaders}\n${csvData}`;
  downloadFile(csv, `${filename}.csv`, 'text/csv');
};

/**
 * Exporta datos a JSON
 */
const exportToJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
};

/**
 * Descarga archivo en el navegador
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
