import { SCROLL_CLASSES, TABLE_CLASSES } from '../constants/tableConstants';

/**
 * Hook específico del componente Table para generar clases CSS dinámicas
 * @param {string} variant - Variante de la tabla ('default', 'compact', 'borderless')
 * @param {boolean} bordered - Si tiene bordes
 * @param {string} className - Clases adicionales
 * @param {string} headerClassName - Clases adicionales para encabezados
 * @param {string} rowClassName - Clases adicionales para filas
 * @param {boolean} hover - Si tiene efecto hover
 * @param {boolean} striped - Si es striped
 * @param {boolean} fit - Si se ajusta al ancho disponible (default: false)
 * @returns {Object} - Funciones de generación de clases CSS
 * 
 * Ejemplos de uso:
 * - fit={true}: Tabla se ajusta al ancho del contenedor (sin desbordar)
 * - fit={false}: Tabla puede desbordar del contenedor (scrolleable)
 */
export const useTableStyles = ({
  variant = 'default',
  bordered = true,
  className = '',
  headerClassName = '',
  rowClassName = '',
  hover = true,
  striped = false,
  fit = false
}) => {
  const getTableClasses = () => {
    return `
      ${fit ? 'w-full table-fixed text-xs' : 'min-w-full text-sm'} bg-white rounded-lg overflow-hidden
      ${variant === 'compact' ? (fit ? 'text-xs' : 'text-sm') : ''}
      ${variant === 'borderless' ? 'border-0' : ''}
      ${bordered ? 'border border-gray-200' : ''}
      ${className}
    `.trim();
  };

  const getContainerClasses = () => {
    if (fit) {
      // Modo fit: sin scroll, tabla se ajusta al ancho del contenedor
      return 'relative w-full overflow-hidden';
    } else {
      // Modo scroll: permite desbordar con scroll horizontal
      return `relative ${SCROLL_CLASSES.scroll}`;
    }
  };

  const getHeaderClasses = () => {
    return `
      ${variant === 'default' ? 'bg-gray-50' : ''}
      ${variant === 'compact' ? 'bg-gray-100' : ''}
      ${fit ? TABLE_CLASSES.header.fitBase : TABLE_CLASSES.header.base}
      ${headerClassName}
    `.trim();
  };

  const getInteractiveClasses = () => {
    return fit ? 'text-xs' : 'text-sm';
  };

  const getCellClasses = () => {
    return fit ? TABLE_CLASSES.header.fitCell : TABLE_CLASSES.header.cell;
  };

  const getRowClasses = (index, isExpanded = false) => {
    return `
      ${hover ? 'hover:bg-gray-50' : ''}
      ${striped && index % 2 === 0 ? 'bg-gray-50' : ''}
      ${isExpanded ? 'bg-blue-50' : ''}
      ${rowClassName}
    `.trim();
  };

  return {
    getTableClasses,
    getHeaderClasses,
    getRowClasses,
    getContainerClasses,
    getCellClasses,
    getInteractiveClasses
  };
};
