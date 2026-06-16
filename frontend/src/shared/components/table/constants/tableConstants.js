// Constants para el componente Table

// Valores por defecto de props
export const TABLE_DEFAULTS = {
  // Props opcionales - Visual y Presentación
  showCount: false,
  emptyMessage: "No data",
  variant: "default",
  striped: false,
  hover: true,
  bordered: true,
  
  // Props opcionales - Funcionalidades
  sortable: false,
  selectable: false,
  expandable: false,
  groupable: { active: false, field: null, className: 'bg-white text-black font-semibold' },
  filterable: false,
  pagination: true,
  
  // Props opcionales - Control de Ancho
  fit: false,
  
  // Props opcionales - Selección avanzada
  boundColumn: "id",
  onGetSelects: null,
  
  // Props opcionales - Personalización
  className: "",
  headerClassName: "",
  rowClassName: "",
  cellClassName: "",
  
  // Props opcionales - Comportamiento
  loading: false,
  onRowClick: null,
  onSort: null,
  onSelect: null,
  
  // Props opcionales - Paginación
  itemsPerPage: 10,
  currentPage: 1,
  onPageChange: null
};

// Clases CSS comunes
export const TABLE_CLASSES = {
  header: {
    base: 'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    fitBase: 'px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', // Encabezado ultra-compacto para modo fit
    cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
    fitCell: 'px-2 py-1 text-xs text-gray-900 truncate' // Celda ultra-compacta para modo fit
  },
  checkbox: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2',
  loading: 'animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600', // Más pequeño en modo fit
  expandButton: 'p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-600 text-xs', // Más pequeño en modo fit
};

// Estilos mejorados para scrolls
export const SCROLL_CLASSES = {
  container: 'scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400',
  menu: 'scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300',
  thin: 'scrollbar-thin',
  normal: 'scrollbar-normal',
  fit: 'w-full table-auto', // Modo fit: tabla se ajusta al ancho disponible
  scroll: 'overflow-x-auto' // Modo scroll: scroll horizontal cuando sea necesario
};

// Configuraciones de paginación
export const PAGINATION_CONFIG = {
  defaultItemsPerPage: 10,
  maxItemsPerPage: 1000
};
