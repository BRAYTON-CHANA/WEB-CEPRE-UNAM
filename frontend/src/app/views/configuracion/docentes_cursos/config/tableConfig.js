/**
 * Configuración de tabla multinivel para Docentes y Cursos
 */
export const tableConfig = {
  tableName: 'VW_DOCENTES_CURSOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getTableLevelConfigs = (docentesCrud, docenteCursoCrud, handleAddCursoToDocente) => [
  {
    level: 1,
    field: 'NOMBRE_COMPLETO',
    headers: [
      { title: 'DNI', type: 'string' },
      { title: 'TIPO_DOCENTE', type: 'string' },
      
    ],
    boundColumn: 'ID_DOCENTE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => docentesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => docentesCrud.handleDelete(row)
      },
      addCurso: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Curso',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddCursoToDocente(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE_CURSO', type: 'string' }
    ],
    boundColumn: 'ID_DOCENTE_CURSO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => docenteCursoCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => docenteCursoCrud.handleDelete(row)
      }
    }
  }
];
