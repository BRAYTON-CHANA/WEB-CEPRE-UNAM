/**
 * Configuración de tabla multinivel para Plazas Docentes
 * Nivel 1: SEDES
 * Nivel 2: VW_PLAZA_DOCENTE_ASIGNADA (plaza + docente aceptado)
 */

/**
 * Config del nivel 1 (sedes) para TableMultiLevelEditable.
 */
export const getSedesLevelConfig = (plazasCrud, handleAddPlaza) => ({
  level: 1,
  headers: [
    { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' }
  ],
  boundColumn: 'ID_SEDE',
  childCountLabel: { singular: 'plaza', plural: 'plazas' },
  actions: {
    addPlaza: {
      enabled: true,
      icon: 'plus',
      label: 'Añadir Plaza',
      className: 'text-green-600 hover:bg-green-100',
      onClick: (row) => handleAddPlaza(row)
    }
  }
});

/**
 * Config del nivel 2 (plazas) para TableMultiLevelEditable.
 * Solo CRUD de slots. Las postulaciones se gestionan desde ConvocatoriasPanel.
 */
export const getPlazasLevelConfig = (plazasCrud) => ({
  level: 2,
  headers: [
    { title: 'IDENTIFICADOR_DOCENTE', type: 'string', label: 'Identificador' },
    { title: 'NOMBRE_CURSO', type: 'string', label: 'Curso' },
    { title: 'PAGO_POR_HORA', type: 'number', label: 'Pago/Hora' },
    {
      title: 'DOCENTE_NOMBRE',
      type: 'stacked',
      label: 'Docente Asignado',
      displayValue: (row) => {
        const nombre = row.DOCENTE_NOMBRE;
        if (nombre === 'Sin asignar' || !nombre) return { primary: 'Sin asignar', secondary: null };
        const ruc = row.RUC ? `RUC: ${row.RUC}` : '';
        const dni = row.DNI ? `DNI: ${row.DNI}` : '';
        const extras = [ruc, dni].filter(Boolean).join(' - ');
        return { primary: nombre, secondary: extras || null };
      }
    },
    { title: 'FECHA_ACEPTACION', type: 'date', label: 'Fecha Aceptación' },
    { title: 'FECHA_CONTRATO', type: 'date', label: 'Fecha Contrato' },
    { title: 'PLAZA_ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'ACTIVO' }
  ],
  boundColumn: 'ID_PLAZA_DOCENTE',
  actions: {
    edit: {
      enabled: true,
      icon: 'edit',
      label: 'Editar',
      className: 'text-blue-600 hover:bg-blue-100',
      onClick: (row) => plazasCrud.handleEdit(row)
    },
    delete: {
      enabled: true,
      icon: 'trash',
      label: 'Eliminar',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row) => plazasCrud.handleDelete(row)
    }
  }
});
