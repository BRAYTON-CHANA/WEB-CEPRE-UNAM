import { getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';

/**
 * Configuración de tabla para Requisitos Docentes (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_REQUISITOS_DOCENTES'
};

const handleView = async (row) => {
  if (!row.STORAGE_PATH) return;
  try {
    const url = await getRequisitoUrl(row.STORAGE_PATH);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error generando URL del archivo:', error);
  }
};

/**
 * Genera el levelConfig para TableMultiLevelEditable.
 * ACTIVO es editable inline.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete }) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE', type: 'string', label: 'Nombre' },
      { title: 'TIPO', type: 'string', label: 'Tipo' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'FILENAME', type: 'string', label: 'Archivo' },
      { title: 'FECHA_SUBIDA', type: 'date', label: 'Subido' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'REQUISITOS_DOCENTES', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_REQUISITO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDelete(row)
      },
      direct: [
        {
          enabled: true,
          icon: 'eye',
          label: 'Ver archivo',
          className: 'text-blue-600 hover:bg-blue-100',
          showIf: (row) => !!row.STORAGE_PATH,
          onClick: (row) => handleView(row)
        },

      ]
    }
  }
];
