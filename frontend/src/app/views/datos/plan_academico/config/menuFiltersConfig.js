// ==========================================
// CONFIGURACIÓN DE FILTROS
// ==========================================

export const menuFilters = {
  enabled: true,
  position: 'top',
  collapsible: false,
  defaultExpanded: true,
  fields: [
    {
      name: 'ID_PERIODO',
      type: 'reference-select',
      label: 'Filtrar por Período',
      placeholder: 'Seleccione un período',
      referenceTable: 'PERIODOS',
      referenceField: 'ID_PERIODO',
      referenceQuery: '{CODIGO_PERIODO}',
      op: '='
    },
    {
      name: 'ID_AREA',
      type: 'reference-select',
      label: 'Filtrar por Área',
      placeholder: 'Seleccione un área',
      referenceTable: 'AREAS',
      referenceField: 'ID_AREA',
      referenceQuery: '{NOMBRE_AREA}',
      op: '='
    }
  ]
};
