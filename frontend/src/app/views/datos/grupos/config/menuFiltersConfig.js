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
      name: 'ID_SEDE',
      type: 'reference-select',
      label: 'Filtrar por Sede',
      placeholder: 'Seleccione una sede',
      referenceTable: 'SEDES',
      referenceField: 'ID_SEDE',
      referenceQuery: '{NOMBRE_SEDE}',
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
    },
    {
      name: 'ID_TURNO',
      type: 'reference-select',
      label: 'Filtrar por Turno',
      placeholder: 'Seleccione un turno',
      referenceTable: 'TURNOS',
      referenceField: 'ID_TURNO',
      referenceQuery: '{NOMBRE_TURNO}',
      op: '='
    }
  ]
};
