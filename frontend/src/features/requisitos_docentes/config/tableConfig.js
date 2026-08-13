import { getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';

/**
 * Configuración de tabla para Requisitos Docentes (2 niveles)
 * Nivel 1: Condición laboral (grupo) con botón "Añadir Requisito"
 * Nivel 2: Requisitos individuales con ver/editar/eliminar
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
 * Genera los levelConfigs para TableMultiLevelEditable.
 * Nivel 1: Condición laboral (groupBy) + botón añadir requisito
 * Nivel 2: Requisito individual (ver archivo, editar, eliminar)
 * ACTIVO es editable inline en nivel 2.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete, handleAddRequisito }) => [
  {
    level: 1,
    headers: [
      { title: 'CONDICION_LABORAL', type: 'string', groupBy: true, label: 'Condición' }
    ],
    boundColumn: 'ID_REQUISITO',
    childCountLabel: { singular: 'requisito', plural: 'requisitos' },
    actions: {
      addRequisito: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Requisito',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddRequisito(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'CLASIFICACION', type: 'string', label: 'Clasificación' },
      { title: 'NOMBRE', type: 'string', label: 'Nombre' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'REQUISITOS_DOCENTES', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_REQUISITO',
    actions: {
      direct: [
        {
          enabled: true,
          icon: 'eye',
          label: 'Ver archivo',
          className: 'text-blue-600 hover:bg-blue-100',
          showIf: (row) => !!row.STORAGE_PATH,
          onClick: (row) => handleView(row)
        }
      ],
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
      }
    }
  }
];
